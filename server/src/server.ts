import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";

import { connectDB } from "./config/db";

import authRoutes from "./routes/authRoutes";
import movieRoutes from "./routes/movieRoutes";
import theatreRoutes from "./routes/theatreRoutes";
import screenRoutes from "./routes/screenRoutes";
import seatRoutes from "./routes/seatRoutes";
import showRoutes from "./routes/showRoutes";
import showSeatRoutes from "./routes/showSeatRoutes";
import bookingRoutes from "./routes/bookingRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import reportRoutes from "./routes/reportRoutes";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin:
      process.env.CLIENT_URL ||
      "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/theatres", theatreRoutes);
app.use("/api/screens", screenRoutes);
app.use("/api/seats", seatRoutes);
app.use("/api/shows", showRoutes);
app.use("/api/show-seats", showSeatRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use(
  "/api/reports",
  reportRoutes
);
app.get("/", (_req, res) => {
  res.send("Movie Booking API is running");
});

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Movie booking API is running",
  });
});

const PORT = Number(process.env.PORT || 5000);

async function startServer(): Promise<void> {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(
        `Server running on port ${PORT}`
      );
    });
  } catch (error) {
    console.error(
      "Failed to start server:",
      error
    );

    process.exit(1);
  }
}

void startServer();
