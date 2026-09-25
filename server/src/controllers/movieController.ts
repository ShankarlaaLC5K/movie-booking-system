import { Request, Response } from "express";

import { Movie } from "../models/Movie";

import {
  getPopularMovies,
  getRecentMovies,
  searchMovies,
  getMovieDetails,
} from "../services/tmdbService";

import { mapTmdbMovie } from "../utils/movieMapper";

export async function popularMovies(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const data = await getPopularMovies();

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "Popular movies error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch popular movies",
    });
  }
}

export async function recentMovies(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const data = await getRecentMovies();

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "Failed to fetch recent movies:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch recent movies",
    });
  }
}

export async function searchMovie(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const query = String(
      req.query.query || ""
    ).trim();

    const page = Number(
      req.query.page || 1
    );

    if (!query) {
      res.status(400).json({
        success: false,
        message:
          "Search query is required",
      });

      return;
    }

    if (
      !Number.isInteger(page) ||
      page < 1
    ) {
      res.status(400).json({
        success: false,
        message:
          "Invalid search page",
      });

      return;
    }

    const data =
      await searchMovies(
        query,
        page
      );

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "Movie search error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to search movies",
    });
  }
}

export async function movieDetails(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const movieId =
      Number(req.params.id);

    if (
      !Number.isInteger(movieId) ||
      movieId <= 0
    ) {
      res.status(400).json({
        success: false,
        message:
          "Invalid movie ID",
      });

      return;
    }

    const data =
      await getMovieDetails(movieId);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "Movie details error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch movie details",
    });
  }
}

export async function saveMovie(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const tmdbId =
      Number(req.params.tmdbId);

    if (
      !Number.isInteger(tmdbId) ||
      tmdbId <= 0
    ) {
      res.status(400).json({
        success: false,
        message:
          "Invalid TMDB movie ID",
      });

      return;
    }

    const tmdbMovie =
      await getMovieDetails(tmdbId);

    const movieData =
      mapTmdbMovie(tmdbMovie);

    const movie =
      await Movie.findOneAndUpdate(
        { tmdbId },
        movieData,
        {
          new: true,
          upsert: true,
          runValidators: true,
        }
      );

    res.status(200).json({
      success: true,
      message:
        "Movie saved successfully",
      movie,
    });
  } catch (error) {
    console.error(
      "Save movie error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to save movie",
    });
  }
}

export async function getMovies(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const movies =
      await Movie.find().sort({
        createdAt: -1,
      });

    res.json({
      success: true,
      count: movies.length,
      movies,
    });
  } catch (error) {
    console.error(
      "Get movies error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch movies",
    });
  }
}

export async function getMovie(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const movie =
      await Movie.findById(
        req.params.id
      );

    if (!movie) {
      res.status(404).json({
        success: false,
        message:
          "Movie not found",
      });

      return;
    }

    res.json({
      success: true,
      movie,
    });
  } catch (error) {
    console.error(
      "Get movie error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch movie",
    });
  }
}

export async function deleteMovie(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const movie =
      await Movie.findByIdAndDelete(
        req.params.id
      );

    if (!movie) {
      res.status(404).json({
        success: false,
        message:
          "Movie not found",
      });

      return;
    }

    res.json({
      success: true,
      message:
        "Movie deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete movie error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to delete movie",
    });
  }
}