import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Search,
  Star,
  Ticket,
} from "lucide-react";

import api from "../services/api";

interface RecentMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  original_language: string;
}

interface RecentMoviesResponse {
  success: boolean;
  data: {
    page: number;
    results: RecentMovie[];
    total_pages: number;
    total_results: number;
  };
}

const TMDB_IMAGE_BASE_URL =
  "https://image.tmdb.org/t/p/w500";

function getPosterUrl(
  posterPath: string | null
): string {
  if (!posterPath) {
    return "";
  }

  return `${TMDB_IMAGE_BASE_URL}${posterPath}`;
}

function formatReleaseDate(
  date: string
): string {
  if (!date) {
    return "Release date unavailable";
  }

  const parsedDate =
    new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function Home() {
  const [recentMovies, setRecentMovies] =
    useState<RecentMovie[]>([]);

  const [
    loadingRecentMovies,
    setLoadingRecentMovies,
  ] = useState(true);

  const [
    recentMoviesError,
    setRecentMoviesError,
  ] = useState("");

useEffect(() => {
  let cancelled = false;

  const loadRecentMovies = async (
    attempt = 1
  ): Promise<void> => {
    try {
      setLoadingRecentMovies(true);

      if (!cancelled) {
        setRecentMoviesError("");
      }

      const response =
        await api.get<RecentMoviesResponse>(
          "/movies/recent",
          {
            timeout: 15000,
          }
        );

      if (cancelled) {
        return;
      }

      setRecentMovies(
        response.data.data.results.slice(0, 6)
      );
    } catch (error: any) {
      console.error(
        `Failed to load recent movies (attempt ${attempt}):`,
        error
      );

      /*
       * Retry once automatically.
       * This prevents a temporary backend/TMDB
       * connection issue from showing an error
       * on the first page load.
       */
      if (attempt < 2 && !cancelled) {
        window.setTimeout(() => {
          void loadRecentMovies(
            attempt + 1
          );
        }, 1000);

        return;
      }

      if (!cancelled) {
        setRecentMoviesError(
          error?.response?.data?.message ||
            "Failed to load recent releases."
        );
      }
    } finally {
      if (!cancelled) {
        setLoadingRecentMovies(false);
      }
    }
  };

  void loadRecentMovies();

  return () => {
    cancelled = true;
  };
}, []);

 return (
  <div className="bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">

    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-red-100 via-slate-50 to-slate-50 dark:from-red-950/40 dark:via-slate-950 dark:to-slate-950" />

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:py-8 lg:py-10">
        <div className="max-w-3xl">

          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-500 dark:text-red-400">
            <Ticket size={16} />
            Your movie experience starts here
          </div>

          <h1 className="text-4xl font-extrabold leading-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
            Book Your
            <span className="text-red-500">
              {" "}
              Movie Tickets{" "}
            </span>
            Easily
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-6 text-slate-600 dark:text-slate-400 sm:text-lg">
            Discover movies, choose your favourite
            theatre, select your seats and book your
            tickets in just a few clicks.
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">

            <Link
              to="/movies"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700"
            >
              Browse Movies
              <ArrowRight size={18} />
            </Link>

            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Create Account
            </Link>

          </div>
        </div>
      </div>
    </section>

    <section className="border-y border-slate-200 bg-slate-100/70 dark:border-slate-800 dark:bg-slate-900/50">
      <div className="mx-auto max-w-7xl px-4 py-8">

        <div className="grid gap-4 md:grid-cols-[1fr_auto]">

          <div className="flex items-center rounded-lg border border-slate-300 bg-white px-4 dark:border-slate-700 dark:bg-slate-950">
            <Search
              size={20}
              className="mr-3 text-slate-500"
            />

            <input
              type="text"
              placeholder="Search for movies..."
              className="w-full bg-transparent py-3 text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
            />
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700"
          >
            <Search size={18} />
            Search
          </button>

        </div>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-4 py-16">

      <div className="mb-8 flex items-end justify-between gap-4">

        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-red-500">
            Fresh From Theaters
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
            Recent Releases
          </h2>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Check out movies released recently.
          </p>
        </div>

        <Link
          to="/movies"
          className="hidden items-center gap-2 text-sm font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 sm:flex"
        >
          View All
          <ArrowRight size={16} />
        </Link>

      </div>

      {loadingRecentMovies && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map(
            (_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="h-80 animate-pulse bg-slate-200 dark:bg-slate-800" />

                <div className="space-y-3 p-5">
                  <div className="h-6 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-10 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
            )
          )}
        </div>
      )}

      {!loadingRecentMovies &&
        recentMoviesError && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
            <p className="text-red-500 dark:text-red-400">
              {recentMoviesError}
            </p>

            <Link
              to="/movies"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 font-semibold text-white hover:bg-red-700"
            >
              Browse Movies
              <ArrowRight size={17} />
            </Link>
          </div>
        )}

      {!loadingRecentMovies &&
        !recentMoviesError &&
        recentMovies.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="text-slate-500 dark:text-slate-400">
              No recent releases found.
            </p>
          </div>
        )}

      {!loadingRecentMovies &&
        !recentMoviesError &&
        recentMovies.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

            {recentMovies.map((movie) => (
              <div
                key={movie.id}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
              >

                <div className="relative aspect-2/3 overflow-hidden bg-slate-200 dark:bg-slate-800">

                  {movie.poster_path ? (
                    <img
                      src={getPosterUrl(
                        movie.poster_path
                      )}
                      alt={movie.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="text-5xl">
                        🎬
                      </span>
                    </div>
                  )}

                  <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-md bg-slate-950/90 px-2.5 py-1.5 text-sm font-semibold text-yellow-400">
                    <Star
                      size={14}
                      fill="currentColor"
                    />

                    {movie.vote_average
                      ? movie.vote_average.toFixed(1)
                      : "N/A"}
                  </div>

                </div>

                <div className="flex flex-1 flex-col p-5">

                  <h3 className="line-clamp-2 min-h-14 text-xl font-bold text-slate-900 dark:text-white">
                    {movie.title}
                  </h3>

                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <CalendarDays size={16} />

                    <span>
                      {formatReleaseDate(
                        movie.release_date
                      )}
                    </span>
                  </div>

                  <p className="mt-2 text-sm uppercase text-slate-500 dark:text-slate-500">
                    {movie.original_language ||
                      "Unknown"}
                  </p>

                  <p className="mt-4 min-h-18 line-clamp-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {movie.overview ||
                      "No description available."}
                  </p>

                  <Link
                    to="/movies"
                    className="mt-auto flex items-center justify-center gap-2 rounded-lg bg-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-800 transition hover:bg-red-600 hover:text-white dark:bg-slate-800 dark:text-white dark:hover:bg-red-600"
                  >
                    Browse Movies
                    <ArrowRight size={16} />
                  </Link>

                </div>
              </div>
            ))}

          </div>
        )}

      <div className="mt-8 text-center sm:hidden">
        <Link
          to="/movies"
          className="inline-flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
        >
          View All Movies
          <ArrowRight size={16} />
        </Link>
      </div>

    </section>

    <section className="border-y border-slate-200 bg-slate-100/70 dark:border-slate-800 dark:bg-slate-900/50">

      <div className="mx-auto max-w-7xl px-4 py-16">

        <div className="mx-auto max-w-2xl text-center">

          <MapPin
            className="mx-auto text-red-500"
            size={32}
          />

          <h2 className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">
            Find Movies Near You
          </h2>

          <p className="mt-3 text-slate-500 dark:text-slate-400">
            Choose a theatre and discover available
            shows and seats near your location.
          </p>

          <Link
            to="/movies"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700"
          >
            Explore Movies
            <ArrowRight size={18} />
          </Link>

        </div>
      </div>
    </section>

  </div>
);
}

export default Home;