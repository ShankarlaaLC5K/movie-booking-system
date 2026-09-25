import mongoose, { Document, Schema } from "mongoose";

export interface ISeat extends Document {
  screen: mongoose.Types.ObjectId;
  row: string;
  number: number;
  type: "regular" | "premium" | "recliner";
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

const seatSchema = new Schema<ISeat>(
  {
    screen: {
      type: Schema.Types.ObjectId,
      ref: "Screen",
      required: true,
    },

    row: {
      type: String,
      required: true,
      trim: true,
    },

    number: {
      type: Number,
      required: true,
      min: 1,
    },

    type: {
      type: String,
      enum: ["regular", "premium", "recliner"],
      default: "regular",
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Seat = mongoose.model<ISeat>(
  "Seat",
  seatSchema
);
