import mongoose, { Document, Schema } from "mongoose";

export interface IMovie extends Document {
  tmdbId: number;
  title: string;
  overview: string;
  posterPath?: string;
  backdropPath?: string;
  releaseDate?: string;
  runtime?: number;
  genres: string[];
  language?: string;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
}

const movieSchema = new Schema<IMovie>(
  {
    tmdbId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    overview: {
      type: String,
      default: "",
    },

    posterPath: {
      type: String,
      default: "",
    },

    backdropPath: {
      type: String,
      default: "",
    },

    releaseDate: {
      type: String,
      default: "",
    },

    runtime: {
      type: Number,
      default: 0,
    },

    genres: {
      type: [String],
      default: [],
    },

    language: {
      type: String,
      default: "",
    },

    rating: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Movie = mongoose.model<IMovie>(
  "Movie",
  movieSchema
);
