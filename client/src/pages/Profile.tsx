import {
  Mail,
  ShieldCheck,
  User,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";

function Profile() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <section className="min-h-[calc(100vh-140px)] bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-3xl">

        <div className="mb-8">
          <h1 className="text-3xl font-bold sm:text-4xl">
            My Profile
          </h1>

          <p className="mt-2 text-slate-400">
            View your account information.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">

          <div className="flex flex-col items-center border-b border-slate-800 p-8 text-center sm:flex-row sm:text-left">

            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-500">
              <User size={42} />
            </div>

            <div className="mt-5 sm:ml-6 sm:mt-0">
              <h2 className="text-2xl font-bold">
                {user.name}
              </h2>

              <p className="mt-1 text-slate-400">
                {user.email}
              </p>

              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase text-red-400">
                <ShieldCheck size={14} />
                {user.role}
              </span>
            </div>

          </div>

          <div className="p-6 sm:p-8">

            <h3 className="mb-5 text-lg font-semibold">
              Account Information
            </h3>

            <div className="space-y-4">

              <div className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
                <User
                  size={20}
                  className="text-slate-500"
                />

                <div>
                  <p className="text-xs text-slate-500">
                    Full Name
                  </p>

                  <p className="mt-1 font-medium">
                    {user.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
                <Mail
                  size={20}
                  className="text-slate-500"
                />

                <div>
                  <p className="text-xs text-slate-500">
                    Email Address
                  </p>

                  <p className="mt-1 font-medium">
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
                <ShieldCheck
                  size={20}
                  className="text-slate-500"
                />

                <div>
                  <p className="text-xs text-slate-500">
                    Account Role
                  </p>

                  <p className="mt-1 font-medium capitalize">
                    {user.role}
                  </p>
                </div>
              </div>

            </div>

            <div className="mt-8 border-t border-slate-800 pt-6">
              <Link
                to="/bookings"
                className="inline-flex rounded-lg bg-red-600 px-6 py-3 font-semibold transition hover:bg-red-700"
              >
                View My Bookings
              </Link>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

export default Profile;
