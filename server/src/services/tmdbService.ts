import "dotenv/config";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const TMDB_API_TOKEN =
  process.env.TMDB_API_TOKEN ||
  process.env.TMDB_ACCESS_TOKEN;

const REQUEST_TIMEOUT = 10000;
const MAX_RETRIES = 3;

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
    options.timeout ?? REQUEST_TIMEOUT;

  let lastError: unknown;

  for (
    let attempt = 1;
    attempt <= retries;
    attempt++
  ) {
    const controller =
      new AbortController();

    const timeoutId = setTimeout(
      () => controller.abort(),
      timeout
    );

    try {
      const response = await fetch(
        `${TMDB_BASE_URL}${endpoint}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${TMDB_API_TOKEN}`,
            accept: "application/json",
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText =
          await response.text();

        throw new Error(
          `TMDB request failed: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);

      lastError = error;

      console.error(
        `TMDB request failed (attempt ${attempt}/${retries}):`,
        error
      );

      if (attempt < retries) {
        await new Promise((resolve) =>
          setTimeout(
            resolve,
            attempt * 1000
          )
        );
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(
        "TMDB request failed after multiple attempts"
      );
}

export async function getPopularMovies(): Promise<TMDBMovieListResponse> {
  return tmdbRequest<TMDBMovieListResponse>(
    "/discover/movie" +
      "?region=IN" +
      "&with_release_type=2|3" +
      "&sort_by=popularity.desc" +
      "&page=1"
  );
}

export async function searchMovies(
  query: string,
  page = 1
): Promise<TMDBMovieListResponse> {
  const encodedQuery =
    encodeURIComponent(query);

  const safePage =
    Number.isInteger(page) && page > 0
      ? page
      : 1;

  return tmdbRequest<TMDBMovieListResponse>(
    `/search/movie?query=${encodedQuery}` +
      "&include_adult=false" +
      "&language=en-US" +
      `&page=${safePage}` +
      "&region=IN"
  );
}

export async function getMovieDetails(
  tmdbId: number
): Promise<TMDBMovieDetails> {
  return tmdbRequest<TMDBMovieDetails>(
    `/movie/${tmdbId}?language=en-US`
  );
}

export async function getRecentMovies(): Promise<TMDBMovieListResponse> {
  const today = new Date();

  const startDate = new Date(today);
  startDate.setDate(
    today.getDate() - 30
  );

  const endDate = new Date(today);
  endDate.setDate(
    today.getDate() + 30
  );

  const startDateString =
    startDate.toISOString().split("T")[0];

  const endDateString =
    endDate.toISOString().split("T")[0];

  const pages = [1, 2, 3];

  const responses =
    await Promise.all(
      pages.map((page) =>
        tmdbRequest<TMDBMovieListResponse>(
          "/discover/movie" +
            "?region=IN" +
            "&with_original_language=ta" +
            `&primary_release_date.gte=${startDateString}` +
            `&primary_release_date.lte=${endDateString}` +
            "&sort_by=primary_release_date.desc" +
            `&page=${page}`
        )
      )
    );

  const results =
    responses.flatMap(
      (response) => response.results
    );

  const uniqueMovies = Array.from(
    new Map(
      results.map((movie) => [
        movie.id,
        movie,
      ])
    ).values()
  );

  return {
    page: 1,
    results: uniqueMovies,
    total_pages:
      responses[0]?.total_pages || 1,
    total_results:
      uniqueMovies.length,
  };
}

export function getGenreName(
  genreId: number
): string {
  const genres: Record<number, string> = {
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

  return genres[genreId] || "Other";
}

export function mapTMDBMovie(
  movie: TMDBMovie
) {
  return {
    tmdbId: movie.id,
    title: movie.title,
    overview: movie.overview,
    posterPath:
      movie.poster_path || "",
    backdropPath:
      movie.backdrop_path || "",
    releaseDate:
      movie.release_date || "",
    rating: movie.vote_average,
    language:
      movie.original_language,
    genres:
      movie.genres ||
      (movie.genre_ids || []).map(
        getGenreName
      ),
  };
}