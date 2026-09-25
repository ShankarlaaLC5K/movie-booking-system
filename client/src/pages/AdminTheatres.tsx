import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  Building2,
  Edit,
  Loader2,
  MapPin,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import api from "../services/api";

interface Theatre {
  _id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface TheatreForm {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

const emptyForm: TheatreForm = {
  name: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
};

function AdminTheatres() {
  const [theatres, setTheatres] = useState<Theatre[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [form, setForm] =
    useState<TheatreForm>(emptyForm);

  const loadTheatres = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get("/theatres");

      setTheatres(
        response.data.theatres || []
      );
    } catch (error: any) {
      console.error(
        "Failed to load theatres:",
        error
      );

      setError(
        error?.response?.data?.message ||
          "Failed to load theatres."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTheatres();
  }, []);

  const handleInputChange = (
    field: keyof TheatreForm,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const openCreateForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const openEditForm = (
    theatre: Theatre
  ) => {
    setEditingId(theatre._id);

    setForm({
      name: theatre.name || "",
      address: theatre.address || "",
      city: theatre.city || "",
      state: theatre.state || "",
      pincode: theatre.pincode || "",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const name =
      form.name.trim();

    const address =
      form.address.trim();

    const city =
      form.city.trim();

    const state =
      form.state.trim();

    const pincode =
      form.pincode.trim();

    if (!name) {
      setError(
        "Theatre name is required."
      );
      return;
    }

    if (!address) {
      setError(
        "Address is required."
      );
      return;
    }

    if (!city) {
      setError(
        "City is required."
      );
      return;
    }

    if (!state) {
      setError(
        "State is required."
      );
      return;
    }

    if (
      pincode &&
      !/^\d{6}$/.test(pincode)
    ) {
      setError(
        "Pincode must contain exactly 6 digits."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name,
        address,
        city,
        state,
        pincode,
      };

      if (editingId) {
        const response =
          await api.put(
            `/theatres/${editingId}`,
            payload
          );

        const updatedTheatre =
          response.data.theatre;

        setTheatres(
          (previous) =>
            previous.map(
              (theatre) =>
                theatre._id ===
                editingId
                  ? updatedTheatre
                  : theatre
            )
        );

        setSuccess(
          "Theatre updated successfully."
        );
      } else {
        const response =
          await api.post(
            "/theatres",
            payload
          );

        const newTheatre =
          response.data.theatre;

        setTheatres(
          (previous) => [
            newTheatre,
            ...previous,
          ]
        );

        setSuccess(
          "Theatre created successfully."
        );
      }

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
    } catch (error: any) {
      console.error(
        "Failed to save theatre:",
        error
      );

      setError(
        error?.response?.data?.message ||
          "Failed to save theatre."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (
    theatre: Theatre
  ) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${theatre.name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(
        theatre._id
      );

      setError("");
      setSuccess("");

      await api.delete(
        `/theatres/${theatre._id}`
      );

      setTheatres(
        (previous) =>
          previous.filter(
            (item) =>
              item._id !==
              theatre._id
          )
      );

      setSuccess(
        "Theatre deleted successfully."
      );
    } catch (error: any) {
      console.error(
        "Failed to delete theatre:",
        error
      );

      setError(
        error?.response?.data?.message ||
          "Failed to delete theatre."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="min-h-[calc(100vh-140px)] bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-7xl">

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">
              Manage Theatres
            </h1>

            <p className="mt-2 text-slate-400">
              Add, edit and delete theatres in the booking system.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold transition hover:bg-red-700"
          >
            <Plus size={18} />

            Add Theatre
          </button>

        </div>

        {success && (
          <div className="mb-6 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-400">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {showForm && (
          <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="mb-6 flex items-center justify-between gap-4">

              <div>
                <h2 className="text-xl font-bold">
                  {editingId
                    ? "Edit Theatre"
                    : "Add New Theatre"}
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Enter the theatre details below.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close form"
              >
                <X size={20} />
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="grid gap-5 sm:grid-cols-2"
            >

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Theatre Name
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    handleInputChange(
                      "name",
                      event.target.value
                    )
                  }
                  placeholder="e.g. PVR Cinemas"
                  disabled={saving}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Address
                </label>

                <textarea
                  value={form.address}
                  onChange={(event) =>
                    handleInputChange(
                      "address",
                      event.target.value
                    )
                  }
                  placeholder="Enter complete theatre address"
                  rows={3}
                  disabled={saving}
                  className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  City
                </label>

                <input
                  type="text"
                  value={form.city}
                  onChange={(event) =>
                    handleInputChange(
                      "city",
                      event.target.value
                    )
                  }
                  placeholder="e.g. Coimbatore"
                  disabled={saving}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  State
                </label>

                <input
                  type="text"
                  value={form.state}
                  onChange={(event) =>
                    handleInputChange(
                      "state",
                      event.target.value
                    )
                  }
                  placeholder="e.g. Tamil Nadu"
                  disabled={saving}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Pincode
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={form.pincode}
                  onChange={(event) =>
                    handleInputChange(
                      "pincode",
                      event.target.value.replace(
                        /\D/g,
                        ""
                      )
                    )
                  }
                  placeholder="e.g. 641001"
                  disabled={saving}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-lg border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />

                      {editingId
                        ? "Updating..."
                        : "Creating..."}
                    </>
                  ) : (
                    <>
                      <Plus size={17} />

                      {editingId
                        ? "Update Theatre"
                        : "Create Theatre"}
                    </>
                  )}
                </button>

              </div>

            </form>
          </div>
        )}

        {loading && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center">

            <Loader2
              size={36}
              className="mx-auto mb-4 animate-spin text-red-500"
            />

            <p className="text-slate-400">
              Loading theatres...
            </p>

          </div>
        )}

        {!loading &&
          theatres.length === 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">

              <Building2
                size={48}
                className="mx-auto text-slate-600"
              />

              <h2 className="mt-5 text-xl font-semibold">
                No theatres found
              </h2>

              <p className="mt-2 text-slate-400">
                Add your first theatre to start managing cinema schedules.
              </p>

              <button
                type="button"
                onClick={openCreateForm}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold transition hover:bg-red-700"
              >
                <Plus size={18} />

                Add Theatre
              </button>

            </div>
          )}

        {!loading &&
          theatres.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

              {theatres.map(
                (theatre) => (
                  <div
                    key={theatre._id}
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-slate-700"
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div className="min-w-0">

                        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                          <Building2
                            size={22}
                          />
                        </div>

                        <h2 className="wrap-break-word text-xl font-semibold">
                          {theatre.name}
                        </h2>

                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                          theatre.isActive === false
                            ? "bg-red-500/10 text-red-400"
                            : "bg-green-500/10 text-green-400"
                        }`}
                      >
                        {theatre.isActive === false
                          ? "Inactive"
                          : "Active"}
                      </span>

                    </div>

                    <div className="mt-5 space-y-2">

                      <div className="flex items-start gap-2 text-sm text-slate-400">

                        <MapPin
                          size={17}
                          className="mt-0.5 shrink-0 text-slate-500"
                        />

                        <div>
                          <p>
                            {theatre.address ||
                              "Address not available"}
                          </p>

                          {(theatre.city ||
                            theatre.state ||
                            theatre.pincode) && (
                            <p className="mt-1">
                              {[
                                theatre.city,
                                theatre.state,
                                theatre.pincode,
                              ]
                                .filter(
                                  Boolean
                                )
                                .join(
                                  ", "
                                )}
                            </p>
                          )}
                        </div>

                      </div>

                    </div>

                    <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-800 pt-5">

                      <button
                        type="button"
                        onClick={() =>
                          openEditForm(
                            theatre
                          )
                        }
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                      >
                        <Edit
                          size={16}
                        />

                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(
                            theatre
                          )
                        }
                        disabled={
                          deletingId ===
                          theatre._id
                        }
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingId ===
                        theatre._id ? (
                          <>
                            <Loader2
                              size={16}
                              className="animate-spin"
                            />

                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2
                              size={16}
                            />

                            Delete
                          </>
                        )}
                      </button>

                    </div>

                  </div>
                )
              )}

            </div>
          )}

      </div>
    </section>
  );
}

export default AdminTheatres;
