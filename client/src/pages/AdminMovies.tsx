import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Film, Trash2 } from "lucide-react";

import {
  getMovies,
  deleteMovie,
} from "../services/movieService";

import type { Movie } from "../types/movie";

const TMDB_IMAGE_BASE_URL =
  "https://image.tmdb.org/t/p/w500";

function getPosterUrl(
  posterPath?: string
): string {
  if (!posterPath) {
    return "";
  }

  if (
    posterPath.startsWith("http://") ||
    posterPath.startsWith("https://")
  ) {
    return posterPath;
  }

  return `${TMDB_IMAGE_BASE_URL}${
    posterPath.startsWith("/")
      ? ""
      : "/"
  }${posterPath}`;
}

function AdminMovies() {
  const [movies, setMovies] =
    useState<Movie[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  useEffect(() => {
    const loadMovies = async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await getMovies();

        setMovies(response.movies);
      } catch (error: any) {
        console.error(
          "Failed to load movies:",
          error
        );

        setError(
          error?.response?.data?.message ||
            "Failed to load movies."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadMovies();
  }, []);

  const handleDelete = async (
    movie: Movie
  ) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to remove "${movie.title}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(movie._id);
      setError("");

      await deleteMovie(movie._id);

      setMovies((currentMovies) =>
        currentMovies.filter(
          (item) =>
            item._id !== movie._id
        )
      );
    } catch (error: any) {
      console.error(
        "Failed to delete movie:",
        error
      );

      setError(
        error?.response?.data?.message ||
          "Failed to delete movie."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="min-h-[calc(100vh-140px)] bg-slate-50 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-7xl">

        <div className="mb-8">
          <h1 className="text-3xl font-bold sm:text-4xl">
            Manage Movies
          </h1>

          <p className="mt-2 text-slate-600 dark:text-slate-400">
            View and manage movies in the booking system.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-500 dark:text-red-400">
            {error}
          </div>
        )}

        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            Loading movies...
          </div>
        )}

        {!loading &&
          !error &&
          movies.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">

              <Film
                size={48}
                className="mx-auto text-slate-400 dark:text-slate-600"
              />

              <h2 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">
                No movies found
              </h2>

              <p className="mt-2 text-slate-600 dark:text-slate-400">
                There are no movies added yet.
                Add a movie to get started.
              </p>

            </div>
          )}

        {!loading &&
          !error &&
          movies.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">

              <div className="overflow-x-auto">
                <table className="w-full min-w-225">

                  <thead className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                    <tr>

                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                        Movie
                      </th>

                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                        Language
                      </th>

                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                        Release Date
                      </th>

                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                        Rating
                      </th>

                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                        Status
                      </th>

                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                        Action
                      </th>

                    </tr>
                  </thead>

                  <tbody>

                    {movies.map((movie) => (
                      <tr
                        key={movie._id}
                        className="border-b border-slate-200 last:border-b-0 dark:border-slate-800"
                      >

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">

                            {movie.posterPath ? (
                              <img
                                src={getPosterUrl(
                                  movie.posterPath
                                )}
                                alt={movie.title}
                                className="h-16 w-12 rounded object-cover"
                                onError={(event) => {
                                  event.currentTarget.style.display =
                                    "none";
                                }}
                              />
                            ) : (
                              <div className="flex h-16 w-12 items-center justify-center rounded bg-slate-200 dark:bg-slate-800">
                                <Film
                                  size={20}
                                  className="text-slate-400 dark:text-slate-600"
                                />
                              </div>
                            )}

                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">
                                {movie.title}
                              </p>

                              {movie.tmdbId && (
                                <p className="mt-1 text-xs text-slate-500">
                                  TMDB ID:{" "}
                                  {movie.tmdbId}
                                </p>
                              )}
                            </div>

                          </div>
                        </td>

                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                          {movie.language ||
                            "-"}
                        </td>

                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                          {movie.releaseDate
                            ? new Date(
                                movie.releaseDate
                              ).toLocaleDateString()
                            : "-"}
                        </td>

                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                          {movie.rating !==
                          undefined
                            ? movie.rating.toFixed(
                                1
                              )
                            : "-"}
                        </td>

                        <td className="px-6 py-4">

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              movie.isActive ===
                              false
                                ? "bg-red-500/10 text-red-500 dark:text-red-400"
                                : "bg-green-500/10 text-green-500 dark:text-green-400"
                            }`}
                          >
                            {movie.isActive ===
                            false
                              ? "Inactive"
                              : "Active"}
                          </span>

                        </td>

                        <td className="px-6 py-4">

                          <div className="flex items-center gap-2">

                            <Link
                              to={`/movies/${movie._id}`}
                              className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                            >
                              View
                            </Link>

                            <button
                              type="button"
                              onClick={() =>
                                void handleDelete(
                                  movie
                                )
                              }
                              disabled={
                                deletingId ===
                                movie._id
                              }
                              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Trash2
                                size={16}
                              />

                              {deletingId ===
                              movie._id
                                ? "Removing..."
                                : "Remove"}
                            </button>

                          </div>

                        </td>

                      </tr>
                    ))}

                  </tbody>

                </table>
              </div>

            </div>
          )}

      </div>
    </section>
  );
}

export default AdminMovies;