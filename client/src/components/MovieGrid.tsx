import type { Movie } from "../types/movie";
import MovieCard from "./MovieCard";

interface MovieGridProps {
  movies: Movie[];
}

function MovieGrid({ movies }: MovieGridProps) {
  if (!movies.length) {
    return (
      <div className="py-16 text-center text-slate-400">
        No movies found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {movies.map((movie) => (
        <MovieCard
          key={movie._id}
          movie={movie}
        />
      ))}
    </div>
  );
}

export default MovieGrid;
