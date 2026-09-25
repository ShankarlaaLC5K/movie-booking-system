import { Request, Response } from "express";
import mongoose from "mongoose";
import { Screen } from "../models/Screen";
import { Theatre } from "../models/Theatre";

export async function createScreen(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { theatre, name, totalSeats } = req.body;

    if (!theatre || !name || totalSeats === undefined) {
      res.status(400).json({
        success: false,
        message: "Theatre, screen name and total seats are required",
      });
      return;
    }

    const theatreId = String(theatre);

    if (!mongoose.Types.ObjectId.isValid(theatreId)) {
      res.status(400).json({
        success: false,
        message: "Invalid theatre ID",
      });
      return;
    }

    const theatreExists = await Theatre.findById(theatreId);

    if (!theatreExists) {
      res.status(404).json({
        success: false,
        message: "Theatre not found",
      });
      return;
    }

    const seats = Number(totalSeats);

    if (!Number.isInteger(seats) || seats < 1) {
      res.status(400).json({
        success: false,
        message: "Total seats must be a positive integer",
      });
      return;
    }

    const screen = await Screen.create({
      theatre: theatreId,
      name: String(name).trim(),
      totalSeats: seats,
    });

    res.status(201).json({
      success: true,
      message: "Screen created successfully",
      screen,
    });
  } catch (error) {
    console.error("Create screen error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create screen",
    });
  }
}

export async function getScreensByTheatre(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const theatreId = String(req.params.theatreId);

    if (!mongoose.Types.ObjectId.isValid(theatreId)) {
      res.status(400).json({
        success: false,
        message: "Invalid theatre ID",
      });
      return;
    }

    const theatreExists = await Theatre.findById(theatreId);

    if (!theatreExists) {
      res.status(404).json({
        success: false,
        message: "Theatre not found",
      });
      return;
    }

    const screens = await Screen.find({
      theatre: theatreId,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: screens.length,
      screens,
    });
  } catch (error) {
    console.error("Get screens error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch screens",
    });
  }
}

export async function getScreen(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const screenId = String(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(screenId)) {
      res.status(400).json({
        success: false,
        message: "Invalid screen ID",
      });
      return;
    }

    const screen = await Screen.findById(screenId).populate(
      "theatre",
      "name address city state pincode"
    );

    if (!screen) {
      res.status(404).json({
        success: false,
        message: "Screen not found",
      });
      return;
    }

    res.json({
      success: true,
      screen,
    });
  } catch (error) {
    console.error("Get screen error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch screen",
    });
  }
}

export async function updateScreen(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const screenId = String(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(screenId)) {
      res.status(400).json({
        success: false,
        message: "Invalid screen ID",
      });
      return;
    }

    const { name, totalSeats } = req.body;

    const updateData: {
      name?: string;
      totalSeats?: number;
    } = {};

    if (name !== undefined) {
      const trimmedName = String(name).trim();

      if (!trimmedName) {
        res.status(400).json({
          success: false,
          message: "Screen name cannot be empty",
        });
        return;
      }

      updateData.name = trimmedName;
    }

    if (totalSeats !== undefined) {
      const seats = Number(totalSeats);

      if (!Number.isInteger(seats) || seats < 1) {
        res.status(400).json({
          success: false,
          message: "Total seats must be a positive integer",
        });
        return;
      }

      updateData.totalSeats = seats;
    }

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({
        success: false,
        message: "No fields provided for update",
      });
      return;
    }

    const screen = await Screen.findByIdAndUpdate(
      screenId,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!screen) {
      res.status(404).json({
        success: false,
        message: "Screen not found",
      });
      return;
    }

    res.json({
      success: true,
      message: "Screen updated successfully",
      screen,
    });
  } catch (error) {
    console.error("Update screen error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update screen",
    });
  }
}

export async function deleteScreen(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const screenId = String(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(screenId)) {
      res.status(400).json({
        success: false,
        message: "Invalid screen ID",
      });
      return;
    }

    const screen = await Screen.findByIdAndDelete(screenId);

    if (!screen) {
      res.status(404).json({
        success: false,
        message: "Screen not found",
      });
      return;
    }

    res.json({
      success: true,
      message: "Screen deleted successfully",
    });
  } catch (error) {
    console.error("Delete screen error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete screen",
    });
  }
}
