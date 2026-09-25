import { Request, Response } from "express";
import mongoose from "mongoose";
import { Seat } from "../models/Seat";
import { Screen } from "../models/Screen";

export async function generateSeats(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { screen, rows, seatsPerRow } = req.body;

    if (!screen || rows === undefined || seatsPerRow === undefined) {
      res.status(400).json({
        success: false,
        message: "Screen, rows and seatsPerRow are required",
      });
      return;
    }

    const screenId = String(screen);

    if (!mongoose.Types.ObjectId.isValid(screenId)) {
      res.status(400).json({
        success: false,
        message: "Invalid screen ID",
      });
      return;
    }

    const screenExists = await Screen.findById(screenId);

    if (!screenExists) {
      res.status(404).json({
        success: false,
        message: "Screen not found",
      });
      return;
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      res.status(400).json({
        success: false,
        message: "Rows must be a non-empty array",
      });
      return;
    }

    const seatCount = Number(seatsPerRow);

    if (!Number.isInteger(seatCount) || seatCount < 1) {
      res.status(400).json({
        success: false,
        message: "seatsPerRow must be a positive integer",
      });
      return;
    }

    const existingSeats = await Seat.countDocuments({
      screen: screenId,
    });

    if (existingSeats > 0) {
      res.status(409).json({
        success: false,
        message: "Seats already exist for this screen",
      });
      return;
    }

    const totalSeatsToCreate = rows.length * seatCount;

    if (totalSeatsToCreate !== screenExists.totalSeats) {
      res.status(400).json({
        success: false,
        message: `Seat configuration creates ${totalSeatsToCreate} seats, but screen capacity is ${screenExists.totalSeats}`,
      });
      return;
    }

    const seats = [];

    for (const row of rows) {
      const rowName = String(row).trim().toUpperCase();

      if (!rowName) {
        continue;
      }

      for (let number = 1; number <= seatCount; number++) {
        let type: "regular" | "premium" | "recliner" = "regular";
        let price = 150;

        if (rows.indexOf(row) >= rows.length - 2) {
          type = "premium";
          price = 200;
        }

        seats.push({
          screen: screenId,
          row: rowName,
          number,
          type,
          price,
        });
      }
    }

    if (seats.length !== screenExists.totalSeats) {
      res.status(400).json({
        success: false,
        message: "Generated seat count does not match screen capacity",
      });
      return;
    }

    const createdSeats = await Seat.insertMany(seats);

    res.status(201).json({
      success: true,
      message: "Seats generated successfully",
      count: createdSeats.length,
      seats: createdSeats,
    });
  } catch (error) {
    console.error("Generate seats error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to generate seats",
    });
  }
}

export async function getSeatsByScreen(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const screenId = String(req.params.screenId);

    if (!mongoose.Types.ObjectId.isValid(screenId)) {
      res.status(400).json({
        success: false,
        message: "Invalid screen ID",
      });
      return;
    }

    const screenExists = await Screen.findById(screenId);

    if (!screenExists) {
      res.status(404).json({
        success: false,
        message: "Screen not found",
      });
      return;
    }

    const seats = await Seat.find({
      screen: screenId,
    }).sort({
      row: 1,
      number: 1,
    });

    res.json({
      success: true,
      count: seats.length,
      seats,
    });
  } catch (error) {
    console.error("Get seats error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch seats",
    });
  }
}

export async function deleteSeatsByScreen(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const screenId = String(req.params.screenId);

    if (!mongoose.Types.ObjectId.isValid(screenId)) {
      res.status(400).json({
        success: false,
        message: "Invalid screen ID",
      });
      return;
    }

    const result = await Seat.deleteMany({
      screen: screenId,
    });

    res.json({
      success: true,
      message: "Seats deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Delete seats error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete seats",
    });
  }
}
