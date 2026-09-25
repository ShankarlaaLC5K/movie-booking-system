import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Film,
  Languages,
  Play,
  Star,
  Ticket,
} from "lucide-react";

import {
  getMovieById,
  getTMDBMovieDetails,
} from "../services/movieService";

import type { Movie } from "../types/movie";

const TMDB_IMAGE_BASE_URL =
  "https://image.tmdb.org/t/p";

function getImageUrl(
  imagePath?: string,
  size:
    | "w500"
    | "w780"
    | "original" = "w500"
) {
  if (!imagePath) {
    return "";
  }

  if (
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://")
  ) {
    return imagePath;
  }

  return `${TMDB_IMAGE_BASE_URL}/${size}${
    imagePath.startsWith("/")
      ? ""
      : "/"
  }${imagePath}`;
}

function MovieDetails() {
  const { id } =
    useParams<{ id: string }>();

  const navigate = useNavigate();

  const [movie, setMovie] =
    useState<Movie | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadMovie = async () => {
      if (!id) {
        setError("Movie ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        if (id.startsWith("tmdb-")) {
          const tmdbIdText =
            id.replace("tmdb-", "");

          const tmdbId =
            Number(tmdbIdText);

          if (
            !Number.isInteger(tmdbId) ||
            tmdbId <= 0
          ) {
            throw new Error(
              "Invalid TMDB movie ID."
            );
          }

          const data =
            await getTMDBMovieDetails(
              tmdbId
            );

          const mappedMovie: Movie = {
            _id: id,
            tmdbId: data.id,
            title: data.title,
            overview: data.overview,
            posterPath:
              data.poster_path ||
              undefined,
            backdropPath:
              data.backdrop_path ||
              undefined,
            releaseDate:
              data.release_date ||
              undefined,
            runtime:
              data.runtime ||
              undefined,
            genres:
              data.genres?.map(
                (genre) =>
                  genre.name
              ) || [],
            rating:
              data.vote_average,
            language:
              data.original_language,
          };

          setMovie(mappedMovie);

          return;
        }

        const response =
          await getMovieById(id);

        setMovie(response.movie);
      } catch (error: any) {
        console.error(
          "Failed to load movie:",
          error
        );

        setError(
          error?.response?.data?.message ||
            error?.message ||
            "Unable to load movie details."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadMovie();
  }, [id]);

  if (loading) {
    return (
      <section className="flex min-h-[calc(100vh-140px)] items-center justify-center bg-slate-950 px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-red-500" />

          <p className="text-slate-400">
            Loading movie details...
          </p>
        </div>
      </section>
    );
  }

  if (error || !movie) {
    return (
      <section className="flex min-h-[calc(100vh-140px)] items-center justify-center bg-slate-950 px-4">
        <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
          <Film
            size={56}
            className="mx-auto text-slate-600"
          />

          <h1 className="mt-5 text-2xl font-bold text-white">
            Movie Not Found
          </h1>

          <p className="mt-3 text-slate-400">
            {error ||
              "The requested movie could not be found."}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/movies")
            }
            className="mt-6 rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700"
          >
            Back to Movies
          </button>
        </div>
      </section>
    );
  }

  const posterUrl =
    getImageUrl(
      movie.posterPath,
      "w500"
    );

  const backdropUrl =
    getImageUrl(
      movie.backdropPath,
      "original"
    );

  const releaseYear =
    movie.releaseDate
      ? new Date(
          movie.releaseDate
        ).getFullYear()
      : null;

  const movieLink =
    movie.tmdbId &&
    movie._id.startsWith("tmdb-")
      ? `/movies/${movie._id}/shows`
      : `/movies/${movie._id}/shows`;

const isTmdbMovie =
  movie._id.startsWith("tmdb-");

  return (
    <section className="min-h-[calc(100vh-140px)] bg-slate-950 text-white">
      
      <div className="relative overflow-hidden">
        {backdropUrl && (
          <div className="absolute inset-0">
            <img
              src={backdropUrl}
              alt=""
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-slate-950/80" />

            <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/70 to-slate-950/30" />
          </div>
        )}

        {!backdropUrl && (
          <div className="absolute inset-0 bg-linear-to-br from-slate-900 to-slate-950" />
        )}

        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          
          <button
            type="button"
            onClick={() =>
              navigate(-1)
            }
            className="mb-8 inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div className="grid items-center gap-8 md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr]">
            
            <div className="mx-auto w-full max-w-xs overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
              {posterUrl ? (
                <img
                  src={posterUrl}
                  alt={movie.title}
                  className="aspect-2/3 h-full w-full object-cover"
                />
              ) : (
                <div className="flex aspect-2/3 items-center justify-center">
                  <Film
                    size={80}
                    className="text-slate-600"
                  />
                </div>
              )}
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-red-500">
                Movie Details
              </p>

              <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                {movie.title}
              </h1>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                {movie.rating !==
                  undefined && (
                  <span className="inline-flex items-center gap-2 rounded-lg bg-yellow-500/10 px-3 py-2 text-yellow-400">
                    <Star
                      size={18}
                      fill="currentColor"
                    />

                    <span className="font-semibold">
                      {movie.rating.toFixed(
                        1
                      )}
                    </span>
                  </span>
                )}

                {releaseYear && (
                  <span className="inline-flex items-center gap-2 rounded-lg bg-slate-800/80 px-3 py-2 text-slate-300">
                    <CalendarDays size={17} />
                    {releaseYear}
                  </span>
                )}

                {movie.runtime !==
                  undefined &&
                  movie.runtime > 0 && (
                    <span className="inline-flex items-center gap-2 rounded-lg bg-slate-800/80 px-3 py-2 text-slate-300">
                      <Clock size={17} />
                      {movie.runtime} min
                    </span>
                  )}

                {movie.language && (
                  <span className="inline-flex items-center gap-2 rounded-lg bg-slate-800/80 px-3 py-2 text-slate-300">
                    <Languages size={17} />
                    {movie.language.toUpperCase()}
                  </span>
                )}
              </div>

              {movie.genres &&
                movie.genres.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {movie.genres.map(
                      (genre) => (
                        <span
                          key={genre}
                          className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-sm text-slate-300"
                        >
                          {genre}
                        </span>
                      )
                    )}
                  </div>
                )}

              <div className="mt-7 max-w-3xl">
                <h2 className="mb-3 text-xl font-bold">
                  Overview
                </h2>

                <p className="text-base leading-7 text-slate-300">
                  {movie.overview?.trim() ||
                    "No description available for this movie."}
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
  {!isTmdbMovie && (
    <Link
      to={movieLink}
      className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3.5 font-bold text-white transition hover:bg-red-700"
    >
      <Ticket size={20} />
      Book Tickets
    </Link>
  )}

  {isTmdbMovie && (
    <span className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-6 py-3.5 font-semibold text-slate-400">
      Not available in theatres yet
    </span>
  )}

  <button
    type="button"
    disabled
    className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-6 py-3.5 font-bold text-slate-500"
    title="Trailer integration is not available yet"
  >
    <Play size={20} />
    Trailer
  </button>
</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-bold">
              Movie Information
            </h2>

            <div className="mt-5 space-y-4">
              {movie.releaseDate && (
                <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <span className="text-slate-500">
                    Release Date
                  </span>

                  <span className="text-right text-slate-200">
                    {
                      movie.releaseDate
                    }
                  </span>
                </div>
              )}

              {movie.runtime !==
                undefined &&
                movie.runtime > 0 && (
                  <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
                    <span className="text-slate-500">
                      Runtime
                    </span>

                    <span className="text-slate-200">
                      {movie.runtime} minutes
                    </span>
                  </div>
                )}

              {movie.language && (
                <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <span className="text-slate-500">
                    Language
                  </span>

                  <span className="text-slate-200">
                    {movie.language.toUpperCase()}
                  </span>
                </div>
              )}

              {movie.rating !==
                undefined && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">
                    Rating
                  </span>

                  <span className="flex items-center gap-1 text-yellow-400">
                    <Star
                      size={16}
                      fill="currentColor"
                    />

                    {movie.rating.toFixed(
                      1
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          {!isTmdbMovie && (
  <div className="flex flex-col justify-between rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
    <div>
      <h2 className="text-xl font-bold">
        Ready to watch?
      </h2>

      <p className="mt-3 leading-6 text-slate-400">
        Choose your theatre, show
        time and seats to book your
        movie tickets.
      </p>
    </div>

    <Link
      to={movieLink}
      className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3.5 font-bold text-white transition hover:bg-red-700"
    >
      <Ticket size={20} />
      View Shows
    </Link>
  </div>
)}
        </div>
      </div>
    </section>
  );
}

export default MovieDetails;
