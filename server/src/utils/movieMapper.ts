import { IMovie } from "../models/Movie";
import { TMDBMovieDetails } from "../services/tmdbService";

export function mapTmdbMovie(
  movie: TMDBMovieDetails
): Partial<IMovie> {
  return {
    tmdbId: movie.id,
    title: movie.title,
    overview: movie.overview || "",
    posterPath: movie.poster_path || "",
    backdropPath:
      movie.backdrop_path || "",
    releaseDate:
      movie.release_date || "",
    runtime: movie.runtime || 0,
    genres:
      movie.genres?.map(
        (genre) => genre.name
      ) || [],
    language:
      movie.original_language || "",
    rating:
      movie.vote_average || 0,
  };
}
