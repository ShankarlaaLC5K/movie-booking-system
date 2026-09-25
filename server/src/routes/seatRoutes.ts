import { Router } from "express";

import {
  generateSeats,
  getSeatsByScreen,
  deleteSeatsByScreen,
} from "../controllers/seatController";

import { protect } from "../middleware/authMiddleware";
import { requireAdmin } from "../middleware/rolemiddleware";

const router = Router();

router.get(
  "/screen/:screenId",
  getSeatsByScreen
);

router.post(
  "/generate",
  protect,
  requireAdmin,
  generateSeats
);

router.delete(
  "/screen/:screenId",
  protect,
  requireAdmin,
  deleteSeatsByScreen
);

export default router;
