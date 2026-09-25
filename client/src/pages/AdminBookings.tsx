import {
  CalendarDays,
  Loader2,
  Ticket,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  getAllBookings,
  cancelBooking,
} from "../services/bookingService";

import type {
  Booking,
} from "../types/booking";

function AdminBookings() {
  const [bookings, setBookings] =
    useState<Booking[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError("");

    const response =
  await getAllBookings();

      setBookings(
        response.bookings || []
      );
    } catch (error: any) {
      console.error(
        "Failed to load bookings:",
        error
      );

      setError(
        error?.response?.data?.message ||
          "Failed to load bookings."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);
const handleCancelBooking = async (
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
    setError("");

    await cancelBooking(bookingId);

    await loadBookings();
  } catch (error: any) {
    console.error(
      "Failed to cancel booking:",
      error
    );

    setError(
      error?.response?.data?.message ||
        "Failed to cancel booking."
    );
  }
};

  const getMovieName = (
    booking: Booking
  ) => {
    if (
      typeof booking.show === "object" &&
      booking.show !== null
    ) {
      if (
        typeof booking.show.movie ===
        "object" &&
        booking.show.movie !== null
      ) {
        return booking.show.movie.title;
      }

      return String(
        booking.show.movie || "N/A"
      );
    }

    return "N/A";
  };

  const getTheatreName = (
    booking: Booking
  ) => {
    if (
      typeof booking.show === "object" &&
      booking.show !== null
    ) {
      if (
        typeof booking.show.theatre ===
        "object" &&
        booking.show.theatre !== null
      ) {
        return booking.show.theatre.name;
      }

      return String(
        booking.show.theatre || "N/A"
      );
    }

    return "N/A";
  };

  const getScreenName = (
    booking: Booking
  ) => {
    if (
      typeof booking.show === "object" &&
      booking.show !== null
    ) {
      if (
        typeof booking.show.screen ===
        "object" &&
        booking.show.screen !== null
      ) {
        return booking.show.screen.name;
      }

      return String(
        booking.show.screen || "N/A"
      );
    }

    return "N/A";
  };

  const getShowDate = (
    booking: Booking
  ) => {
    if (
      typeof booking.show !== "object" ||
      !booking.show?.startTime
    ) {
      return "N/A";
    }

    return new Date(
      booking.show.startTime
    ).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const getShowTime = (
    booking: Booking
  ) => {
    if (
      typeof booking.show !== "object" ||
      !booking.show?.startTime
    ) {
      return "N/A";
    }

    return new Date(
      booking.show.startTime
    ).toLocaleTimeString(
      "en-IN",
      {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }
    );
  };

  const getSeatNames = (
    booking: Booking
  ) => {
    if (
      !Array.isArray(
        booking.seats
      )
    ) {
      return [];
    }

    return booking.seats.map(
      (seat) => {
        if (
          typeof seat === "object" &&
          seat !== null
        ) {
          if (
            seat.row &&
            seat.number !== undefined
          ) {
            return `${seat.row}${seat.number}`;
          }

          return seat._id;
        }

        return seat;
      }
    );
  };

  const getStatusClass = (
    status: string
  ) => {
    switch (
      status.toLowerCase()
    ) {
      case "confirmed":
        return "bg-green-500/10 text-green-400";

      case "cancelled":
      case "canceled":
        return "bg-red-500/10 text-red-400";

      case "pending":
        return "bg-yellow-500/10 text-yellow-400";

      default:
        return "bg-slate-800 text-slate-300";
    }
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
            Loading bookings...
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[calc(100vh-140px)] bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-7xl">

        <div className="mb-8">
          <div className="flex items-center gap-3">

            <div className="rounded-lg bg-red-500/10 p-2 text-red-500">
              <Ticket size={22} />
            </div>

            <div>
              <h1 className="text-3xl font-bold">
                Admin Bookings
              </h1>

              <p className="mt-1 text-slate-400">
                View all movie ticket bookings.
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

            <Ticket
              size={40}
              className="mx-auto text-slate-600"
            />

            <h2 className="mt-4 text-xl font-semibold">
              No bookings found
            </h2>

            <p className="mt-2 text-slate-400">
              There are no bookings available.
            </p>

          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">

            <div className="overflow-x-auto">

              <table className="w-full min-w-275 text-left">

                <thead className="border-b border-slate-800 bg-slate-950">

                  <tr>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Booking
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Movie
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Theatre
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Show
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Seats
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Amount
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-800">

                  {bookings.map(
                    (booking) => {

                      const seatNames =
                        getSeatNames(
                          booking
                        );

                      return (
                        <tr
                          key={
                            booking._id
                          }
                          className="transition hover:bg-slate-800/40"
                        >

                          <td className="px-5 py-5">

                            <p className="font-semibold text-white">
                              {booking.bookingReference ||
                                booking._id}
                            </p>

                            {booking.createdAt && (
                              <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                                <CalendarDays
                                  size={13}
                                />

                                {new Date(
                                  booking.createdAt
                                ).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  }
                                )}
                              </div>
                            )}

                          </td>

                          <td className="px-5 py-5">

                            <p className="font-medium text-slate-200">
                              {getMovieName(
                                booking
                              )}
                            </p>

                          </td>

                          <td className="px-5 py-5">

                            <p className="font-medium text-slate-200">
                              {getTheatreName(
                                booking
                              )}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {getScreenName(
                                booking
                              )}
                            </p>

                          </td>

                          <td className="px-5 py-5">

                            <p className="font-medium text-slate-200">
                              {getShowDate(
                                booking
                              )}
                            </p>

                            <p className="mt-1 text-sm text-red-400">
                              {getShowTime(
                                booking
                              )}
                            </p>

                          </td>

                          <td className="px-5 py-5">

                            <div className="flex max-w-45 flex-wrap gap-1.5">

                              {seatNames.map(
                                (
                                  seat,
                                  index
                                ) => (
                                  <span
                                    key={`${seat}-${index}`}
                                    className="rounded-md bg-slate-800 px-2 py-1 text-xs font-medium text-slate-300"
                                  >
                                    {seat}
                                  </span>
                                )
                              )}

                            </div>

                          </td>

                          <td className="px-5 py-5">

                            <p className="font-semibold text-red-400">
                              ₹
                              {Number(
                                booking.totalAmount
                              ).toFixed(2)}
                            </p>

                          </td>

                          <td className="px-5 py-5">
  <div className="flex flex-col items-start gap-2">

    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase ${getStatusClass(
        booking.status
      )}`}
    >
      {booking.status}
    </span>

    {booking.status !== "cancelled" &&
      booking.status !== "canceled" && (
        <button
          type="button"
          onClick={() =>
            handleCancelBooking(
              booking._id
            )
          }
          className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
        >
          Cancel Ticket
        </button>
      )}

  </div>
</td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

          </div>
        )}

      </div>
    </section>
  );
}

export default AdminBookings;
