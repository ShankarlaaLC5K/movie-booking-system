import { Router } from "express";

import {
  createShow,
  createShowSchedule,
  getShows,
  getShow,
  getShowsByMovie,
  getShowsByTheatre,
  updateShow,
  deleteShow,
} from "../controllers/showController";

import { protect } from "../middleware/authMiddleware";
import { requireAdmin } from "../middleware/rolemiddleware";

const router = Router();

router.get("/", getShows);

router.get(
  "/movie/:movieId",
  getShowsByMovie
);

router.get(
  "/theatre/:theatreId",
  getShowsByTheatre
);

router.post(
  "/schedule",
  protect,
  requireAdmin,
  createShowSchedule
);

router.post(
  "/",
  protect,
  requireAdmin,
  createShow
);

router.get(
  "/:id",
  getShow
);

router.put(
  "/:id",
  protect,
  requireAdmin,
  updateShow
);

router.delete(
  "/:id",
  protect,
  requireAdmin,
  deleteShow
);

export default router;
