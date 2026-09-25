import { Router } from "express";

import {
  createTheatre,
  getTheatres,
  getTheatre,
  updateTheatre,
  deleteTheatre,
} from "../controllers/theatreController";

import { protect } from "../middleware/authMiddleware";
import { requireAdmin } from "../middleware/rolemiddleware";

const router = Router();

router.get("/", getTheatres);

router.get("/:id", getTheatre);

router.post(
  "/",
  protect,
  requireAdmin,
  createTheatre
);

router.put(
  "/:id",
  protect,
  requireAdmin,
  updateTheatre
);

router.delete(
  "/:id",
  protect,
  requireAdmin,
  deleteTheatre
);

export default router;
