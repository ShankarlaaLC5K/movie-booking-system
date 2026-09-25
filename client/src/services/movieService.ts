import api from "./api";

import type {
  MovieListResponse,
  MovieResponse,
} from "../types/movie";

export async function getMovies(): Promise<MovieListResponse> {
  const response =
    await api.get<MovieListResponse>(
      "/movies"
    );

  return response.data;
}

export async function getMovieById(
  id: string
): Promise<MovieResponse> {
  const response =
    await api.get<MovieResponse>(
      `/movies/${id}`
    );

  return response.data;
}

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

export async function searchMovies(
  query: string,
  page = 1
): Promise<TMDBMovieListResponse> {
  const response =
    await api.get<{
      success: boolean;
      data: TMDBMovieListResponse;
    }>(
      `/movies/search?query=${encodeURIComponent(
        query
      )}&page=${page}`
    );

  return response.data.data;
}

export async function getRecentTamilMovies(): Promise<TMDBMovieListResponse> {
  const response =
    await api.get<{
      success: boolean;
      data: TMDBMovieListResponse;
    }>("/movies/recent");

  return response.data.data;
}

export async function saveMovie(
  tmdbId: number
): Promise<MovieResponse> {
  const response =
    await api.post<MovieResponse>(
      `/movies/save/${tmdbId}`
    );

  return response.data;
}

export async function getTMDBMovieDetails(
  tmdbId: number
): Promise<TMDBMovieDetails> {
  const response =
    await api.get<{
      success: boolean;
      data: TMDBMovieDetails;
    }>(
      `/movies/tmdb/${tmdbId}`
    );

  return response.data.data;
}

export async function deleteMovie(
  id: string
): Promise<{
  success: boolean;
  message: string;
}> {
  const response =
    await api.delete<{
      success: boolean;
      message: string;
    }>(`/movies/${id}`);

  return response.data;
}