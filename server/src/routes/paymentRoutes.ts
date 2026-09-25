import { Router } from "express";

import {
  createPaymentOrder,
  verifyPayment,
  mockPaymentSuccess,
} from "../controllers/paymentController";

import { protect } from "../middleware/authMiddleware";

const router = Router();

router.post(
  "/create-order",
  protect,
  createPaymentOrder
);

router.post(
  "/verify",
  protect,
  verifyPayment
);

router.post(
  "/mock-success",
  protect,
  mockPaymentSuccess
);

export default router;
