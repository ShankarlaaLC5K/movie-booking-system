import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useSearchParams,
} from "react-router-dom";

import {
  Search,
  Star,
  Film,
  Filter,
  X,
  ArrowRight,
} from "lucide-react";

import {
  getAvailableMovies,
  getMovies,
  searchMovies,
  type TMDBMovie,
} from "../services/movieService";

import type { Movie } from "../types/movie";

const TMDB_IMAGE_BASE_URL =
  "https://image.tmdb.org/t/p/w500";

function getPosterUrl(
  posterPath?: string | null
) {
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
    posterPath.startsWith("/") ? "" : "/"
  }${posterPath}`;
}

function Movies() {
  const [searchParams, setSearchParams] =
    useSearchParams();

  const [movies, setMovies] =
    useState<Movie[]>([]);

  const [allMovies, setAllMovies] =
    useState<Movie[]>([]);

  const [searchResults, setSearchResults] =
    useState<TMDBMovie[]>([]);

  const [search, setSearch] =
    useState("");

  const [genre, setGenre] =
    useState("");

  const [releaseYear, setReleaseYear] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [searching, setSearching] =
    useState(false);

  const [error, setError] =
    useState("");

  const [searchError, setSearchError] =
    useState("");

  const performSearch = useCallback(
    async (query: string) => {
      const normalizedQuery =
        query.trim();

      if (!normalizedQuery) {
        setSearchResults([]);
        setSearchError("");
        setSearching(false);
        return;
      }

      try {
        setSearching(true);
        setSearchError("");

        const response =
          await searchMovies(
            normalizedQuery
          );

        const lowerQuery =
          normalizedQuery.toLowerCase();

        const results =
          response.results
            .filter((movie) => {
              const title =
                movie.title
                  ?.trim()
                  .toLowerCase() || "";

              return title.includes(
                lowerQuery
              );
            })
            .slice(0, 12);

        setSearchResults(results);
      } catch (error: any) {
        console.error(
          "Failed to search movies:",
          error
        );

        setSearchResults([]);

        setSearchError(
          error?.response?.data?.message ||
            "Unable to search movies."
        );
      } finally {
        setSearching(false);
      }
    },
    []
  );

  useEffect(() => {
    let cancelled = false;

    const loadMovies = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          availableResponse,
          allMoviesResponse,
        ] = await Promise.all([
          getAvailableMovies(),
          getMovies(),
        ]);

        if (cancelled) {
          return;
        }

        const removeAvatar = (
          movie: Movie
        ) =>
          movie.title
            .trim()
            .toLowerCase() !== "avatar";

        setMovies(
          availableResponse.movies.filter(
            removeAvatar
          )
        );

        setAllMovies(
          allMoviesResponse.movies.filter(
            removeAvatar
          )
        );
      } catch (error: any) {
        if (cancelled) {
          return;
        }

        console.error(
          "Failed to load movies:",
          error
        );

        setError(
          error?.response?.data?.message ||
            "Unable to load movies. Please try again."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadMovies();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const query =
      searchParams
        .get("search")
        ?.trim() || "";

    if (!query) {
      setSearch("");
      setSearchResults([]);
      setSearchError("");
      setSearching(false);
      return;
    }

    setSearch(query);

    void performSearch(query);
  }, [
    searchParams,
    performSearch,
  ]);

  const handleSearch = () => {
    const query =
      search.trim();

    if (!query) {
      setSearchResults([]);
      setSearchError("");
      setSearchParams({});
      return;
    }

    setSearchParams({
      search: query,
    });
  };

  const handleSearchKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

 const releaseYears = useMemo(() => {
  const currentYear =
    new Date().getFullYear();

  const firstCinemaYear = 1895;

  return Array.from(
    {
      length:
        currentYear -
        firstCinemaYear +
        1,
    },
    (_, index) =>
      currentYear - index
  );
}, []);

  const genres = useMemo(() => {
    const genreSet =
      new Set<string>();

    allMovies.forEach((movie) => {
      movie.genres?.forEach(
        (movieGenre) => {
          const cleaned =
            movieGenre.trim();

          if (cleaned) {
            genreSet.add(cleaned);
          }
        }
      );
    });

    return Array.from(
      genreSet
    ).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [allMovies]);

  const filteredMovies = useMemo(() => {
    return movies.filter((movie) => {
      const matchesGenre =
        !genre ||
        Boolean(
          movie.genres?.some(
            (movieGenre) =>
              movieGenre
                .toLowerCase() ===
              genre.toLowerCase()
          )
        );

      const matchesYear =
        !releaseYear ||
        (movie.releaseDate
          ? String(
              new Date(
                movie.releaseDate
              ).getFullYear()
            ) === releaseYear
          : false);

      return (
        matchesGenre &&
        matchesYear
      );
    });
  }, [
    movies,
    genre,
    releaseYear,
  ]);

  const clearSearch = () => {
    setSearch("");
    setSearchResults([]);
    setSearchError("");
    setSearchParams({});
  };

  const clearFilters = () => {
    setGenre("");
    setReleaseYear("");
  };

  const isSearchMode =
    search.trim().length > 0;

  const hasActiveFilters =
    Boolean(
      genre ||
        releaseYear
    );

  return (
    <section className="min-h-[calc(100vh-140px)] bg-slate-50 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-red-500">
            Discover
          </p>

          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            Movies
          </h1>

          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Explore movies available for booking.
          </p>
        </div>

        <div className="mb-10 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 items-center rounded-xl border border-slate-300 bg-slate-50 px-4 dark:border-slate-700 dark:bg-slate-950">
              <Search
                size={20}
                className="mr-3 shrink-0 text-slate-500"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                onKeyDown={
                  handleSearchKeyDown
                }
                placeholder="Search movies..."
                className="w-full bg-transparent py-4 text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
              />

              {search && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="text-slate-500 transition hover:text-slate-900 dark:hover:text-white"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleSearch}
              disabled={searching}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Search size={18} />

              {searching
                ? "Searching..."
                : "Search"}
            </button>
          </div>

          {!isSearchMode && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="relative">
                <Filter
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <select
                  value={genre}
                  onChange={(event) =>
                    setGenre(
                      event.target.value
                    )
                  }
                  className="w-full appearance-none rounded-lg border border-slate-300 bg-slate-50 py-3 pl-10 pr-4 text-slate-900 outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  <option value="">
                    All Genres
                  </option>

                  {genres.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    )
                  )}
                </select>
              </div>

              <select
                value={releaseYear}
                onChange={(event) =>
                  setReleaseYear(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                <option value="">
                  All Release Years
                </option>

                {releaseYears.map(
                  (year) => (
                    <option
                      key={year}
                      value={String(year)}
                    >
                      {year}
                    </option>
                  )
                )}
              </select>
            </div>
          )}

          {!isSearchMode &&
            hasActiveFilters && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-sm text-slate-500">
                  Active:
                </span>

                {genre && (
                  <span className="rounded-full bg-red-500/10 px-3 py-1 text-sm text-red-500 dark:text-red-400">
                    Genre: {genre}
                  </span>
                )}

                {releaseYear && (
                  <span className="rounded-full bg-red-500/10 px-3 py-1 text-sm text-red-500 dark:text-red-400">
                    Year: {releaseYear}
                  </span>
                )}

                <button
                  type="button"
                  onClick={clearFilters}
                  className="ml-auto inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-red-500"
                >
                  <X size={15} />
                  Clear
                </button>
              </div>
            )}
        </div>

        {searchError && (
          <div className="mb-8 rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
            <p className="text-red-500 dark:text-red-400">
              {searchError}
            </p>
          </div>
        )}

        {isSearchMode &&
          !searching && (
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Search Results
              </h2>

              <span className="text-sm text-slate-500">
                {searchResults.length} result
                {searchResults.length !==
                1
                  ? "s"
                  : ""}
              </span>
            </div>
          )}

        {isSearchMode &&
          searching && (
            <div className="flex min-h-64 items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-red-500 dark:border-slate-700" />

                <p className="text-slate-600 dark:text-slate-400">
                  Searching movies...
                </p>
              </div>
            </div>
          )}

        {isSearchMode &&
          !searching &&
          !searchError &&
          searchResults.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
              <Film
                size={40}
                className="mx-auto text-slate-400 dark:text-slate-600"
              />

              <h2 className="mt-4 text-xl font-semibold">
                No movies found
              </h2>

              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Try another movie title.
              </p>
            </div>
          )}

        {isSearchMode &&
          !searching &&
          !searchError &&
          searchResults.length > 0 && (
            <div className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {searchResults.map(
                (movie) => (
                  <article
                    key={movie.id}
                    className="flex h-full min-h-162.5 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                  >
                    <Link
                      to={`/movies/tmdb-${movie.id}`}
                      state={{
                        from: "/movies",
                      }}
                      className="block shrink-0"
                    >
                      <div className="aspect-2/3 overflow-hidden bg-slate-200 dark:bg-slate-800">
                        {movie.poster_path ? (
                          <img
                            src={getPosterUrl(
                              movie.poster_path
                            )}
                            alt={movie.title}
                            loading="lazy"
                            className="h-full w-full object-cover transition duration-500 hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Film
                              size={64}
                              className="text-slate-400 dark:text-slate-600"
                            />
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex min-h-13 items-start justify-between gap-3">
                        <h3 className="line-clamp-2 text-lg font-bold leading-6">
                          {movie.title}
                        </h3>

                        <span className="flex shrink-0 items-center gap-1 rounded-md bg-yellow-500/10 px-2 py-1 text-sm text-yellow-600 dark:text-yellow-400">
                          <Star
                            size={14}
                            fill="currentColor"
                          />

                          {movie.vote_average
                            ? movie.vote_average.toFixed(
                                1
                              )
                            : "N/A"}
                        </span>
                      </div>

                      <div className="mt-2 min-h-11">
                        {movie.release_date && (
                          <p className="text-sm text-slate-500">
                            {new Date(
                              movie.release_date
                            ).getFullYear()}
                          </p>
                        )}

                        <p className="mt-1 text-sm uppercase text-slate-500">
                          {movie.original_language ||
                            "Unknown"}
                        </p>
                      </div>

                      <p className="mt-3 h-18 overflow-hidden text-sm leading-6 text-slate-600 dark:text-slate-400">
                        {movie.overview ||
                          "No description available."}
                      </p>

                      <Link
                        to={`/movies/tmdb-${movie.id}`}
                        state={{
                          from: "/movies",
                        }}
                        className="mt-auto flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-red-700"
                      >
                        More Info
                        <ArrowRight
                          size={16}
                        />
                      </Link>
                    </div>
                  </article>
                )
              )}
            </div>
          )}

        {!isSearchMode &&
          loading && (
            <div className="flex min-h-64 items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-red-500 dark:border-slate-700" />

                <p className="text-slate-600 dark:text-slate-400">
                  Loading movies...
                </p>
              </div>
            </div>
          )}

        {!isSearchMode &&
          !loading &&
          error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-8 text-center">
              <p className="font-medium text-red-500 dark:text-red-400">
                {error}
              </p>

              <button
                type="button"
                onClick={() =>
                  window.location.reload()
                }
                className="mt-5 rounded-lg bg-red-600 px-5 py-2.5 font-semibold text-white transition hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          )}

        {!isSearchMode &&
          !loading &&
          !error &&
          filteredMovies.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
              <Film
                size={40}
                className="mx-auto text-slate-400 dark:text-slate-600"
              />

              <h2 className="mt-4 text-xl font-semibold">
                No movies found
              </h2>

              <p className="mt-2 text-slate-600 dark:text-slate-400">
                There are no movies available yet.
              </p>
            </div>
          )}

        {!isSearchMode &&
          !loading &&
          !error &&
          filteredMovies.length > 0 && (
            <>
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  Available Movies
                </h2>

                <span className="text-sm text-slate-500">
                  {filteredMovies.length} movie
                  {filteredMovies.length !==
                  1
                    ? "s"
                    : ""}
                </span>
              </div>

              <div className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredMovies.map(
                  (movie) => {
                    const posterUrl =
                      getPosterUrl(
                        movie.posterPath
                      );

                    return (
                      <article
                        key={movie._id}
                        className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                      >
                        <Link
                          to={`/movies/${movie._id}`}
                          className="block shrink-0"
                        >
                          <div className="aspect-2/3 overflow-hidden bg-slate-200 dark:bg-slate-800">
                            {posterUrl ? (
                              <img
                                src={posterUrl}
                                alt={movie.title}
                                loading="lazy"
                                className="h-full w-full object-cover transition duration-500 hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <Film
                                  size={64}
                                  className="text-slate-400 dark:text-slate-600"
                                />
                              </div>
                            )}
                          </div>
                        </Link>

                        <div className="flex flex-1 flex-col p-5">
                          <div className="flex min-h-13 items-start justify-between gap-3">
                            <h3 className="line-clamp-2 text-lg font-bold leading-6">
                              {movie.title}
                            </h3>

                            {movie.rating !==
                              undefined && (
                              <span className="flex shrink-0 items-center gap-1 rounded-md bg-yellow-500/10 px-2 py-1 text-sm text-yellow-600 dark:text-yellow-400">
                                <Star
                                  size={14}
                                  fill="currentColor"
                                />

                                {movie.rating.toFixed(
                                  1
                                )}
                              </span>
                            )}
                          </div>

                          <div className="mt-2 min-h-11">
                            {movie.releaseDate && (
                              <p className="text-sm text-slate-500">
                                {new Date(
                                  movie.releaseDate
                                ).getFullYear()}
                              </p>
                            )}

                            {movie.genres &&
                              movie.genres
                                .length >
                                0 && (
                                <p className="mt-1 line-clamp-1 text-sm text-slate-600 dark:text-slate-400">
                                  {movie.genres.join(
                                    " • "
                                  )}
                                </p>
                              )}
                          </div>

                          <Link
                            to={`/movies/${movie._id}`}
                            className="mt-auto block min-h-11 rounded-lg bg-red-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-red-700"
                          >
                            View Movie
                          </Link>
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            </>
          )}
      </div>
    </section>
  );
}

export default Movies;