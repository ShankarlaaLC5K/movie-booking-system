import { Router } from "express";

import {
  createScreen,
  getScreensByTheatre,
  getScreen,
  updateScreen,
  deleteScreen,
} from "../controllers/screenController";

import { protect } from "../middleware/authMiddleware";
import { requireAdmin } from "../middleware/rolemiddleware";

const router = Router();

router.get("/theatre/:theatreId", getScreensByTheatre);
router.get("/:id", getScreen);

router.post(
  "/",
  protect,
  requireAdmin,
  createScreen
);

router.put(
  "/:id",
  protect,
  requireAdmin,
  updateScreen
);

router.delete(
  "/:id",
  protect,
  requireAdmin,
  deleteScreen
);

export default router;
