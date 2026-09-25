import { Link } from "react-router-dom";

function NotFound() {
  return (
    <section className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-7xl font-black text-red-500">
          404
        </h1>

        <h2 className="mt-4 text-2xl font-bold">
          Page Not Found
        </h2>

        <p className="mt-2 text-slate-400">
          The page you're looking for doesn't exist.
        </p>

        <Link
          to="/"
          className="mt-6 inline-block rounded-lg bg-red-600 px-5 py-3 font-semibold"
        >
          Go Home
        </Link>
      </div>
    </section>
  );
}

export default NotFound;
