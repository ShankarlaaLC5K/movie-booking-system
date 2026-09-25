import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  Check,
  Clock,
  Ticket,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  getShowSeats,
  lockSeats,
} from "../services/seatService";

import type { ShowSeat } from "../types/seat";

import { useBooking } from "../context/BookingContext";
import {
  createBooking,
} from "../services/bookingService";

function SeatSelection() {
  const { showId } = useParams();
  const navigate = useNavigate();

  const {
    setBooking,
    expiresAt,
  } = useBooking();

  const [seats, setSeats] =
    useState<ShowSeat[]>([]);

  const [selected, setSelected] =
    useState<string[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [locking, setLocking] =
    useState(false);

  const [error, setError] =
    useState("");

  const [timeLeft, setTimeLeft] =
    useState<number | null>(null);

  useEffect(() => {
    if (!showId) {
      setError("Show ID is missing.");
      setLoading(false);
      return;
    }

    const loadSeats = async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await getShowSeats(showId);

        setSeats(response.seats || []);
      } catch (error: any) {
        console.error(
          "Failed to load seats:",
          error
        );

        setError(
          error?.response?.data?.message ||
            "Failed to load seats."
        );
      } finally {
        setLoading(false);
      }
    };

    loadSeats();
  }, [showId]);

  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const remaining = Math.max(
        0,
        expiresAt - Date.now()
      );

      setTimeLeft(remaining);

      if (remaining <= 0) {
        setSelected([]);
      }
    };

    updateTimer();

    const interval = window.setInterval(
      updateTimer,
      1000
    );

    return () =>
      window.clearInterval(interval);
  }, [expiresAt]);

  const getSeatId = (
    showSeat: ShowSeat
  ): string => {
    if (typeof showSeat.seat === "string") {
      return showSeat.seat;
    }

    return showSeat.seat._id;
  };

  const getSeatName = (
    showSeat: ShowSeat
  ): string => {
    if (typeof showSeat.seat === "string") {
      return showSeat.seat;
    }

    if (
      showSeat.seat.row &&
      showSeat.seat.number !== undefined
    ) {
      return `${showSeat.seat.row}${showSeat.seat.number}`;
    }

    return showSeat.seat._id;
  };

  const toggleSeat = (
    showSeat: ShowSeat
  ) => {
    if (
      showSeat.status !== "available" ||
      locking ||
      (timeLeft !== null &&
        timeLeft <= 0)
    ) {
      return;
    }

    const seatId =
      getSeatId(showSeat);

    setSelected((current) =>
      current.includes(seatId)
        ? current.filter(
            (id) => id !== seatId
          )
        : [...current, seatId]
    );

    setError("");
  };

  const selectedNames = useMemo(() => {
    return seats
      .filter((showSeat) =>
        selected.includes(
          getSeatId(showSeat)
        )
      )
      .map((showSeat) =>
        getSeatName(showSeat)
      );
  }, [seats, selected]);

  const availableCount =
    seats.filter(
      (seat) =>
        seat.status === "available"
    ).length;

  const handleContinue = async () => {
  if (!showId) {
    setError("Show ID is missing.");
    return;
  }

  if (!selected.length) {
    setError(
      "Please select at least one seat."
    );
    return;
  }

  try {
    setLocking(true);
    setError("");

    const response =
      await lockSeats(
        showId,
        selected
      );

    const lockedUntil =
      new Date(
        response.lockedUntil
      ).getTime();

    const bookingResponse =
      await createBooking({
        showId,
        seatIds: selected,
      });

    setBooking(
      showId,
      selected,
      selectedNames,
      lockedUntil
    );

    console.log(
      "Pending booking created:",
      bookingResponse.booking
    );

    navigate("/checkout");
  } catch (error: any) {
    console.error(
      "Unable to create pending booking:",
      error
    );

    setError(
      error?.response?.data?.message ||
        "Unable to start your booking. Please try again."
    );
  } finally {
    setLocking(false);
  }
};

  const formatTimer = (
    milliseconds: number
  ) => {
    const totalSeconds =
      Math.ceil(
        milliseconds / 1000
      );

    const minutes =
      Math.floor(
        totalSeconds / 60
      );

    const seconds =
      totalSeconds % 60;

    return `${String(
      minutes
    ).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <section className="flex min-h-[calc(100vh-140px)] items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-red-500" />

          <p className="text-slate-400">
            Loading seats...
          </p>
        </div>
      </section>
    );
  }

  const timerExpired =
    timeLeft !== null &&
    timeLeft <= 0;

  return (
    <section className="min-h-[calc(100vh-140px)] bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-5xl">

        <div className="mb-8">
          <button
            type="button"
            onClick={() =>
              navigate(-1)
            }
            className="mb-5 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-500/10 p-2 text-red-500">
              <Ticket size={22} />
            </div>

            <div>
              <h1 className="text-3xl font-bold sm:text-4xl">
                Select Your Seats
              </h1>

              <p className="mt-1 text-slate-400">
                Choose your preferred seats.
              </p>
            </div>
          </div>
        </div>

        {timeLeft !== null && (
          <div
            className={`mb-6 flex items-center justify-between rounded-xl border p-4 ${
              timerExpired
                ? "border-red-500/30 bg-red-500/10"
                : "border-yellow-500/30 bg-yellow-500/10"
            }`}
          >
            <div className="flex items-center gap-3">
              <Clock
                size={21}
                className={
                  timerExpired
                    ? "text-red-400"
                    : "text-yellow-400"
                }
              />

              <div>
                <p className="text-sm text-slate-400">
                  Seat reservation
                </p>

                <p className="font-semibold">
                  {timerExpired
                    ? "Reservation expired"
                    : "Complete your booking before the timer ends"}
                </p>
              </div>
            </div>

            <span
              className={`text-2xl font-bold tabular-nums ${
                timerExpired
                  ? "text-red-400"
                  : "text-yellow-400"
              }`}
            >
              {formatTimer(
                timeLeft
              )}
            </span>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-8">

          <div className="mb-12">
            <div className="mx-auto max-w-2xl">
              <div className="h-1 rounded-full bg-slate-300 shadow-[0_0_20px_rgba(255,255,255,0.25)]" />

              <p className="mt-3 text-center text-xs font-semibold tracking-[0.3em] text-slate-500">
                SCREEN
              </p>
            </div>
          </div>

          {seats.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-lg font-semibold">
                No seats available
              </p>

              <p className="mt-2 text-slate-400">
                This show does not have any seats configured.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto pb-4">
              <div className="mx-auto min-w-130 max-w-4xl">

                <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">

                  {seats.map(
                    (showSeat) => {
                      const seatId =
                        getSeatId(
                          showSeat
                        );

                      const seatName =
                        getSeatName(
                          showSeat
                        );

                      const isSelected =
                        selected.includes(
                          seatId
                        );

                      const isUnavailable =
                        showSeat.status !==
                        "available";

                      return (
                        <button
                          key={
                            showSeat._id
                          }
                          type="button"
                          disabled={
                            isUnavailable ||
                            locking ||
                            timerExpired
                          }
                          onClick={() =>
                            toggleSeat(
                              showSeat
                            )
                          }
                          className={`relative rounded-lg border px-2 py-3 text-xs font-semibold transition ${
                            isSelected
                              ? "border-red-500 bg-red-600 text-white"
                              : isUnavailable
                              ? "cursor-not-allowed border-slate-800 bg-slate-800 text-slate-600"
                              : "border-slate-700 bg-slate-950 text-slate-300 hover:border-red-500 hover:bg-slate-800"
                          }`}
                        >
                          {isSelected && (
                            <Check
                              size={12}
                              className="absolute right-1 top-1"
                            />
                          )}

                          {seatName}
                        </button>
                      );
                    }
                  )}

                </div>
              </div>
            </div>
          )}

          <div className="mt-10 flex flex-wrap justify-center gap-5 border-t border-slate-800 pt-6 text-xs text-slate-400">

            <div className="flex items-center gap-2">
              <span className="h-4 w-4 rounded bg-slate-950 ring-1 ring-slate-700" />
              Available
            </div>

            <div className="flex items-center gap-2">
              <span className="h-4 w-4 rounded bg-red-600" />
              Selected
            </div>

            <div className="flex items-center gap-2">
              <span className="h-4 w-4 rounded bg-slate-800" />
              Unavailable
            </div>

          </div>

          <div className="mt-5 text-center text-sm text-slate-400">
            Available seats:{" "}
            <strong className="text-white">
              {availableCount}
            </strong>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p className="text-sm text-slate-400">
                Selected seats
              </p>

              <p className="mt-1 font-semibold">
                {selectedNames.length
                  ? selectedNames.join(
                      ", "
                    )
                  : "No seats selected"}
              </p>
            </div>

            <button
              type="button"
              disabled={
                !selected.length ||
                locking ||
                timerExpired
              }
              onClick={
                handleContinue
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-7 py-3 font-semibold transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {locking
                ? "Locking Seats..."
                : timerExpired
                ? "Reservation Expired"
                : "Continue"}
            </button>

          </div>
        </div>

      </div>
    </section>
  );
}

export default SeatSelection;
