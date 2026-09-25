import mongoose, { Document, Schema } from "mongoose";

export interface IScreen extends Document {
  theatre: mongoose.Types.ObjectId;
  name: string;
  totalSeats: number;
  createdAt: Date;
  updatedAt: Date;
}

const screenSchema = new Schema<IScreen>(
  {
    theatre: {
      type: Schema.Types.ObjectId,
      ref: "Theatre",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    totalSeats: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

export const Screen = mongoose.model<IScreen>(
  "Screen",
  screenSchema
);
