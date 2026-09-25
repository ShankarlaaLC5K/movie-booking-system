import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error(
    "MONGO_URI is missing in environment variables"
  );
}

let cachedConnection: typeof mongoose | null = null;
let cachedPromise: Promise<typeof mongoose> | null = null;

export async function connectDB(): Promise<typeof mongoose> {
  if (cachedConnection) {
    return cachedConnection;
  }

  if (!cachedPromise) {
    cachedPromise = mongoose
      .connect(MONGO_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        maxIdleTimeMS: 60000,
      })
      .then((connection) => {
        console.log(
          "MongoDB connected successfully"
        );

        cachedConnection = connection;
        return connection;
      })
      .catch((error) => {
        cachedPromise = null;

        console.error(
          "MongoDB connection failed:",
          error
        );

        throw error;
      });
  }

  return cachedPromise;
}