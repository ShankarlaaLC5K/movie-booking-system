import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Film,
  Loader2,
  MapPin,
  Ticket,
  XCircle,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

import {
  useEffect,
  useState,
} from "react";

import {
  cancelBooking,
  getMyBookings,
} from "../services/bookingService";

import type {
  Booking,
} from "../types/booking";

function MyBookings() {
  const [bookings, setBookings] =
    useState<Booking[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [cancellingId, setCancellingId] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [totalPages, setTotalPages] =
    useState(1);

  const loadBookings = async (
    requestedPage = page
  ) => {
    try {
      setLoading(true);
      setError("");

      const response =
        await getMyBookings(
          requestedPage
        );

      /*
       * If current page became empty after
       * cancellation, move to previous page.
       */
      if (
        response.bookings.length === 0 &&
        requestedPage > 1 &&
        requestedPage > response.totalPages
      ) {
        setPage(response.totalPages);

        return;
      }

      setBookings(
        response.bookings || []
      );

      setPage(
        response.page || requestedPage
      );

      setTotalPages(
        response.totalPages || 1
      );
    } catch (error: any) {
      console.error(
        "Failed to load bookings:",
        error
      );

      setError(
        error?.response?.data?.message ||
          "Failed to load your bookings."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings(page);
  }, [page]);

  /*
   * Refresh bookings whenever the user
   * comes back to this tab/page.
   *
   * This makes a newly-created pending
   * booking appear without manually
   * refreshing the browser.
   */
  useEffect(() => {
    const handleFocus = () => {
      loadBookings(page);
    };

    const handleVisibilityChange = () => {
      if (
        document.visibilityState ===
        "visible"
      ) {
        loadBookings(page);
      }
    };

    window.addEventListener(
      "focus",
      handleFocus
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      window.removeEventListener(
        "focus",
        handleFocus
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [page]);

  const handleCancel = async (
    bookingId: string
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to cancel this booking?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setCancellingId(
        bookingId
      );

      setError("");

      await cancelBooking(
        bookingId
      );

      await loadBookings(page);
    } catch (error: any) {
      console.error(
        "Failed to cancel booking:",
        error
      );

      setError(
        error?.response?.data?.message ||
          "Failed to cancel booking."
      );
    } finally {
      setCancellingId(null);
    }
  };

  const handlePreviousPage = () => {
    if (page <= 1) {
      return;
    }

    setPage(
      (currentPage) =>
        currentPage - 1
    );
  };

  const handleNextPage = () => {
    if (
      page >= totalPages
    ) {
      return;
    }

    setPage(
      (currentPage) =>
        currentPage + 1
    );
  };

  const getStatusClass = (
    status: string
  ) => {
    switch (
      status.toLowerCase()
    ) {
      case "confirmed":
        return "border-green-500/20 bg-green-500/10 text-green-400";

      case "cancelled":
      case "canceled":
        return "border-red-500/20 bg-red-500/10 text-red-400";

      case "pending":
        return "border-yellow-500/20 bg-yellow-500/10 text-yellow-400";

      default:
        return "border-slate-700 bg-slate-800 text-slate-300";
    }
  };

  const formatDate = (
    date?: string
  ) => {
    if (!date) {
      return "N/A";
    }

    return new Date(
      date
    ).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const formatTime = (
    date?: string
  ) => {
    if (!date) {
      return "N/A";
    }

    return new Date(
      date
    ).toLocaleTimeString(
      "en-IN",
      {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }
    );
  };

  const getSeatName = (
    seat: any
  ): string => {
    if (!seat) {
      return "Unknown";
    }

    if (
      typeof seat === "string"
    ) {
      return seat;
    }

    if (
      seat.row &&
      seat.number !== undefined
    ) {
      return `${seat.row}${seat.number}`;
    }

    if (seat.seatNumber) {
      return seat.seatNumber;
    }

    return (
      seat._id ||
      "Unknown"
    );
  };

  if (loading) {
    return (
      <section className="flex min-h-[calc(100vh-140px)] items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <Loader2
            size={40}
            className="mx-auto mb-4 animate-spin text-red-500"
          />

          <p className="text-slate-400">
            Loading your bookings...
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[calc(100vh-140px)] bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-5xl">

        <div className="mb-8">
          <div className="flex items-center gap-3">

            <div className="rounded-lg bg-red-500/10 p-2 text-red-500">
              <Ticket size={22} />
            </div>

            <div>
              <h1 className="text-3xl font-bold sm:text-4xl">
                My Bookings
              </h1>

              <p className="mt-1 text-slate-400">
                View and manage your movie tickets.
              </p>
            </div>

          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-800">
              <Ticket
                size={30}
                className="text-slate-500"
              />
            </div>

            <h2 className="mt-5 text-xl font-semibold">
              No bookings yet
            </h2>

            <p className="mt-2 text-slate-400">
              You haven't booked any movie tickets yet.
            </p>

            <Link
              to="/movies"
              className="mt-6 inline-flex rounded-lg bg-red-600 px-6 py-3 font-semibold transition hover:bg-red-700"
            >
              Browse Movies
            </Link>

          </div>
        ) : (
          <>
            <div className="space-y-5">

              {bookings.map(
                (booking) => {

                  const status =
                    booking.status.toLowerCase();

                  const isCancelled =
                    status === "cancelled" ||
                    status === "canceled";

                  const isPending =
                    status === "pending";

                  const show =
                    typeof booking.show ===
                    "object"
                      ? booking.show
                      : null;

                  const movie =
                    show &&
                    typeof show.movie ===
                      "object"
                      ? show.movie
                      : null;

                  const theatre =
                    show &&
                    typeof show.theatre ===
                      "object"
                      ? show.theatre
                      : null;

                  const screen =
                    show &&
                    typeof show.screen ===
                      "object"
                      ? show.screen
                      : null;

                  const seatList =
                    Array.isArray(
                      booking.seats
                    )
                      ? booking.seats
                      : [];

                  return (
                    <div
                      key={booking._id}
                      className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-700 sm:p-6"
                    >

                      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

                        <div className="flex items-start gap-4">

                          <div className="rounded-xl bg-red-500/10 p-3 text-red-500">
                            <Ticket size={24} />
                          </div>

                          <div>

                            <p className="text-sm text-slate-400">
                              Booking Reference
                            </p>

                            <h2 className="mt-1 text-lg font-bold">
                              {booking.bookingReference ||
                                booking._id}
                            </h2>

                            {booking.createdAt && (
                              <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                                <CalendarDays
                                  size={15}
                                />

                                Booked on{" "}
                                {formatDate(
                                  booking.createdAt
                                )}
                              </div>
                            )}

                          </div>

                        </div>

                        <span
                          className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold uppercase ${getStatusClass(
                            booking.status
                          )}`}
                        >
                          {booking.status}
                        </span>

                      </div>

                      {movie && (
                        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-4">

                          <div className="flex items-center gap-3">
                            <Film
                              size={20}
                              className="text-red-500"
                            />

                            <div>
                              <p className="text-xs text-slate-500">
                                Movie
                              </p>

                              <p className="mt-1 text-lg font-bold">
                                {movie.title}
                              </p>
                            </div>
                          </div>

                        </div>
                      )}

                      {show && (
                        <div className="mt-4 grid gap-4 rounded-xl border border-slate-800 bg-slate-950 p-4 sm:grid-cols-3">

                          <div>
                            <div className="flex items-center gap-2 text-slate-500">
                              <MapPin size={15} />

                              <p className="text-xs">
                                Theatre
                              </p>
                            </div>

                            <p className="mt-1 font-semibold">
                              {theatre?.name ||
                                "N/A"}
                            </p>

                            {theatre?.city && (
                              <p className="mt-1 text-xs text-slate-500">
                                {theatre.city}
                              </p>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2 text-slate-500">
                              <Ticket size={15} />

                              <p className="text-xs">
                                Screen
                              </p>
                            </div>

                            <p className="mt-1 font-semibold">
                              {screen?.name ||
                                "N/A"}
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center gap-2 text-slate-500">
                              <Clock size={15} />

                              <p className="text-xs">
                                Show Time
                              </p>
                            </div>

                            <p className="mt-1 font-semibold">
                              {formatDate(
                                show.startTime
                              )}
                            </p>

                            <p className="mt-1 text-sm text-red-400">
                              {formatTime(
                                show.startTime
                              )}
                            </p>
                          </div>

                        </div>
                      )}

                      <div className="mt-4 grid gap-4 border-t border-slate-800 pt-5 sm:grid-cols-3">

                        <div>
                          <p className="text-xs text-slate-500">
                            Seats
                          </p>

                          <div className="mt-2 flex flex-wrap gap-2">
                            {seatList.length >
                            0 ? (
                              seatList.map(
                                (
                                  seat,
                                  index
                                ) => (
                                  <span
                                    key={`${getSeatName(
                                      seat
                                    )}-${index}`}
                                    className="rounded-md bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400"
                                  >
                                    {getSeatName(
                                      seat
                                    )}
                                  </span>
                                )
                              )
                            ) : (
                              <span className="text-sm text-slate-400">
                                N/A
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Total Amount
                          </p>

                          <p className="mt-1 text-lg font-bold text-red-400">
                            ₹
                            {Number(
                              booking.totalAmount
                            ).toFixed(2)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Booking ID
                          </p>

                          <p className="mt-1 truncate text-sm text-slate-300">
                            {booking._id}
                          </p>
                        </div>

                      </div>

                      <div className="mt-6 flex flex-col gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:justify-end">

                        <Link
                          to={`/bookings/${booking._id}`}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                        >
                          View Details

                          <ChevronRight
                            size={16}
                          />
                        </Link>

                        {!isCancelled &&
                          !isPending && (
                            <button
                              type="button"
                              disabled={
                                cancellingId ===
                                booking._id
                              }
                              onClick={() =>
                                handleCancel(
                                  booking._id
                                )
                              }
                              className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/30 px-5 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {cancellingId ===
                              booking._id ? (
                                <>
                                  <Loader2
                                    size={16}
                                    className="animate-spin"
                                  />

                                  Cancelling...
                                </>
                              ) : (
                                <>
                                  <XCircle
                                    size={16}
                                  />

                                  Cancel Booking
                                </>
                              )}
                            </button>
                          )}

                      </div>

                    </div>
                  );
                }
              )}

            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:flex-row">

                <p className="text-sm text-slate-400">
                  Page{" "}
                  <span className="font-semibold text-white">
                    {page}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-white">
                    {totalPages}
                  </span>
                </p>

                <div className="flex items-center gap-3">

                  <button
                    type="button"
                    onClick={
                      handlePreviousPage
                    }
                    disabled={
                      page <= 1
                    }
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft
                      size={16}
                    />

                    Previous
                  </button>

                  <button
                    type="button"
                    onClick={
                      handleNextPage
                    }
                    disabled={
                      page >=
                      totalPages
                    }
                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next

                    <ChevronRight
                      size={16}
                    />
                  </button>

                </div>

              </div>
            )}

          </>
        )}

      </div>
    </section>
  );
}

export default MyBookings;