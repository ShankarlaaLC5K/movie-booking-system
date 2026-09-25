import {
  CheckCircle2,
  Home,
  Ticket,
} from "lucide-react";

import {
  Link,
  useParams,
} from "react-router-dom";

import {
  useEffect,
  useState,
} from "react";

import {
  getBookingById,
} from "../services/bookingService";

import type {
  Booking,
} from "../types/booking";

function BookingConfirmation() {
  const { id } = useParams();

  const [booking, setBooking] =
    useState<Booking | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!id) {
      setError("Booking ID is missing.");
      setLoading(false);
      return;
    }

    const loadBooking = async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await getBookingById(id);

        setBooking(response.booking);
      } catch (error: any) {
        console.error(
          "Failed to load booking:",
          error
        );

        setError(
          error?.response?.data?.message ||
            "Failed to load booking details."
        );
      } finally {
        setLoading(false);
      }
    };

    loadBooking();
  }, [id]);

  if (loading) {
    return (
      <section className="flex min-h-[calc(100vh-140px)] items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-red-500" />

          <p className="text-slate-400">
            Loading booking...
          </p>
        </div>
      </section>
    );
  }

  if (error || !booking) {
    return (
      <section className="flex min-h-[calc(100vh-140px)] items-center justify-center bg-slate-950 px-4 text-white">
        <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
          <p className="text-red-400">
            {error || "Booking not found."}
          </p>

          <Link
            to="/movies"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-3 font-semibold hover:bg-red-700"
          >
            <Home size={18} />
            Browse Movies
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[calc(100vh-140px)] bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-2xl">

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center sm:p-10">

          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle2
              size={48}
              className="text-green-500"
            />
          </div>

          <h1 className="mt-6 text-3xl font-bold sm:text-4xl">
            Booking Confirmed!
          </h1>

          <p className="mt-3 text-slate-400">
            Your payment was successful and your tickets are confirmed.
          </p>

          <div className="mt-8 rounded-xl border border-slate-800 bg-slate-950 p-5 text-left">

            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <Ticket
                size={22}
                className="text-red-500"
              />

              <div>
                <p className="text-sm text-slate-400">
                  Booking Reference
                </p>

                <p className="font-bold">
                  {booking.bookingReference ||
                    booking._id}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">

              <div className="flex justify-between gap-4">
                <span className="text-slate-400">
                  Status
                </span>

                <span className="font-semibold text-green-400">
                  {booking.status}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-400">
                  Tickets
                </span>

                <span className="font-semibold">
                  {booking.seats.length}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-400">
                  Total Paid
                </span>

                <span className="font-bold text-red-400">
                  ₹{booking.totalAmount}
                </span>
              </div>

            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">

            <Link
              to="/bookings"
              className="rounded-lg bg-red-600 px-6 py-3 font-semibold hover:bg-red-700"
            >
              My Bookings
            </Link>

            <Link
              to="/movies"
              className="rounded-lg border border-slate-700 px-6 py-3 font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              Browse Movies
            </Link>

          </div>
        </div>
      </div>
    </section>
  );
}

export default BookingConfirmation;
