import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  MapPin,
  Ticket,
} from "lucide-react";

import { getMovieById } from "../services/movieService";
import { getShowsByMovie } from "../services/showService";

import type { Movie } from "../types/movie";
import type { Show } from "../types/show";

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

function getPosterUrl(posterPath?: string) {
  if (!posterPath) return "";

  if (
    posterPath.startsWith("http://") ||
    posterPath.startsWith("https://")
  ) {
    return posterPath;
  }

  return `${TMDB_IMAGE_BASE_URL}${posterPath.startsWith("/") ? "" : "/"}${posterPath}`;
}

function ShowSelection() {
  const { id } = useParams<{ id: string }>();

  const [movie, setMovie] = useState<Movie | null>(null);
  const [shows, setShows] = useState<Show[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setError("Movie ID is missing.");
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const [movieResponse, showsResponse] =
          await Promise.all([
            getMovieById(id),
            getShowsByMovie(id),
          ]);

        setMovie(movieResponse.movie);
        setShows(showsResponse.shows);
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            "Failed to load shows."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const groupedShows = useMemo(() => {
    const groups: Record<string, Show[]> = {};

    shows.forEach((show) => {
      const date = new Date(show.startTime).toLocaleDateString(
        "en-IN",
        {
          weekday: "long",
          day: "numeric",
          month: "short",
          year: "numeric",
        }
      );

      if (!groups[date]) {
        groups[date] = [];
      }

      groups[date].push(show);
    });

    return groups;
  }, [shows]);

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };
  const isShowBookable = (show: Show) => {
  const now = Date.now();

  const startTime = new Date(
    show.startTime
  ).getTime();

  const endTime = new Date(
    show.endTime
  ).getTime();

  return (
    now < startTime &&
    now < endTime
  );
};

  if (loading) {
    return (
      <section className="min-h-[calc(100vh-140px)] bg-slate-950 px-4 py-16">
        <div className="mx-auto flex max-w-7xl justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-red-500" />

            <p className="text-slate-400">
              Loading available shows...
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="min-h-[calc(100vh-140px)] bg-slate-950 px-4 py-16">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
            <p className="text-red-400">{error}</p>

            <Link
              to="/movies"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700"
            >
              <ArrowLeft size={18} />
              Back to Movies
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[calc(100vh-140px)] bg-slate-950 px-4 py-10">
      <div className="mx-auto max-w-7xl">

        <Link
          to={`/movies/${id}`}
          className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
        >
          <ArrowLeft size={17} />
          Back to Movie
        </Link>

        <div className="mb-10 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8">

            {movie?.posterPath ? (
              <img
                src={getPosterUrl(movie.posterPath)}
                alt={movie.title}
                className="h-40 w-28 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-40 w-28 items-center justify-center rounded-xl bg-slate-800 text-4xl">
                🎬
              </div>
            )}

            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-red-500">
                Select Your Show
              </p>

              <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
                {movie?.title}
              </h1>

              <p className="mt-3 text-slate-400">
                Choose a theatre and showtime to continue.
              </p>
            </div>
          </div>
        </div>

        {shows.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center">
            <CalendarDays
              className="mx-auto text-slate-600"
              size={48}
            />

            <h2 className="mt-4 text-xl font-semibold text-white">
              No Shows Available
            </h2>

            <p className="mt-2 text-slate-400">
              There are currently no upcoming shows for this movie.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(groupedShows).map(
              ([date, dateShows]) => (
                <div key={date}>

                  <div className="mb-5 flex items-center gap-3">
                    <CalendarDays
                      size={22}
                      className="text-red-500"
                    />

                    <h2 className="text-xl font-bold text-white">
                      {date}
                    </h2>
                  </div>

                  <div className="space-y-5">
                    {dateShows.map((show) => (
                      <div
                        key={show._id}
                        className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-700"
                      >
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                          <div>
                            <div className="flex items-center gap-2">
                              <MapPin
                                size={18}
                                className="text-red-500"
                              />

                              <h3 className="text-lg font-bold text-white">
                                {show.theatre.name}
                              </h3>
                            </div>

                            <p className="mt-2 text-sm text-slate-400">
                              {show.theatre.address}
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                              {show.theatre.city},{" "}
                              {show.theatre.state}
                            </p>

                            <p className="mt-3 text-sm text-slate-400">
                              Screen:{" "}
                              <span className="text-slate-200">
                                {show.screen.name}
                              </span>
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">

                            <div className="rounded-lg border border-slate-700 bg-slate-950 px-5 py-3">
                              <div className="flex items-center gap-2 text-slate-300">
                                <Clock3 size={18} />

                                <span className="text-lg font-bold text-white">
                                  {formatTime(show.startTime)}
                                </span>
                              </div>
                            </div>

                            <span className="rounded-lg bg-slate-800 px-4 py-3 text-sm font-medium text-slate-300">
                              {show.language}
                            </span>

                            <span className="rounded-lg bg-slate-800 px-4 py-3 text-sm font-medium text-slate-300">
                              {show.format}
                            </span>

                            <span className="rounded-lg bg-green-500/10 px-4 py-3 text-sm font-semibold text-green-400">
                              ₹{show.price}
                            </span>

                            {isShowBookable(show) ? (
  <Link
    to={`/shows/${show._id}/seats`}
    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700"
  >
    <Ticket size={18} />
    Select Seats
  </Link>
) : (
  <button
    type="button"
    disabled
    className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-slate-700 px-5 py-3 font-semibold text-slate-400"
  >
    <Ticket size={18} />
    Show Unavailable
  </button>
)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default ShowSelection;
