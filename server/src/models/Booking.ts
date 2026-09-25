import mongoose, { Document, Schema } from "mongoose";

export interface IBooking extends Document {
  user: mongoose.Types.ObjectId;
  show: mongoose.Types.ObjectId;
  seats: mongoose.Types.ObjectId[];
  totalAmount: number;
  status: "pending" | "confirmed" | "cancelled";
  bookingReference: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    show: {
      type: Schema.Types.ObjectId,
      ref: "Show",
      required: true,
    },

    seats: [
      {
        type: Schema.Types.ObjectId,
        ref: "Seat",
        required: true,
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },

    bookingReference: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Booking = mongoose.model<IBooking>(
  "Booking",
  bookingSchema
);
