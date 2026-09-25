import {
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  getMovies,
  searchMovies,
  type TMDBMovie,
} from "../services/movieService";

import type { Movie } from "../types/movie";

const TMDB_IMAGE_BASE_URL =
  "https://image.tmdb.org/t/p/w500";

function getPosterUrl(
  posterPath?: string | null
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

function Movies() {
  const [searchParams, setSearchParams] =
    useSearchParams();

  const urlSearch =
    searchParams.get("search") || "";

  const urlPage = Math.max(
    1,
    Number(searchParams.get("page") || 1)
  );

  const [movies, setMovies] =
    useState<Movie[]>([]);

  const [searchResults, setSearchResults] =
    useState<TMDBMovie[]>([]);

  const [search, setSearch] =
    useState(urlSearch);

  const [searchPage, setSearchPage] =
    useState(urlPage);

  const [searchTotalPages, setSearchTotalPages] =
    useState(1);

  const [searching, setSearching] =
    useState(false);

  const [searchError, setSearchError] =
    useState("");

  const [genre, setGenre] =
    useState("");

  const [releaseYear, setReleaseYear] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    const loadMovies = async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await getMovies();

        if (cancelled) {
          return;
        }

        const availableMovies =
          response.movies.filter(
            (movie) =>
              movie.title
                .trim()
                .toLowerCase() !==
              "avatar"
          );

        setMovies(
          availableMovies
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
      searchParams.get("search")?.trim() ||
      "";

    const page = Math.max(
      1,
      Number(
        searchParams.get("page") || 1
      )
    );

    setSearch(query);
    setSearchPage(page);

    if (!query) {
      setSearchResults([]);
      setSearchError("");
      setSearchTotalPages(1);
      setSearching(false);

      return;
    }

    let cancelled = false;

    const restoreSearch = async () => {
      try {
        setSearching(true);
        setSearchError("");

        const response =
          await searchMovies(
            query,
            page
          );

        if (cancelled) {
          return;
        }

        setSearchResults(
          response.results
        );

        setSearchPage(
          response.page
        );

        setSearchTotalPages(
          Math.min(
            response.total_pages,
            500
          )
        );
      } catch (error: any) {
        if (cancelled) {
          return;
        }

        console.error(
          "Failed to restore search:",
          error
        );

        setSearchResults([]);

        setSearchError(
          error?.response?.data?.message ||
            "Unable to load search results."
        );

        setSearchTotalPages(1);
      } finally {
        if (!cancelled) {
          setSearching(false);
        }
      }
    };

    void restoreSearch();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const handleSearch = (
    page = 1
  ) => {
    const query =
      search.trim();

    if (!query) {
      setSearchResults([]);
      setSearchError("");
      setSearchPage(1);
      setSearchTotalPages(1);

      setSearchParams({});

      return;
    }

    setSearchParams({
      search: query,
      page: String(page),
    });
  };

  const handleSearchKeyDown = (
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      handleSearch(1);
    }
  };

  const handleNextPage = () => {
    if (
      searching ||
      searchPage >= searchTotalPages
    ) {
      return;
    }

    handleSearch(
      searchPage + 1
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handlePreviousPage = () => {
    if (
      searching ||
      searchPage <= 1
    ) {
      return;
    }

    handleSearch(
      searchPage - 1
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const releaseYears = useMemo(() => {
    const years = movies
      .map((movie) => {
        if (!movie.releaseDate) {
          return null;
        }

        const year = new Date(
          movie.releaseDate
        ).getFullYear();

        return Number.isNaN(year)
          ? null
          : year;
      })
      .filter(
        (year): year is number =>
          year !== null
      );

    return Array.from(
      new Set(years)
    ).sort(
      (a, b) => b - a
    );
  }, [movies]);

  const genres = useMemo(() => {
    const genreSet =
      new Set<string>();

    movies.forEach((movie) => {
      movie.genres?.forEach(
        (movieGenre) => {
          if (
            movieGenre.trim()
          ) {
            genreSet.add(
              movieGenre.trim()
            );
          }
        }
      );
    });

    return Array.from(
      genreSet
    ).sort();
  }, [movies]);

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

      const matchesReleaseYear =
        !releaseYear ||
        Boolean(
          movie.releaseDate &&
            String(
              new Date(
                movie.releaseDate
              ).getFullYear()
            ) === releaseYear
        );

      return (
        matchesGenre &&
        matchesReleaseYear
      );
    });
  }, [
    movies,
    genre,
    releaseYear,
  ]);

  const hasActiveFilters =
    Boolean(
      genre || releaseYear
    );

  const isSearchMode =
    search.trim().length > 0;

  const clearFilters = () => {
    setGenre("");
    setReleaseYear("");
  };

  const clearSearch = () => {
    setSearch("");
    setSearchResults([]);
    setSearchError("");
    setSearchPage(1);
    setSearchTotalPages(1);

    setSearchParams({});
  };

  return (
    <section className="min-h-[calc(100vh-140px)] bg-slate-50 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-red-500">
            Discover
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
            Movies
          </h1>

          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Explore movies available for booking.
          </p>
        </div>

        {/* Search + Filters */}
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
              onClick={() =>
                handleSearch(1)
              }
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
                      value={String(
                        year
                      )}
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
                  onClick={
                    clearFilters
                  }
                  className="ml-auto inline-flex items-center gap-1 text-sm text-slate-500 hover:text-red-500"
                >
                  <X size={15} />
                  Clear
                </button>

              </div>
            )}

        </div>

        {/* Search Error */}
        {searchError && (
          <div className="mb-8 rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
            <p className="text-red-500 dark:text-red-400">
              {searchError}
            </p>
          </div>
        )}

        {/* Search Header */}
        {isSearchMode &&
          !searching &&
          !searchError && (
            <div className="mb-5 flex items-center justify-between">

              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Search Results
              </h2>

              <span className="text-sm text-slate-500">
                Page {searchPage} of{" "}
                {searchTotalPages}
              </span>

            </div>
          )}

        {/* Search Loading */}
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

        {/* Search Empty */}
        {isSearchMode &&
          !searching &&
          !searchError &&
          searchResults.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">

              <Film
                size={40}
                className="mx-auto text-slate-400 dark:text-slate-600"
              />

              <h2 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">
                No movies found
              </h2>

              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Try another movie title.
              </p>

            </div>
          )}

        {/* Search Results */}
        {isSearchMode &&
          !searching &&
          !searchError &&
          searchResults.length > 0 && (
            <>
              <div className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

                {searchResults.map(
                  (movie) => (
                    <article
                      key={movie.id}
                      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                    >

                      {/* Poster */}
                      <Link
                        to={`/movies/tmdb-${movie.id}`}
                      >
                        <div className="aspect-2/3 overflow-hidden bg-slate-200 dark:bg-slate-800">

                          {movie.poster_path ? (
                            <img
                              src={getPosterUrl(
                                movie.poster_path
                              )}
                              alt={
                                movie.title
                              }
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
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

                      {/* Fixed-height content */}
                      <div className="relative h-70 p-5">

                        {/* Title + Rating */}
                        <div className="flex items-start justify-between gap-3">

                          <Link
                            to={`/movies/tmdb-${movie.id}`}
                            className="line-clamp-2 min-h-14 pr-2 text-lg font-bold text-slate-900 hover:text-red-500 dark:text-white dark:hover:text-red-400"
                          >
                            {movie.title}
                          </Link>

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

                        {/* Year */}
                        {movie.release_date && (
                          <p className="mt-2 text-sm text-slate-500">
                            {new Date(
                              movie.release_date
                            ).getFullYear()}
                          </p>
                        )}

                        {/* Language */}
                        <p className="mt-2 text-sm uppercase text-slate-500">
                          {movie.original_language ||
                            "Unknown"}
                        </p>

                        {/* Genres */}
                        <div className="mt-3 h-8 overflow-hidden">

                          {movie.genres &&
                            movie.genres.length >
                              0 && (
                              <div className="flex flex-wrap gap-2">

                                {movie.genres
                                  .slice(
                                    0,
                                    3
                                  )
                                  .map(
                                    (
                                      movieGenre
                                    ) => (
                                      <span
                                        key={
                                          movieGenre
                                        }
                                        className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                      >
                                        {
                                          movieGenre
                                        }
                                      </span>
                                    )
                                  )}

                              </div>
                            )}

                        </div>

                        {/* Overview */}
                        <p className="mt-3 h-18 overflow-hidden text-sm leading-6 text-slate-600 dark:text-slate-400">
                          {movie.overview ||
                            "No overview available."}
                        </p>

                        {/* Fixed button */}
                        <Link
                          to={`/movies/tmdb-${movie.id}`}
                          className="absolute bottom-5 left-5 right-5 flex h-12 items-center justify-center rounded-lg bg-red-600 px-4 font-semibold text-white transition hover:bg-red-700"
                        >
                          View Details
                        </Link>

                      </div>

                    </article>
                  )
                )}

              </div>

              {/* Search Pagination */}
              {searchTotalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-3">

                  <button
                    type="button"
                    onClick={
                      handlePreviousPage
                    }
                    disabled={
                      searching ||
                      searchPage <= 1
                    }
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 transition hover:border-red-500 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  >
                    <ChevronLeft
                      size={18}
                    />

                    Previous
                  </button>

                  <span className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {searchPage} /{" "}
                    {searchTotalPages}
                  </span>

                  <button
                    type="button"
                    onClick={
                      handleNextPage
                    }
                    disabled={
                      searching ||
                      searchPage >=
                        searchTotalPages
                    }
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 transition hover:border-red-500 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  >
                    Next

                    <ChevronRight
                      size={18}
                    />
                  </button>

                </div>
              )}
            </>
          )}

        {/* Normal Movies */}
        {!isSearchMode && (
          <>
            <div className="mb-5 flex items-center justify-between">

              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Available Movies
              </h2>

              {!loading && (
                <span className="text-sm text-slate-500">
                  {filteredMovies.length}{" "}
                  movies
                </span>
              )}

            </div>

            {/* Loading */}
            {loading && (
              <div className="flex min-h-64 items-center justify-center">
                <div className="text-center">

                  <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-red-500 dark:border-slate-700" />

                  <p className="text-slate-600 dark:text-slate-400">
                    Loading movies...
                  </p>

                </div>
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-8 text-center">

                <Film
                  size={40}
                  className="mx-auto text-red-500"
                />

                <h2 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">
                  Failed to load movies
                </h2>

                <p className="mt-2 text-red-500 dark:text-red-400">
                  {error}
                </p>

              </div>
            )}

            {/* Empty */}
            {!loading &&
              !error &&
              filteredMovies.length ===
                0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">

                  <Film
                    size={40}
                    className="mx-auto text-slate-400 dark:text-slate-600"
                  />

                  <h2 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">
                    No movies available
                  </h2>

                  <p className="mt-2 text-slate-600 dark:text-slate-400">
                    Try changing your filters.
                  </p>

                </div>
              )}

            {/* Normal Movie Grid */}
            {!loading &&
              !error &&
              filteredMovies.length >
                0 && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

                  {filteredMovies.map(
                    (movie) => (
                      <article
                        key={movie._id}
                        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                      >

                        {/* Poster */}
                        <Link
                          to={`/movies/${movie._id}`}
                        >
                          <div className="aspect-2/3 overflow-hidden bg-slate-200 dark:bg-slate-800">

                            {movie.posterPath ? (
                              <img
                                src={getPosterUrl(
                                  movie.posterPath
                                )}
                                alt={
                                  movie.title
                                }
                                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
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

                        {/* Content */}
                        <div className="flex flex-1 flex-col p-5">

                          <div className="flex items-start justify-between gap-3">

                            <Link
                              to={`/movies/${movie._id}`}
                              className="line-clamp-2 min-h-14 pr-2 text-lg font-bold text-slate-900 hover:text-red-500 dark:text-white dark:hover:text-red-400"
                            >
                              {movie.title}
                            </Link>

                            <span className="flex shrink-0 items-center gap-1 rounded-md bg-yellow-500/10 px-2 py-1 text-sm text-yellow-600 dark:text-yellow-400">
                              <Star
                                size={14}
                                fill="currentColor"
                              />

                              {movie.rating
                                ? movie.rating.toFixed(
                                    1
                                  )
                                : "N/A"}
                            </span>

                          </div>

                          {movie.releaseDate && (
                            <p className="mt-2 text-sm text-slate-500">
                              {new Date(
                                movie.releaseDate
                              ).getFullYear()}
                            </p>
                          )}

                          {movie.language && (
                            <p className="mt-2 text-sm uppercase text-slate-500">
                              {movie.language}
                            </p>
                          )}

                          {movie.genres &&
                            movie.genres.length >
                              0 && (
                              <div className="mt-3 flex min-h-8 flex-wrap gap-2">

                                {movie.genres
                                  .slice(
                                    0,
                                    3
                                  )
                                  .map(
                                    (
                                      movieGenre
                                    ) => (
                                      <span
                                        key={
                                          movieGenre
                                        }
                                        className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                      >
                                        {
                                          movieGenre
                                        }
                                      </span>
                                    )
                                  )}

                              </div>
                            )}

                          <p className="mt-3 min-h-18 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                            {movie.overview ||
                              "No overview available."}
                          </p>

                          <Link
                            to={`/movies/${movie._id}`}
                            className="mt-auto flex min-h-12 items-center justify-center rounded-lg bg-red-600 px-4 py-3 font-semibold text-white transition hover:bg-red-700"
                          >
                            View Details
                          </Link>

                        </div>

                      </article>
                    )
                  )}

                </div>
              )}
          </>
        )}

      </div>
    </section>
  );
}

export default Movies;