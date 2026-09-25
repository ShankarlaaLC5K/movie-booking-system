import {
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  IndianRupee,
  Ticket,
  TrendingUp,
  XCircle,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import api from "../services/api";

interface ReportSummary {
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  totalSales: number;
}

interface PopularMovie {
  _id: string;
  movieTitle: string;
  bookings: number;
}

interface TheatreOccupancy {
  _id: string;
  theatreName: string;
  totalSeats: number;
  bookedSeats: number;
  occupancyRate: number;
}

interface BookingTrend {
  _id: string;
  bookings: number;
  sales: number;
}

interface ReportsData {
  summary: ReportSummary;
  popularMovies: PopularMovie[];
  theatreOccupancy: TheatreOccupancy[];
  bookingTrends: BookingTrend[];
}

interface ReportsResponse {
  success: boolean;
  data: ReportsData;
}

function AdminReports() {
  const [reports, setReports] =
    useState<ReportsData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await api.get<ReportsResponse>(
            "/reports"
          );

        setReports(
          response.data.data
        );
      } catch (error: any) {
        console.error(
          "Failed to load reports:",
          error
        );

        setError(
          error?.response?.data?.message ||
            "Failed to load reports."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadReports();
  }, []);

  if (loading) {
    return (
      <section className="flex min-h-[calc(100vh-140px)] items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-red-500" />

          <p className="text-slate-400">
            Loading reports...
          </p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="min-h-[calc(100vh-140px)] bg-slate-950 px-4 py-10 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center">
            <p className="text-red-400">
              {error}
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (!reports) {
    return null;
  }

  const {
    summary,
    popularMovies,
    theatreOccupancy,
    bookingTrends,
  } = reports;

  const maxMovieBookings =
    Math.max(
      ...popularMovies.map(
        (movie) => movie.bookings
      ),
      1
    );

  const maxTrendBookings =
    Math.max(
      ...bookingTrends.map(
        (trend) => trend.bookings
      ),
      1
    );

  return (
    <section className="min-h-[calc(100vh-140px)] bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-7xl">

        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-wider text-red-500">
            Administration
          </p>

          <div className="mt-2 flex items-center gap-3">
            <BarChart3
              size={30}
              className="text-red-500"
            />

            <h1 className="text-3xl font-bold sm:text-4xl">
              Reports & Analytics
            </h1>
          </div>

          <p className="mt-3 max-w-3xl text-slate-400">
            Monitor booking trends, sales performance,
            popular movies and theatre occupancy.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-red-500/10 p-3 text-red-500">
                <Ticket size={24} />
              </div>

              <TrendingUp
                size={20}
                className="text-green-400"
              />
            </div>

            <p className="mt-5 text-sm text-slate-400">
              Total Bookings
            </p>

            <p className="mt-1 text-3xl font-bold">
              {summary.totalBookings}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="rounded-xl bg-green-500/10 p-3 text-green-400 w-fit">
              <IndianRupee size={24} />
            </div>

            <p className="mt-5 text-sm text-slate-400">
              Total Sales
            </p>

            <p className="mt-1 text-3xl font-bold">
              ₹
              {Number(
                summary.totalSales
              ).toLocaleString("en-IN")}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="rounded-xl bg-blue-500/10 p-3 text-blue-400 w-fit">
              <CheckCircle2 size={24} />
            </div>

            <p className="mt-5 text-sm text-slate-400">
              Confirmed Bookings
            </p>

            <p className="mt-1 text-3xl font-bold">
              {summary.confirmedBookings}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="rounded-xl bg-red-500/10 p-3 text-red-400 w-fit">
              <XCircle size={24} />
            </div>

            <p className="mt-5 text-sm text-slate-400">
              Cancelled Bookings
            </p>

            <p className="mt-1 text-3xl font-bold">
              {summary.cancelledBookings}
            </p>
          </div>

        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center gap-3">
              <BarChart3
                size={22}
                className="text-red-500"
              />

              <h2 className="text-xl font-semibold">
                Popular Movies
              </h2>
            </div>

            {popularMovies.length === 0 ? (
              <p className="mt-8 text-center text-sm text-slate-500">
                No confirmed bookings yet.
              </p>
            ) : (
              <div className="mt-6 space-y-5">
                {popularMovies.map(
                  (movie) => (
                    <div
                      key={movie._id}
                    >
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <p className="truncate font-medium">
                          {movie.movieTitle}
                        </p>

                        <span className="shrink-0 text-sm text-slate-400">
                          {movie.bookings} tickets
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-red-500 transition-all"
                          style={{
                            width: `${
                              (movie.bookings /
                                maxMovieBookings) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center gap-3">
              <CalendarDays
                size={22}
                className="text-red-500"
              />

              <h2 className="text-xl font-semibold">
                Booking Trends
              </h2>
            </div>

            {bookingTrends.length === 0 ? (
              <p className="mt-8 text-center text-sm text-slate-500">
                No booking activity yet.
              </p>
            ) : (
              <div className="mt-6 space-y-4">
                {bookingTrends.map(
                  (trend) => (
                    <div
                      key={trend._id}
                      className="flex items-center gap-4"
                    >
                      <div className="w-24 shrink-0">
                        <p className="text-xs text-slate-500">
                          {trend._id}
                        </p>
                      </div>

                      <div className="flex-1">
                        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{
                              width: `${
                                (trend.bookings /
                                  maxTrendBookings) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      </div>

                      <span className="w-20 text-right text-sm text-slate-300">
                        {trend.bookings}
                      </span>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

        </div>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <div className="flex items-center gap-3">
            <Building2
              size={22}
              className="text-red-500"
            />

            <h2 className="text-xl font-semibold">
              Theatre Occupancy
            </h2>
          </div>

          {theatreOccupancy.length === 0 ? (
            <p className="mt-8 text-center text-sm text-slate-500">
              No theatre occupancy data available.
            </p>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-162.5 text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-sm text-slate-500">
                    <th className="px-4 py-3">
                      Theatre
                    </th>

                    <th className="px-4 py-3">
                      Total Seats
                    </th>

                    <th className="px-4 py-3">
                      Booked
                    </th>

                    <th className="px-4 py-3">
                      Occupancy
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {theatreOccupancy.map(
                    (theatre) => (
                      <tr
                        key={theatre._id}
                        className="border-b border-slate-800/70"
                      >
                        <td className="px-4 py-4 font-semibold">
                          {theatre.theatreName}
                        </td>

                        <td className="px-4 py-4 text-slate-400">
                          {theatre.totalSeats}
                        </td>

                        <td className="px-4 py-4 text-slate-400">
                          {theatre.bookedSeats}
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-800">
                              <div
                                className="h-full rounded-full bg-green-500"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    theatre.occupancyRate
                                  )}%`,
                                }}
                              />
                            </div>

                            <span className="text-sm font-semibold text-green-400">
                              {Number(
                                theatre.occupancyRate
                              ).toFixed(1)}
                              %
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}

        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center gap-3">
              <Clock3
                size={22}
                className="text-yellow-400"
              />

              <div>
                <p className="text-sm text-slate-500">
                  Pending Bookings
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {summary.pendingBookings}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center gap-3">
              <Ticket
                size={22}
                className="text-red-500"
              />

              <div>
                <p className="text-sm text-slate-500">
                  Cancellation Rate
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {summary.totalBookings > 0
                    ? (
                        (summary.cancelledBookings /
                          summary.totalBookings) *
                        100
                      ).toFixed(1)
                    : "0.0"}
                  %
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

export default AdminReports;