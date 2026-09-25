import { Response } from "express";
import mongoose from "mongoose";

import { Booking } from "../models/Booking";
import { Show } from "../models/Show";
import { ShowSeat } from "../models/ShowSeat";

import { AuthRequest } from "../middleware/authMiddleware";

export const getReports = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });

      return;
    }

    const [
      totalBookings,
      confirmedBookings,
      pendingBookings,
      cancelledBookings,
      salesResult,
      popularMovies,
      theatreOccupancy,
      bookingTrends,
    ] = await Promise.all([
      Booking.countDocuments(),

      Booking.countDocuments({
        status: "confirmed",
      }),

      Booking.countDocuments({
        status: "pending",
      }),

      Booking.countDocuments({
        status: "cancelled",
      }),

      Booking.aggregate([
        {
          $match: {
            status: "confirmed",
          },
        },
        {
          $group: {
            _id: null,
            totalSales: {
              $sum: "$totalAmount",
            },
          },
        },
      ]),

      Booking.aggregate([
        {
          $match: {
            status: "confirmed",
          },
        },
        {
          $unwind: "$seats",
        },
        {
          $lookup: {
            from: "shows",
            localField: "show",
            foreignField: "_id",
            as: "show",
          },
        },
        {
          $unwind: "$show",
        },
        {
          $lookup: {
            from: "movies",
            localField: "show.movie",
            foreignField: "_id",
            as: "movie",
          },
        },
        {
          $unwind: "$movie",
        },
        {
          $group: {
            _id: "$movie._id",
            movieTitle: {
              $first: "$movie.title",
            },
            bookings: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            bookings: -1,
          },
        },
        {
          $limit: 10,
        },
      ]),

      Show.aggregate([
        {
          $lookup: {
            from: "showseats",
            localField: "_id",
            foreignField: "show",
            as: "showSeats",
          },
        },
        {
          $unwind: "$showSeats",
        },
        {
          $lookup: {
            from: "theatres",
            localField: "theatre",
            foreignField: "_id",
            as: "theatre",
          },
        },
        {
          $unwind: "$theatre",
        },
        {
          $group: {
            _id: "$theatre._id",
            theatreName: {
              $first: "$theatre.name",
            },
            totalSeats: {
              $sum: 1,
            },
            bookedSeats: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$showSeats.status",
                      "booked",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        {
          $project: {
            _id: 1,
            theatreName: 1,
            totalSeats: 1,
            bookedSeats: 1,
            occupancyRate: {
              $cond: [
                {
                  $gt: [
                    "$totalSeats",
                    0,
                  ],
                },
                {
                  $multiply: [
                    {
                      $divide: [
                        "$bookedSeats",
                        "$totalSeats",
                      ],
                    },
                    100,
                  ],
                },
                0,
              ],
            },
          },
        },
        {
          $sort: {
            occupancyRate: -1,
          },
        },
      ]),

      Booking.aggregate([
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: "Asia/Kolkata",
              },
            },
            bookings: {
              $sum: 1,
            },
            sales: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "confirmed",
                    ],
                  },
                  "$totalAmount",
                  0,
                ],
              },
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
        {
          $limit: 30,
        },
      ]),
    ]);

    const totalSales =
      salesResult[0]?.totalSales || 0;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalBookings,
          confirmedBookings,
          pendingBookings,
          cancelledBookings,
          totalSales,
        },
        popularMovies,
        theatreOccupancy,
        bookingTrends,
      },
    });
  } catch (error) {
    console.error(
      "Get reports error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to generate reports",
    });
  }
};