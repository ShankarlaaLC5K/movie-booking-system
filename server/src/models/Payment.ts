import mongoose, { Document, Schema } from "mongoose";

export interface IPayment extends Document {
  booking: mongoose.Types.ObjectId;
  amount: number;
  provider: "razorpay" | "stripe";
  gatewayOrderId?: string;
  transactionId?: string;
  signature?: string;
  status: "pending" | "success" | "failed";
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    provider: {
      type: String,
      enum: ["razorpay", "stripe"],
      required: true,
    },

    gatewayOrderId: {
      type: String,
    },

    transactionId: {
      type: String,
    },

    signature: {
      type: String,
    },

    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

export const Payment = mongoose.model<IPayment>(
  "Payment",
  paymentSchema
);
