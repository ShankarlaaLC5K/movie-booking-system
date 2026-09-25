import { Response } from "express";
import crypto from "crypto";
import Razorpay from "razorpay";

import { Booking } from "../models/Booking";
import { Payment } from "../models/Payment";
import { ShowSeat } from "../models/ShowSeat";

import { AuthRequest } from "../middleware/authMiddleware";

import {
  sendBookingConfirmationEmail,
} from "../services/notificationService";

function getRazorpay(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret =
    process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay credentials are missing in .env"
    );
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

export async function createPaymentOrder(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });

      return;
    }

    const { bookingId } = req.body;

    if (!bookingId) {
      res.status(400).json({
        success: false,
        message: "bookingId is required",
      });

      return;
    }

    const booking =
      await Booking.findById(bookingId);

    if (!booking) {
      res.status(404).json({
        success: false,
        message: "Booking not found",
      });

      return;
    }

    if (
      booking.user.toString() !==
      req.userId
    ) {
      res.status(403).json({
        success: false,
        message:
          "You are not allowed to pay for this booking",
      });

      return;
    }

    if (booking.status !== "pending") {
      res.status(400).json({
        success: false,
        message:
          `Booking is already ${booking.status}`,
      });

      return;
    }

    const now = new Date();

    const showSeats =
      await ShowSeat.find({
        show: booking.show,
        seat: {
          $in: booking.seats,
        },
      });

    const validLockedSeats =
      showSeats.length ===
        booking.seats.length &&
      showSeats.every(
        (showSeat) =>
          showSeat.status === "locked" &&
          showSeat.lockedBy?.toString() ===
            req.userId &&
          !!showSeat.lockedUntil &&
          new Date(
            showSeat.lockedUntil
          ) > now
      );

    if (!validLockedSeats) {
      res.status(409).json({
        success: false,
        message:
          "Your seat reservation has expired or is no longer valid",
      });

      return;
    }

    const existingPayment =
      await Payment.findOne({
        booking: booking._id,
        provider: "razorpay",
        status: "pending",
      });

    if (existingPayment?.gatewayOrderId) {
      res.json({
        success: true,
        message:
          "Existing payment order returned",

        order: {
          id:
            existingPayment.gatewayOrderId,

          amount:
            Math.round(
              existingPayment.amount * 100
            ),

          currency: "INR",
        },

        payment: existingPayment,

        keyId:
          process.env.RAZORPAY_KEY_ID,
      });

      return;
    }

    const razorpay = getRazorpay();

    const amountInPaise =
      Math.round(
        booking.totalAmount * 100
      );

    const order =
      await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",

        receipt:
          booking.bookingReference,

        notes: {
          bookingId:
            booking._id.toString(),

          bookingReference:
            booking.bookingReference,
        },
      });

    const payment =
      await Payment.create({
        booking: booking._id,

        amount:
          booking.totalAmount,

        provider: "razorpay",

        gatewayOrderId:
          order.id,

        status: "pending",
      });

    res.status(201).json({
      success: true,

      message:
        "Razorpay order created successfully",

      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },

      payment,

      keyId:
        process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error(
      "Create payment order error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to create payment order",
    });
  }
}

async function sendConfirmationEmail(
  bookingId: string
): Promise<void> {
  try {
    const booking =
      await Booking.findById(
        bookingId
      )
        .populate({
          path: "show",
          populate: [
            {
              path: "movie",
            },
            {
              path: "theatre",
            },
            {
              path: "screen",
            },
          ],
        })
        .populate("seats")
        .populate("user");

    if (!booking) {
      return;
    }

    const user: any = booking.user;
    const show: any = booking.show;

    if (
      !user?.email ||
      !show?.startTime
    ) {
      return;
    }

    const movie = show.movie;
    const theatre = show.theatre;
    const screen = show.screen;

    const seats =
      (booking.seats as any[]).map(
        (seat) => {
          if (seat.seatNumber) {
            return seat.seatNumber;
          }

          if (
            seat.row !== undefined &&
            seat.number !== undefined
          ) {
            return `${seat.row}${seat.number}`;
          }

          return (
            seat._id?.toString() ||
            "Unknown"
          );
        }
      );

    const startTime =
      new Date(show.startTime);

    const showDate =
      startTime.toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
          timeZone: "Asia/Kolkata",
        }
      );

    const showTime =
      startTime.toLocaleTimeString(
        "en-IN",
        {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          timeZone: "Asia/Kolkata",
        }
      );

    await sendBookingConfirmationEmail({
      to: user.email,

      bookingReference:
        booking.bookingReference,

      movieName:
        movie?.title || "Movie",

      theatreName:
        theatre?.name || "Theatre",

      screenName:
        screen?.name || "Screen",

      showDate,
      showTime,

      seats,

      amount:
        booking.totalAmount,
    });

    console.log(
      "Booking confirmation email sent successfully"
    );
  } catch (error) {
    console.error(
      "Booking confirmation email failed:",
      error
    );
  }
}

export async function verifyPayment(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });

      return;
    }

    const {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !bookingId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      res.status(400).json({
        success: false,
        message:
          "bookingId, razorpay_order_id, razorpay_payment_id and razorpay_signature are required",
      });

      return;
    }

    const booking =
      await Booking.findById(
        bookingId
      );

    if (!booking) {
      res.status(404).json({
        success: false,
        message: "Booking not found",
      });

      return;
    }

    if (
      booking.user.toString() !==
      req.userId
    ) {
      res.status(403).json({
        success: false,
        message:
          "You are not allowed to verify this booking",
      });

      return;
    }

    if (booking.status === "confirmed") {
      res.json({
        success: true,
        message:
          "Booking is already confirmed",
        booking,
      });

      return;
    }

    if (booking.status !== "pending") {
      res.status(400).json({
        success: false,
        message:
          `Booking is already ${booking.status}`,
      });

      return;
    }

    const payment =
      await Payment.findOne({
        booking: booking._id,
        provider: "razorpay",
        gatewayOrderId:
          razorpay_order_id,
      });

    if (!payment) {
      res.status(404).json({
        success: false,
        message:
          "Payment record not found",
      });

      return;
    }

    if (payment.status === "success") {
      res.status(409).json({
        success: false,
        message:
          "This payment has already been processed",
      });

      return;
    }

    const keySecret =
      process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      throw new Error(
        "RAZORPAY_KEY_SECRET is missing in .env"
      );
    }

    const generatedSignature =
      crypto
        .createHmac(
          "sha256",
          keySecret
        )
        .update(
          `${razorpay_order_id}|${razorpay_payment_id}`
        )
        .digest("hex");

    const providedSignature =
      String(
        razorpay_signature
      );

    let signaturesMatch = false;

    if (
      generatedSignature.length ===
      providedSignature.length
    ) {
      signaturesMatch =
        crypto.timingSafeEqual(
          Buffer.from(
            generatedSignature
          ),
          Buffer.from(
            providedSignature
          )
        );
    }

    if (!signaturesMatch) {
      payment.status = "failed";

      payment.transactionId =
        razorpay_payment_id;

      payment.signature =
        razorpay_signature;

      await payment.save();

      res.status(400).json({
        success: false,
        message:
          "Invalid payment signature",
      });

      return;
    }

    const razorpay = getRazorpay();

    const razorpayPayment =
      await razorpay.payments.fetch(
        razorpay_payment_id
      );

    if (
      razorpayPayment.order_id !==
      razorpay_order_id
    ) {
      res.status(400).json({
        success: false,
        message:
          "Payment does not belong to this order",
      });

      return;
    }

    const expectedAmount =
      Math.round(
        booking.totalAmount * 100
      );

    if (
      Number(
        razorpayPayment.amount
      ) !== expectedAmount
    ) {
      res.status(400).json({
        success: false,
        message:
          "Payment amount does not match booking amount",
      });

      return;
    }

    if (
      razorpayPayment.status !==
      "captured"
    ) {
      res.status(400).json({
        success: false,
        message:
          "Payment has not been captured",
      });

      return;
    }

    const now = new Date();

    const showSeats =
      await ShowSeat.find({
        show: booking.show,
        seat: {
          $in: booking.seats,
        },
      });

    const validLockedSeats =
      showSeats.length ===
        booking.seats.length &&
      showSeats.every(
        (showSeat) =>
          showSeat.status === "locked" &&
          showSeat.lockedBy?.toString() ===
            req.userId &&
          !!showSeat.lockedUntil &&
          new Date(
            showSeat.lockedUntil
          ) > now
      );

    if (!validLockedSeats) {
      payment.status = "failed";

      payment.transactionId =
        razorpay_payment_id;

      payment.signature =
        razorpay_signature;

      await payment.save();

      res.status(409).json({
        success: false,
        message:
          "Seat reservation expired before payment confirmation",
      });

      return;
    }

    payment.status = "success";

    payment.transactionId =
      razorpay_payment_id;

    payment.signature =
      razorpay_signature;

    await payment.save();

    booking.status = "confirmed";

    await booking.save();

    await ShowSeat.updateMany(
      {
        show: booking.show,
        seat: {
          $in: booking.seats,
        },
        status: "locked",
        lockedBy: req.userId,
      },
      {
        $set: {
          status: "booked",
          booking: booking._id,
        },

        $unset: {
          lockedUntil: 1,
          lockedBy: 1,
        },
      }
    );

    await sendConfirmationEmail(
      booking._id.toString()
    );

    res.json({
      success: true,
      message:
        "Payment verified and booking confirmed",

      booking,
      payment,
    });
  } catch (error) {
    console.error(
      "Verify payment error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to verify payment",
    });
  }
}

export async function mockPaymentSuccess(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (
      process.env.NODE_ENV ===
      "production"
    ) {
      res.status(404).json({
        success: false,
        message: "Not found",
      });

      return;
    }

    if (!req.userId) {
      res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });

      return;
    }

    const { bookingId } = req.body;

    if (!bookingId) {
      res.status(400).json({
        success: false,
        message:
          "bookingId is required",
      });

      return;
    }

    const booking =
      await Booking.findById(
        bookingId
      );

    if (!booking) {
      res.status(404).json({
        success: false,
        message: "Booking not found",
      });

      return;
    }

    if (
      booking.user.toString() !==
      req.userId
    ) {
      res.status(403).json({
        success: false,
        message:
          "You are not allowed to pay for this booking",
      });

      return;
    }

    if (booking.status !== "pending") {
      res.status(400).json({
        success: false,
        message:
          `Booking is already ${booking.status}`,
      });

      return;
    }

    const now = new Date();

    const showSeats =
      await ShowSeat.find({
        show: booking.show,
        seat: {
          $in: booking.seats,
        },
      });

    const validLockedSeats =
      showSeats.length ===
        booking.seats.length &&
      showSeats.every(
        (showSeat) =>
          showSeat.status === "locked" &&
          showSeat.lockedBy?.toString() ===
            req.userId &&
          !!showSeat.lockedUntil &&
          new Date(
            showSeat.lockedUntil
          ) > now
      );

    if (!validLockedSeats) {
      res.status(409).json({
        success: false,
        message:
          "Seat reservation expired or is no longer valid",
      });

      return;
    }

    let payment =
      await Payment.findOne({
        booking: booking._id,
        provider: "razorpay",
        status: "pending",
      });

    if (!payment) {
      payment =
        await Payment.create({
          booking: booking._id,

          amount:
            booking.totalAmount,

          provider: "razorpay",

          gatewayOrderId:
            `mock_order_${booking._id}`,

          status: "pending",
        });
    }

    payment.status = "success";

    payment.transactionId =
      `mock_payment_${Date.now()}`;

    payment.signature =
      "development_mock_payment";

    await payment.save();

    booking.status = "confirmed";

    await booking.save();

    await ShowSeat.updateMany(
      {
        show: booking.show,

        seat: {
          $in: booking.seats,
        },

        status: "locked",

        lockedBy: req.userId,
      },
      {
        $set: {
          status: "booked",

          booking: booking._id,
        },

        $unset: {
          lockedUntil: 1,
          lockedBy: 1,
        },
      }
    );

    await sendConfirmationEmail(
      booking._id.toString()
    );

    res.json({
      success: true,

      message:
        "Development payment successful",

      booking,

      payment,
    });
  } catch (error) {
    console.error(
      "Mock payment error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Development payment failed",
    });
  }
}
