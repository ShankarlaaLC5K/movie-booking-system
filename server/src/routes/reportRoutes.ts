import { Router } from "express";

import { getReports } from "../controllers/reportController";

import { protect } from "../middleware/authMiddleware";
import { requireAdmin } from "../middleware/rolemiddleware";

const router = Router();

router.get(
  "/",
  protect,
  requireAdmin,
  getReports
);

export default router;