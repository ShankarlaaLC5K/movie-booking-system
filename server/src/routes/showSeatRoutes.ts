import { Router } from "express";

import {
  initializeShowSeats,
  getShowSeats,
  lockShowSeats,
  unlockShowSeats,
} from "../controllers/showSeatController";

import { protect } from "../middleware/authMiddleware";
import { requireAdmin } from "../middleware/rolemiddleware";

const router = Router();

router.get(
  "/show/:showId",
  getShowSeats
);

router.post(
  "/initialize",
  protect,
  requireAdmin,
  initializeShowSeats
);

router.post(
  "/show/:showId/lock",
  protect,
  lockShowSeats
);

router.post(
  "/show/:showId/unlock",
  protect,
  unlockShowSeats
);

export default router;
