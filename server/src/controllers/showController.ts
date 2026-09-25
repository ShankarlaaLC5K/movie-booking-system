import { Request, Response } from "express";
import mongoose from "mongoose";

import { Show } from "../models/Show";
import { Movie } from "../models/Movie";
import { Theatre } from "../models/Theatre";
import { Screen } from "../models/Screen";
import { Seat } from "../models/Seat";
import { ShowSeat } from "../models/ShowSeat";

const IST_OFFSET = "+05:30";

type ShowFormat = "2D" | "3D" | "IMAX";

interface ScheduleRequest {
  movie: string;
  theatre: string;
  screen: string;
  dates: string[];
  showTimes: string[];
  language: string;
  format?: ShowFormat;
  price: number;
}

export async function createShow(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const {
      movie,
      theatre,
      screen,
      startTime,
      endTime,
      language,
      format,
      price,
    } = req.body;

    if (
      !movie ||
      !theatre ||
      !screen ||
      !startTime ||
      !endTime ||
      !language ||
      price === undefined
    ) {
      res.status(400).json({
        success: false,
        message:
          "Movie, theatre, screen, startTime, endTime, language and price are required",
      });
      return;
    }

    const movieId = String(movie);
    const theatreId = String(theatre);
    const screenId = String(screen);

    if (!mongoose.Types.ObjectId.isValid(movieId)) {
      res.status(400).json({
        success: false,
        message: "Invalid movie ID",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(theatreId)) {
      res.status(400).json({
        success: false,
        message: "Invalid theatre ID",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(screenId)) {
      res.status(400).json({
        success: false,
        message: "Invalid screen ID",
      });
      return;
    }

    const movieExists = await Movie.findById(movieId);

    if (!movieExists) {
      res.status(404).json({
        success: false,
        message: "Movie not found",
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

    const screenExists = await Screen.findById(screenId);

    if (!screenExists) {
      res.status(404).json({
        success: false,
        message: "Screen not found",
      });
      return;
    }

    if (screenExists.theatre.toString() !== theatreId) {
      res.status(400).json({
        success: false,
        message: "Screen does not belong to the selected theatre",
      });
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid startTime or endTime",
      });
      return;
    }

    if (end <= start) {
      res.status(400).json({
        success: false,
        message: "End time must be after start time",
      });
      return;
    }

    const showPrice = Number(price);

    if (!Number.isFinite(showPrice) || showPrice < 0) {
      res.status(400).json({
        success: false,
        message: "Price must be a valid non-negative number",
      });
      return;
    }

    const normalizedFormat = String(
      format === undefined ? "2D" : format
    ).toUpperCase();

    if (
      normalizedFormat !== "2D" &&
      normalizedFormat !== "3D" &&
      normalizedFormat !== "IMAX"
    ) {
      res.status(400).json({
        success: false,
        message: "Format must be 2D, 3D or IMAX",
      });
      return;
    }

    const overlappingShow = await Show.findOne({
      screen: new mongoose.Types.ObjectId(screenId),
      startTime: { $lt: end },
      endTime: { $gt: start },
    });

    if (overlappingShow) {
      res.status(409).json({
        success: false,
        message:
          "Another show is already scheduled on this screen during this time",
        conflictingShow: {
          id: overlappingShow._id.toString(),
          startTime: overlappingShow.startTime,
          endTime: overlappingShow.endTime,
        },
      });
      return;
    }

    const show = await Show.create({
      movie: new mongoose.Types.ObjectId(movieId),
      theatre: new mongoose.Types.ObjectId(theatreId),
      screen: new mongoose.Types.ObjectId(screenId),
      startTime: start,
      endTime: end,
      language: String(language).trim(),
      format: normalizedFormat as ShowFormat,
      price: showPrice,
    });

    const seats = await Seat.find({
      screen: new mongoose.Types.ObjectId(screenId),
    });

    if (seats.length > 0) {
      await ShowSeat.insertMany(
        seats.map((seat) => ({
          show: show._id,
          seat: seat._id,
          status: "available" as const,
        }))
      );
    }

    const populatedShow = await Show.findById(show._id)
      .populate("movie", "title posterPath tmdbId runtime")
      .populate(
        "theatre",
        "name address city state pincode"
      )
      .populate("screen", "name totalSeats");

    res.status(201).json({
      success: true,
      message: "Show created successfully",
      show: populatedShow,
    });
  } catch (error) {
    console.error("Create show error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create show",
    });
  }
}

export async function createShowSchedule(
  req: Request,
  res: Response
): Promise<void> {
  const session = await mongoose.startSession();

  try {
    const {
      movie,
      theatre,
      screen,
      dates,
      showTimes,
      language,
      format,
      price,
    } = req.body as ScheduleRequest;

    if (
      !movie ||
      !theatre ||
      !screen ||
      !Array.isArray(dates) ||
      dates.length === 0 ||
      !Array.isArray(showTimes) ||
      showTimes.length === 0 ||
      !language ||
      price === undefined
    ) {
      res.status(400).json({
        success: false,
        message:
          "Movie, theatre, screen, dates, showTimes, language and price are required",
      });
      return;
    }

    const movieId = String(movie);
    const theatreId = String(theatre);
    const screenId = String(screen);

    if (!mongoose.Types.ObjectId.isValid(movieId)) {
      res.status(400).json({
        success: false,
        message: "Invalid movie ID",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(theatreId)) {
      res.status(400).json({
        success: false,
        message: "Invalid theatre ID",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(screenId)) {
      res.status(400).json({
        success: false,
        message: "Invalid screen ID",
      });
      return;
    }

    const movieExists = await Movie.findById(movieId);

    if (!movieExists) {
      res.status(404).json({
        success: false,
        message: "Movie not found",
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

    const screenExists = await Screen.findById(screenId);

    if (!screenExists) {
      res.status(404).json({
        success: false,
        message: "Screen not found",
      });
      return;
    }

    if (screenExists.theatre.toString() !== theatreId) {
      res.status(400).json({
        success: false,
        message: "Screen does not belong to the selected theatre",
      });
      return;
    }

    const normalizedLanguage = String(language).trim();

    if (!normalizedLanguage) {
      res.status(400).json({
        success: false,
        message: "Language cannot be empty",
      });
      return;
    }

    const showPrice = Number(price);

    if (!Number.isFinite(showPrice) || showPrice < 0) {
      res.status(400).json({
        success: false,
        message: "Price must be a valid non-negative number",
      });
      return;
    }

    const normalizedFormat = String(
      format === undefined ? "2D" : format
    ).toUpperCase();

    if (
      normalizedFormat !== "2D" &&
      normalizedFormat !== "3D" &&
      normalizedFormat !== "IMAX"
    ) {
      res.status(400).json({
        success: false,
        message: "Format must be 2D, 3D or IMAX",
      });
      return;
    }

    const uniqueDates = [
      ...new Set(
        dates.map((date) => String(date).trim())
      ),
    ];

    const uniqueShowTimes = [
      ...new Set(
        showTimes.map((time) => String(time).trim())
      ),
    ];

    for (const date of uniqueDates) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        res.status(400).json({
          success: false,
          message: `Invalid date: ${date}`,
        });
        return;
      }

      const testDate = new Date(
        `${date}T00:00:00${IST_OFFSET}`
      );

      if (Number.isNaN(testDate.getTime())) {
        res.status(400).json({
          success: false,
          message: `Invalid date: ${date}`,
        });
        return;
      }
    }

    for (const time of uniqueShowTimes) {
      if (!/^\d{2}:\d{2}$/.test(time)) {
        res.status(400).json({
          success: false,
          message: `Invalid show time: ${time}`,
        });
        return;
      }

      const [hours, minutes] = time
        .split(":")
        .map(Number);

      if (
        hours < 0 ||
        hours > 23 ||
        minutes < 0 ||
        minutes > 59
      ) {
        res.status(400).json({
          success: false,
          message: `Invalid show time: ${time}`,
        });
        return;
      }
    }

    const runtimeMinutes =
      Number(movieExists.runtime) > 0
        ? Number(movieExists.runtime)
        : 180;

    const schedules: {
      date: string;
      time: string;
      startTime: Date;
      endTime: Date;
    }[] = [];

    for (const date of uniqueDates) {
      for (const time of uniqueShowTimes) {
        const startTime = new Date(
          `${date}T${time}:00${IST_OFFSET}`
        );

        if (Number.isNaN(startTime.getTime())) {
          res.status(400).json({
            success: false,
            message:
              `Invalid schedule: ${date} ${time}`,
          });
          return;
        }

        const endTime = new Date(
          startTime.getTime() +
            runtimeMinutes * 60 * 1000
        );

        schedules.push({
          date,
          time,
          startTime,
          endTime,
        });
      }
    }

    schedules.sort(
      (a, b) =>
        a.startTime.getTime() -
        b.startTime.getTime()
    );

    for (let i = 0; i < schedules.length; i++) {
      for (let j = i + 1; j < schedules.length; j++) {
        if (
          schedules[j].startTime.getTime() >=
          schedules[i].endTime.getTime()
        ) {
          break;
        }

        if (
          schedules[i].date ===
          schedules[j].date
        ) {
          res.status(409).json({
            success: false,
            message:
              "Selected show timings overlap with each other",
            conflicts: [
              {
                date: schedules[i].date,
                time: schedules[i].time,
              },
              {
                date: schedules[j].date,
                time: schedules[j].time,
              },
            ],
          });
          return;
        }
      }
    }

    const conflicts: {
      date: string;
      time: string;
      existingShowId: string;
      existingStartTime: Date;
      existingEndTime: Date;
    }[] = [];

    for (const schedule of schedules) {
      const conflictingShow =
        await Show.findOne({
          screen: new mongoose.Types.ObjectId(
            screenId
          ),
          startTime: {
            $lt: schedule.endTime,
          },
          endTime: {
            $gt: schedule.startTime,
          },
        }).select(
          "_id startTime endTime"
        );

      if (conflictingShow) {
        conflicts.push({
          date: schedule.date,
          time: schedule.time,
          existingShowId:
            conflictingShow._id.toString(),
          existingStartTime:
            conflictingShow.startTime,
          existingEndTime:
            conflictingShow.endTime,
        });
      }
    }

    if (conflicts.length > 0) {
      res.status(409).json({
        success: false,
        message:
          "One or more selected show timings are already scheduled",
        conflicts,
      });
      return;
    }

    const seats = await Seat.find({
      screen: new mongoose.Types.ObjectId(screenId),
    }).session(session);

    if (seats.length === 0) {
      res.status(404).json({
        success: false,
        message:
          "No seats found for the selected screen",
      });
      return;
    }

    let createdShows: mongoose.Document[] = [];

    await session.withTransaction(async () => {
      const createdShowDocuments = [];

      for (const schedule of schedules) {
        const showDocuments = await Show.create(
          [
            {
              movie: new mongoose.Types.ObjectId(
                movieId
              ),
              theatre:
                new mongoose.Types.ObjectId(
                  theatreId
                ),
              screen:
                new mongoose.Types.ObjectId(
                  screenId
                ),
              startTime:
                schedule.startTime,
              endTime:
                schedule.endTime,
              language:
                normalizedLanguage,
              format:
                normalizedFormat as ShowFormat,
              price: showPrice,
            },
          ],
          {
            session,
          }
        );

        createdShowDocuments.push(
          showDocuments[0]
        );

        const showSeats = seats.map(
          (seat) => ({
            show: showDocuments[0]._id,
            seat: seat._id,
            status:
              "available" as const,
          })
        );

        await ShowSeat.insertMany(
          showSeats,
          {
            session,
          }
        );
      }

      createdShows =
        createdShowDocuments;
    });

    const createdShowIds =
      createdShows.map(
        (show) => show._id
      );

    const populatedShows =
      await Show.find({
        _id: {
          $in: createdShowIds,
        },
      })
        .populate(
          "movie",
          "title posterPath tmdbId runtime"
        )
        .populate(
          "theatre",
          "name address city state pincode"
        )
        .populate(
          "screen",
          "name totalSeats"
        )
        .sort({
          startTime: 1,
        });

    res.status(201).json({
      success: true,
      message: `${populatedShows.length} shows created successfully`,
      count: populatedShows.length,
      shows: populatedShows,
    });
  } catch (error) {
    console.error(
      "Create show schedule error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to create show schedule",
    });
  } finally {
    await session.endSession();
  }
}

export async function getShows(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const shows = await Show.find()
      .populate(
        "movie",
        "title posterPath tmdbId runtime"
      )
      .populate(
        "theatre",
        "name address city state pincode"
      )
      .populate(
        "screen",
        "name totalSeats"
      )
      .sort({
        startTime: 1,
      });

    res.json({
      success: true,
      count: shows.length,
      shows,
    });
  } catch (error) {
    console.error(
      "Get shows error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch shows",
    });
  }
}

export async function getShow(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const showId = String(
      req.params.id
    );

    if (
      !mongoose.Types.ObjectId.isValid(
        showId
      )
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid show ID",
      });
      return;
    }

    const show = await Show.findById(
      showId
    )
      .populate(
        "movie",
        "title overview posterPath backdropPath tmdbId runtime"
      )
      .populate(
        "theatre",
        "name address city state pincode"
      )
      .populate(
        "screen",
        "name totalSeats"
      );

    if (!show) {
      res.status(404).json({
        success: false,
        message: "Show not found",
      });
      return;
    }

    res.json({
      success: true,
      show,
    });
  } catch (error) {
    console.error(
      "Get show error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch show",
    });
  }
}

export async function getShowsByMovie(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const movieId = String(
      req.params.movieId
    );

    if (
      !mongoose.Types.ObjectId.isValid(
        movieId
      )
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid movie ID",
      });
      return;
    }

    const movieExists =
      await Movie.findById(movieId);

    if (!movieExists) {
      res.status(404).json({
        success: false,
        message: "Movie not found",
      });
      return;
    }

    const shows = await Show.find({
      movie:
        new mongoose.Types.ObjectId(
          movieId
        ),
      startTime: {
        $gte: new Date(),
      },
    })
      .populate(
        "movie",
        "title posterPath tmdbId runtime"
      )
      .populate(
        "theatre",
        "name address city state pincode"
      )
      .populate(
        "screen",
        "name totalSeats"
      )
      .sort({
        startTime: 1,
      });

    res.json({
      success: true,
      count: shows.length,
      shows,
    });
  } catch (error) {
    console.error(
      "Get movie shows error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch movie shows",
    });
  }
}

export async function getShowsByTheatre(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const theatreId = String(
      req.params.theatreId
    );

    if (
      !mongoose.Types.ObjectId.isValid(
        theatreId
      )
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid theatre ID",
      });
      return;
    }

    const theatreExists =
      await Theatre.findById(
        theatreId
      );

    if (!theatreExists) {
      res.status(404).json({
        success: false,
        message: "Theatre not found",
      });
      return;
    }

    const shows = await Show.find({
      theatre:
        new mongoose.Types.ObjectId(
          theatreId
        ),
      startTime: {
        $gte: new Date(),
      },
    })
      .populate(
        "movie",
        "title posterPath tmdbId runtime"
      )
      .populate(
        "theatre",
        "name address city state pincode"
      )
      .populate(
        "screen",
        "name totalSeats"
      )
      .sort({
        startTime: 1,
      });

    res.json({
      success: true,
      count: shows.length,
      shows,
    });
  } catch (error) {
    console.error(
      "Get theatre shows error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch theatre shows",
    });
  }
}

export async function updateShow(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const showId = String(
      req.params.id
    );

    if (
      !mongoose.Types.ObjectId.isValid(
        showId
      )
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid show ID",
      });
      return;
    }

    const existingShow =
      await Show.findById(showId);

    if (!existingShow) {
      res.status(404).json({
        success: false,
        message: "Show not found",
      });
      return;
    }

    const {
      movie,
      theatre,
      screen,
      startTime,
      endTime,
      language,
      format,
      price,
    } = req.body;

    const updateData: {
      movie?: mongoose.Types.ObjectId;
      theatre?: mongoose.Types.ObjectId;
      screen?: mongoose.Types.ObjectId;
      startTime?: Date;
      endTime?: Date;
      language?: string;
      format?: ShowFormat;
      price?: number;
    } = {};

    if (movie !== undefined) {
      const movieId = String(movie);

      if (
        !mongoose.Types.ObjectId.isValid(
          movieId
        )
      ) {
        res.status(400).json({
          success: false,
          message: "Invalid movie ID",
        });
        return;
      }

      const movieExists =
        await Movie.findById(movieId);

      if (!movieExists) {
        res.status(404).json({
          success: false,
          message: "Movie not found",
        });
        return;
      }

      updateData.movie =
        new mongoose.Types.ObjectId(
          movieId
        );
    }

    if (theatre !== undefined) {
      const theatreId = String(
        theatre
      );

      if (
        !mongoose.Types.ObjectId.isValid(
          theatreId
        )
      ) {
        res.status(400).json({
          success: false,
          message: "Invalid theatre ID",
        });
        return;
      }

      const theatreExists =
        await Theatre.findById(
          theatreId
        );

      if (!theatreExists) {
        res.status(404).json({
          success: false,
          message: "Theatre not found",
        });
        return;
      }

      updateData.theatre =
        new mongoose.Types.ObjectId(
          theatreId
        );
    }

    if (screen !== undefined) {
      const screenId = String(screen);

      if (
        !mongoose.Types.ObjectId.isValid(
          screenId
        )
      ) {
        res.status(400).json({
          success: false,
          message: "Invalid screen ID",
        });
        return;
      }

      const screenExists =
        await Screen.findById(screenId);

      if (!screenExists) {
        res.status(404).json({
          success: false,
          message: "Screen not found",
        });
        return;
      }

      updateData.screen =
        new mongoose.Types.ObjectId(
          screenId
        );
    }

    if (language !== undefined) {
      const trimmedLanguage =
        String(language).trim();

      if (!trimmedLanguage) {
        res.status(400).json({
          success: false,
          message:
            "Language cannot be empty",
        });
        return;
      }

      updateData.language =
        trimmedLanguage;
    }

    if (format !== undefined) {
      const normalizedFormat =
        String(format).toUpperCase();

      if (
        normalizedFormat !== "2D" &&
        normalizedFormat !== "3D" &&
        normalizedFormat !== "IMAX"
      ) {
        res.status(400).json({
          success: false,
          message:
            "Format must be 2D, 3D or IMAX",
        });
        return;
      }

      updateData.format =
        normalizedFormat as ShowFormat;
    }

    if (price !== undefined) {
      const showPrice = Number(price);

      if (
        !Number.isFinite(showPrice) ||
        showPrice < 0
      ) {
        res.status(400).json({
          success: false,
          message:
            "Price must be a valid non-negative number",
        });
        return;
      }

      updateData.price = showPrice;
    }

    if (startTime !== undefined) {
      const start =
        new Date(startTime);

      if (
        Number.isNaN(
          start.getTime()
        )
      ) {
        res.status(400).json({
          success: false,
          message:
            "Invalid startTime",
        });
        return;
      }

      updateData.startTime = start;
    }

    if (endTime !== undefined) {
      const end =
        new Date(endTime);

      if (
        Number.isNaN(
          end.getTime()
        )
      ) {
        res.status(400).json({
          success: false,
          message:
            "Invalid endTime",
        });
        return;
      }

      updateData.endTime = end;
    }

    if (
      Object.keys(updateData).length ===
      0
    ) {
      res.status(400).json({
        success: false,
        message:
          "No fields provided for update",
      });
      return;
    }

    const finalStart =
      updateData.startTime !== undefined
        ? updateData.startTime
        : existingShow.startTime;

    const finalEnd =
      updateData.endTime !== undefined
        ? updateData.endTime
        : existingShow.endTime;

    if (finalEnd <= finalStart) {
      res.status(400).json({
        success: false,
        message:
          "End time must be after start time",
      });
      return;
    }

    const finalTheatreId =
      updateData.theatre !== undefined
        ? updateData.theatre.toString()
        : existingShow.theatre.toString();

    const finalScreenId =
      updateData.screen !== undefined
        ? updateData.screen.toString()
        : existingShow.screen.toString();

    const finalScreen =
      await Screen.findById(
        finalScreenId
      );

    if (!finalScreen) {
      res.status(404).json({
        success: false,
        message: "Screen not found",
      });
      return;
    }

    if (
      finalScreen.theatre.toString() !==
      finalTheatreId
    ) {
      res.status(400).json({
        success: false,
        message:
          "Screen does not belong to the selected theatre",
      });
      return;
    }

    const conflictingShow =
      await Show.findOne({
        _id: {
          $ne:
            new mongoose.Types.ObjectId(
              showId
            ),
        },
        screen:
          new mongoose.Types.ObjectId(
            finalScreenId
          ),
        startTime: {
          $lt: finalEnd,
        },
        endTime: {
          $gt: finalStart,
        },
      });

    if (conflictingShow) {
      res.status(409).json({
        success: false,
        message:
          "Another show is already scheduled on this screen during this time",
        conflictingShow: {
          id: conflictingShow._id.toString(),
          startTime:
            conflictingShow.startTime,
          endTime:
            conflictingShow.endTime,
        },
      });
      return;
    }

    const updatedShow =
      await Show.findByIdAndUpdate(
        showId,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      );

    if (!updatedShow) {
      res.status(404).json({
        success: false,
        message: "Show not found",
      });
      return;
    }

    const populatedShow =
      await Show.findById(
        updatedShow._id
      )
        .populate(
          "movie",
          "title posterPath tmdbId runtime"
        )
        .populate(
          "theatre",
          "name address city state pincode"
        )
        .populate(
          "screen",
          "name totalSeats"
        );

    res.json({
      success: true,
      message:
        "Show updated successfully",
      show: populatedShow,
    });
  } catch (error) {
    console.error(
      "Update show error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to update show",
    });
  }
}

export async function deleteShow(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const showId = String(
      req.params.id
    );

    if (
      !mongoose.Types.ObjectId.isValid(
        showId
      )
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid show ID",
      });
      return;
    }

    await ShowSeat.deleteMany({
      show: showId,
    });

    const show =
      await Show.findByIdAndDelete(
        showId
      );

    if (!show) {
      res.status(404).json({
        success: false,
        message: "Show not found",
      });
      return;
    }

    res.json({
      success: true,
      message:
        "Show deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete show error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to delete show",
    });
  }
}
