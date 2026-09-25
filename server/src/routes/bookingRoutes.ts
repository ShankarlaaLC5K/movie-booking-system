import { Router } from "express";

import {
  createBooking,
  getMyBookings,
  getBooking,
  cancelBooking,
  getAllBookings,
} from "../controllers/bookingController";

import { protect } from "../middleware/authMiddleware";
import { requireAdmin } from "../middleware/rolemiddleware";

const router = Router();

router.post(
  "/",
  protect,
  createBooking
);

router.get(
  "/my",
  protect,
  getMyBookings
);

router.patch(
  "/:id/cancel",
  protect,
  cancelBooking
);

router.get(
  "/:id",
  protect,
  getBooking
);

router.get(
  "/",
  protect,
  requireAdmin,
  getAllBookings
);

export default router;
