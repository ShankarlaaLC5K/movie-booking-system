export interface Movie {
  _id: string;
  tmdbId?: number;
  title: string;
  overview?: string;
  posterPath?: string;
  backdropPath?: string;
  releaseDate?: string;
  runtime?: number;
  genres?: string[];
  rating?: number;
  language?: string;
  isActive?: boolean;
}

export interface MovieListResponse {
  success: boolean;
  movies: Movie[];
}

export interface MovieResponse {
  success: boolean;
  movie: Movie;
}
