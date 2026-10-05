import "dotenv/config";

const TMDB_BASE_URL =
  "https://api.themoviedb.org/3";

const TMDB_API_TOKEN =
  process.env.TMDB_API_TOKEN ||
  process.env.TMDB_ACCESS_TOKEN;

const REQUEST_TIMEOUT = 12000;
const MAX_RETRIES = 2;

const RECENT_MOVIES_CACHE_TTL =
  5 * 60 * 1000;

let recentMoviesCache:
  | {
      data: TMDBMovieListResponse;
      expiresAt: number;
    }
  | null = null;

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  original_language: string;
  genre_ids?: number[];
  genres?: string[];
}

export interface TMDBMovieDetails {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  original_language: string;
  runtime: number | null;
  genres: {
    id: number;
    name: string;
  }[];
}

export interface TMDBMovieListResponse {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

interface TMDBRequestOptions {
  retries?: number;
  timeout?: number;
}

async function tmdbRequest<T>(
  endpoint: string,
  options: TMDBRequestOptions = {}
): Promise<T> {
  if (!TMDB_API_TOKEN) {
    throw new Error(
      "TMDB API token is missing. Check TMDB_API_TOKEN in .env"
    );
  }

  const retries =
    options.retries ?? MAX_RETRIES;

  const timeout =
    options.timeout ??
    REQUEST_TIMEOUT;

  let lastError: unknown;

  for (
    let attempt = 1;
    attempt <= retries;
    attempt++
  ) {
    const controller =
      new AbortController();

    const timeoutId =
      setTimeout(
        () => controller.abort(),
        timeout
      );

    try {
      const response =
        await fetch(
          `${TMDB_BASE_URL}${endpoint}`,
          {
            method: "GET",
            headers: {
              Authorization:
                `Bearer ${TMDB_API_TOKEN}`,
              Accept:
                "application/json",
            },
            signal:
              controller.signal,
          }
        );

      clearTimeout(
        timeoutId
      );

      if (!response.ok) {
        const responseText =
          await response.text();

        const error =
          new Error(
            `TMDB request failed with status ${response.status}${
              responseText
                ? `: ${responseText}`
                : ""
            }`
          );

        if (
          response.status === 401 ||
          response.status === 403 ||
          response.status === 404
        ) {
          throw error;
        }

        throw error;
      }

      return (await response.json()) as T;
    } catch (error) {
      clearTimeout(
        timeoutId
      );

      lastError = error;

      if (
        attempt < retries
      ) {
        await new Promise(
          (resolve) =>
            setTimeout(
              resolve,
              500 * attempt
            )
        );
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(
        "TMDB request failed"
      );
}

export async function getPopularMovies(): Promise<TMDBMovieListResponse> {
  return tmdbRequest<TMDBMovieListResponse>(
    "/movie/popular" +
      "?region=IN" +
      "&page=1"
  );
}

export async function searchMovies(
  query: string,
  page = 1
): Promise<TMDBMovieListResponse> {
  const encodedQuery =
    encodeURIComponent(
      query
    );

  const safePage =
    Number.isInteger(page) &&
    page > 0
      ? page
      : 1;

  return tmdbRequest<TMDBMovieListResponse>(
    `/search/movie?query=${encodedQuery}` +
      "&include_adult=false" +
      "&language=en-US" +
      `&page=${safePage}` +
      "&region=IN",
    {
      retries: 2,
      timeout: 10000,
    }
  );
}

export async function getMovieDetails(
  tmdbId: number
): Promise<TMDBMovieDetails> {
  return tmdbRequest<TMDBMovieDetails>(
    `/movie/${tmdbId}?language=en-US`,
    {
      retries: 2,
      timeout: 12000,
    }
  );
}

export async function getRecentMovies(): Promise<TMDBMovieListResponse> {
  if (
    recentMoviesCache &&
    Date.now() <
      recentMoviesCache.expiresAt
  ) {
    return recentMoviesCache.data;
  }

  const pages = [
    1,
    2,
    3,
  ];

  const results: TMDBMovie[] =
    [];

  const today =
    new Date();

  const minimumDate =
    new Date(today);

  minimumDate.setDate(
    today.getDate() - 90
  );

  const minimumDateString =
    minimumDate
      .toISOString()
      .split("T")[0];

  for (const page of pages) {
    try {
      const response =
        await tmdbRequest<TMDBMovieListResponse>(
          "/discover/movie" +
            "?with_original_language=ta" +
            "&sort_by=primary_release_date.desc" +
            `&page=${page}`,
          {
            retries: 2,
            timeout: 12000,
          }
        );

      const filteredMovies =
        response.results.filter(
          (movie) => {
            if (
              movie.original_language !==
              "ta"
            ) {
              return false;
            }

            if (
              !movie.release_date
            ) {
              return false;
            }

            return (
              movie.release_date >=
              minimumDateString
            );
          }
        );

      results.push(
        ...filteredMovies
      );
    } catch (error) {
      console.error(
        `TMDB recent movies page ${page} failed. Continuing.`,
        error
      );
    }
  }

  const uniqueMovies =
    Array.from(
      new Map(
        results.map(
          (movie) => [
            movie.id,
            movie,
          ]
        )
      ).values()
    );

  uniqueMovies.sort(
    (a, b) => {
      const dateA =
        a.release_date || "";

      const dateB =
        b.release_date || "";

      return dateB.localeCompare(
        dateA
      );
    }
  );

  const response: TMDBMovieListResponse =
    {
      page: 1,
      results:
        uniqueMovies,
      total_pages:
        1,
      total_results:
        uniqueMovies.length,
    };

  if (
    uniqueMovies.length > 0
  ) {
    recentMoviesCache = {
      data: response,
      expiresAt:
        Date.now() +
        RECENT_MOVIES_CACHE_TTL,
    };
  }

  return response;
}

export function getGenreName(
  genreId: number
): string {
  const genres: Record<
    number,
    string
  > = {
    28: "Action",
    12: "Adventure",
    16: "Animation",
    35: "Comedy",
    80: "Crime",
    99: "Documentary",
    18: "Drama",
    10751: "Family",
    14: "Fantasy",
    36: "History",
    27: "Horror",
    10402: "Music",
    9648: "Mystery",
    10749: "Romance",
    878: "Science Fiction",
    10770: "TV Movie",
    53: "Thriller",
    10752: "War",
    37: "Western",
  };

  return (
    genres[genreId] ||
    "Other"
  );
}

export function mapTMDBMovie(
  movie: TMDBMovie
) {
  return {
    tmdbId: movie.id,
    title: movie.title,
    overview:
      movie.overview,
    posterPath:
      movie.poster_path ||
      "",
    backdropPath:
      movie.backdrop_path ||
      "",
    releaseDate:
      movie.release_date ||
      "",
    rating:
      movie.vote_average,
    language:
      movie.original_language,
    genres:
      movie.genres ||
      (movie.genre_ids || [])
        .map(
          getGenreName
        ),
  };
}