import {
  CheckCircle,
  Ticket,
} from "lucide-react";

import {
  Link,
  useParams,
} from "react-router-dom";

function BookingSuccess() {
  const { id } = useParams();

  return (
    <section className="min-h-[calc(100vh-140px)] bg-slate-950 px-4 py-16 text-white">
      <div className="mx-auto max-w-2xl text-center">

        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-500/10">
          <CheckCircle
            size={64}
            className="text-green-500"
          />
        </div>

        <h1 className="mt-7 text-4xl font-bold sm:text-5xl">
          Booking Confirmed!
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-slate-400">
          Your movie ticket booking has been successfully
          confirmed. Your payment has been verified.
        </p>

        {id && (
          <div className="mx-auto mt-7 max-w-md rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center justify-center gap-2 text-red-400">
              <Ticket size={18} />

              <span className="text-sm font-semibold">
                Booking ID
              </span>
            </div>

            <p className="mt-3 break-all text-sm text-slate-300">
              {id}
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">

          <Link
            to="/bookings"
            className="rounded-lg bg-red-600 px-6 py-3 font-semibold transition hover:bg-red-700"
          >
            My Bookings
          </Link>

          <Link
            to="/movies"
            className="rounded-lg border border-slate-700 px-6 py-3 font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            Browse Movies
          </Link>

        </div>

      </div>
    </section>
  );
}

export default BookingSuccess;
