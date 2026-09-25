import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import type { Movie } from "../types/movie";

interface MovieCardProps {
  movie: Movie;
}

function MovieCard({ movie }: MovieCardProps) {
  const poster = movie.posterPath
    ? movie.posterPath.startsWith("http")
      ? movie.posterPath
      : `https://image.tmdb.org/t/p/w500${movie.posterPath}`
    : "https://placehold.co/500x750?text=No+Poster";

  return (
    <Link
      to={`/movies/${movie._id}`}
      className="group overflow-hidden rounded-xl border border-slate-800 bg-slate-900 transition hover:-translate-y-1 hover:border-slate-700"
    >
      <div className="aspect-2/3 overflow-hidden">
        <img
          src={poster}
          alt={movie.title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      </div>

      <div className="p-4">
        <h3 className="truncate text-lg font-semibold">
          {movie.title}
        </h3>

        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-slate-400">
            {movie.releaseDate || "N/A"}
          </span>

          <span className="flex items-center gap-1 text-yellow-400">
            <Star size={15} fill="currentColor" />
            {movie.rating?.toFixed(1) ?? "N/A"}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default MovieCard;
