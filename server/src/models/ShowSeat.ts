import mongoose, { Document, Schema } from "mongoose";

export interface IShowSeat extends Document {
  show: mongoose.Types.ObjectId;
  seat: mongoose.Types.ObjectId;

  status: "available" | "locked" | "booked";

  lockedUntil?: Date;
  lockedBy?: mongoose.Types.ObjectId;

  booking?: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const showSeatSchema = new Schema<IShowSeat>(
  {
    show: {
      type: Schema.Types.ObjectId,
      ref: "Show",
      required: true,
      index: true,
    },

    seat: {
      type: Schema.Types.ObjectId,
      ref: "Seat",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["available", "locked", "booked"],
      default: "available",
      required: true,
    },

    lockedUntil: {
      type: Date,
    },

    lockedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
    },
  },
  {
    timestamps: true,
  }
);

showSeatSchema.index(
  { show: 1, seat: 1 },
  { unique: true }
);

export const ShowSeat = mongoose.model<IShowSeat>(
  "ShowSeat",
  showSeatSchema
);
