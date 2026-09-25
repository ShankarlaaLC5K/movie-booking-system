import { Clock, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Show } from "../types/show";

interface ShowCardProps {
  show: Show;
}

function ShowCard({ show }: ShowCardProps) {
  const navigate = useNavigate();

  const theatreName =
    typeof show.theatre === "object"
      ? show.theatre.name
      : "Theatre";

  const screenName =
    typeof show.screen === "object"
      ? show.screen.name
      : "Screen";

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <h3 className="text-lg font-semibold">
        {theatreName}
      </h3>

      <div className="mt-2 text-sm text-slate-400">
        {screenName}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-300">
        <span className="flex items-center gap-2">
          <Clock size={16} />
          {new Date(show.startTime).toLocaleString()}
        </span>

        <span className="flex items-center gap-2">
          <MapPin size={16} />
          {theatreName}
        </span>
      </div>

      {show.price !== undefined && (
        <div className="mt-4 text-lg font-semibold">
          ₹{show.price}
        </div>
      )}

      <button
        onClick={() =>
          navigate(`/shows/${show._id}/seats`)
        }
        className="mt-5 w-full rounded-lg bg-red-600 px-4 py-3 font-semibold hover:bg-red-700"
      >
        Select Seats
      </button>
    </div>
  );
}

export default ShowCard;
