import { Request, Response } from "express";
import mongoose from "mongoose";

import { ShowSeat } from "../models/ShowSeat";
import { Show } from "../models/Show";
import { Seat } from "../models/Seat";
import { AuthRequest } from "../middleware/authMiddleware";

const LOCK_DURATION_MINUTES = 10;

export async function initializeShowSeats(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { show: showId } = req.body;

    if (!showId) {
      res.status(400).json({
        success: false,
        message: "Show ID is required",
      });
      return;
    }

    const showIdString = String(showId);

    if (!mongoose.Types.ObjectId.isValid(showIdString)) {
      res.status(400).json({
        success: false,
        message: "Invalid show ID",
      });
      return;
    }

    const show = await Show.findById(showIdString);

    if (!show) {
      res.status(404).json({
        success: false,
        message: "Show not found",
      });
      return;
    }

    const existingCount = await ShowSeat.countDocuments({
      show: showIdString,
    });

    if (existingCount > 0) {
      res.status(409).json({
        success: false,
        message: "Show seats are already initialized",
        count: existingCount,
      });
      return;
    }

    const seats = await Seat.find({
      screen: show.screen,
    }).sort({
      row: 1,
      number: 1,
    });

    if (seats.length === 0) {
      res.status(404).json({
        success: false,
        message: "No seats found for this screen",
      });
      return;
    }

    const showSeats = seats.map((seat) => ({
      show: show._id,
      seat: seat._id,
      status: "available" as const,
    }));

    const createdShowSeats =
      await ShowSeat.insertMany(showSeats);

    res.status(201).json({
      success: true,
      message: "Show seats initialized successfully",
      count: createdShowSeats.length,
    });
  } catch (error) {
    console.error(
      "Initialize show seats error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to initialize show seats",
    });
  }
}

export async function getShowSeats(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const showId = String(req.params.showId);

    if (!mongoose.Types.ObjectId.isValid(showId)) {
      res.status(400).json({
        success: false,
        message: "Invalid show ID",
      });
      return;
    }

    const show = await Show.findById(showId);

    if (!show) {
      res.status(404).json({
        success: false,
        message: "Show not found",
      });
      return;
    }

    await ShowSeat.updateMany(
      {
        show: showId,
        status: "locked",
        lockedUntil: {
          $lte: new Date(),
        },
      },
      {
        $set: {
          status: "available",
        },
        $unset: {
          lockedUntil: 1,
          lockedBy: 1,
        },
      }
    );

    const showSeats = await ShowSeat.find({
      show: showId,
    })
      .populate(
        "seat",
        "row number type price"
      )
      .populate(
        "lockedBy",
        "name email"
      )
      .sort({
        "seat.row": 1,
        "seat.number": 1,
      });

    res.json({
      success: true,
      count: showSeats.length,
      seats: showSeats,
    });
  } catch (error) {
    console.error(
      "Get show seats error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch show seats",
    });
  }
}

export async function lockShowSeats(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const showId = String(req.params.showId);
    const { seatIds } = req.body;

    if (!mongoose.Types.ObjectId.isValid(showId)) {
      res.status(400).json({
        success: false,
        message: "Invalid show ID",
      });
      return;
    }

    if (!Array.isArray(seatIds) || seatIds.length === 0) {
      res.status(400).json({
        success: false,
        message:
          "seatIds must be a non-empty array",
      });
      return;
    }

    const uniqueSeatIds = [
      ...new Set(seatIds.map(String)),
    ];

    for (const seatId of uniqueSeatIds) {
      if (
        !mongoose.Types.ObjectId.isValid(seatId)
      ) {
        res.status(400).json({
          success: false,
          message: `Invalid seat ID: ${seatId}`,
        });
        return;
      }
    }

    const show = await Show.findById(showId);

    if (!show) {
      res.status(404).json({
        success: false,
        message: "Show not found",
      });
      return;
    }

    await ShowSeat.updateMany(
      {
        show: showId,
        status: "locked",
        lockedUntil: {
          $lte: new Date(),
        },
      },
      {
        $set: {
          status: "available",
        },
        $unset: {
          lockedUntil: 1,
          lockedBy: 1,
        },
      }
    );

    const showSeats = await ShowSeat.find({
      show: showId,
      seat: {
        $in: uniqueSeatIds,
      },
    });

    if (
      showSeats.length !==
      uniqueSeatIds.length
    ) {
      res.status(400).json({
        success: false,
        message:
          "One or more seats do not belong to this show",
      });
      return;
    }

    const unavailableSeats =
      showSeats.filter(
        (showSeat) =>
          showSeat.status !== "available"
      );

    if (unavailableSeats.length > 0) {
      res.status(409).json({
        success: false,
        message:
          "One or more selected seats are unavailable",
        unavailableSeatIds:
          unavailableSeats.map(
            (showSeat) =>
              showSeat.seat.toString()
          ),
      });
      return;
    }

    const lockedUntil = new Date(
      Date.now() +
        LOCK_DURATION_MINUTES *
          60 *
          1000
    );

    const userId = new mongoose.Types.ObjectId(
      req.userId
    );

    const lockedSeats = [];

    for (const seatId of uniqueSeatIds) {
      const lockedSeat =
        await ShowSeat.findOneAndUpdate(
          {
            show: showId,
            seat: seatId,
            status: "available",
          },
          {
            $set: {
              status: "locked",
              lockedUntil,
              lockedBy: userId,
            },
          },
          {
            new: true,
          }
        );

      if (!lockedSeat) {
        await ShowSeat.updateMany(
          {
            show: showId,
            seat: {
              $in: uniqueSeatIds,
            },
            status: "locked",
            lockedBy: userId,
          },
          {
            $set: {
              status: "available",
            },
            $unset: {
              lockedUntil: 1,
              lockedBy: 1,
            },
          }
        );

        res.status(409).json({
          success: false,
          message:
            "One or more seats were taken by another user",
        });

        return;
      }

      lockedSeats.push(lockedSeat);
    }

    res.json({
      success: true,
      message: `Seats locked for ${LOCK_DURATION_MINUTES} minutes`,
      lockedUntil,
      seats: lockedSeats,
    });
  } catch (error) {
    console.error(
      "Lock show seats error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to lock seats",
    });
  }
}

export async function unlockShowSeats(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

     console.log("========== LOCK DEBUG ==========");
    console.log("req.userId:", req.userId);
    console.log("showId:", req.params.showId);
    console.log("seatIds:", req.body.seatIds);
    console.log("================================");

    const showId = String(req.params.showId);
    const { seatIds } = req.body;

    if (!mongoose.Types.ObjectId.isValid(showId)) {
      res.status(400).json({
        success: false,
        message: "Invalid show ID",
      });
      return;
    }

    if (!Array.isArray(seatIds) || seatIds.length === 0) {
      res.status(400).json({
        success: false,
        message:
          "seatIds must be a non-empty array",
      });
      return;
    }

    const uniqueSeatIds = [
      ...new Set(seatIds.map(String)),
    ];

    for (const seatId of uniqueSeatIds) {
      if (
        !mongoose.Types.ObjectId.isValid(seatId)
      ) {
        res.status(400).json({
          success: false,
          message: `Invalid seat ID: ${seatId}`,
        });
        return;
      }
    }

    const userId = new mongoose.Types.ObjectId(
      req.userId
    );

    const result = await ShowSeat.updateMany(
      {
        show: showId,
        seat: {
          $in: uniqueSeatIds,
        },
        status: "locked",
        lockedBy: userId,
      },
      {
        $set: {
          status: "available",
        },
        $unset: {
          lockedUntil: 1,
          lockedBy: 1,
        },
      }
    );

    res.json({
      success: true,
      message: "Seats unlocked successfully",
      unlockedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error(
      "Unlock show seats error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to unlock seats",
    });
  }
}
