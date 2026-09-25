import mongoose from "mongoose";

let isConnecting = false;

export async function connectDB(): Promise<void> {
  try {
    if (mongoose.connection.readyState === 1) {
      return;
    }

    if (isConnecting) {
      return;
    }

    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error(
        "MONGO_URI is missing in environment variables"
      );
    }

    isConnecting = true;

    await mongoose.connect(mongoUri);

    console.log(
      "MongoDB connected successfully"
    );
  } catch (error) {
    console.error(
      "MongoDB connection failed:",
      error
    );

    throw error;
  } finally {
    isConnecting = false;
  }
}