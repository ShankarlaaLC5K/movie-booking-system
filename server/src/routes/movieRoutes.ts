import { Router } from "express";

import {
  popularMovies,
  recentMovies,
  searchMovie,
  movieDetails,
  saveMovie,
  getMovies,
  getMovie,
  deleteMovie,
} from "../controllers/movieController";

import { protect } from "../middleware/authMiddleware";
import { requireAdmin } from "../middleware/rolemiddleware";

const router = Router();

router.get("/popular", popularMovies);

router.get("/recent", recentMovies);

router.get("/search", searchMovie);

router.get("/tmdb/:id", movieDetails);

router.get("/", getMovies);

router.post(
  "/save/:tmdbId",
  protect,
  requireAdmin,
  saveMovie
);

router.get("/:id", getMovie);

router.delete(
  "/:id",
  protect,
  requireAdmin,
  deleteMovie
);

export default router;
