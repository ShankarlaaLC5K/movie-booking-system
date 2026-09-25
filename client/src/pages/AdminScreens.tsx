import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import {
  LayoutGrid,
  Plus,
  Trash2,
  Loader2,
  X,
  Edit,
} from "lucide-react";

import api from "../services/api";

interface Theatre {
  _id: string;
  name: string;
  city?: string;
  state?: string;
}

interface Screen {
  _id: string;
  theatre: string;
  name: string;
  totalSeats: number;
  createdAt?: string;
  updatedAt?: string;
}

interface Seat {
  _id: string;
  screen: string;
  row: string;
  number: number;
  type:
    | "regular"
    | "premium"
    | "recliner";
  price: number;
}

interface ScreenForm {
  name: string;
  totalSeats: string;
}

interface SeatForm {
  rowCount: string;
  seatsPerRow: string;
}

const emptyScreenForm: ScreenForm = {
  name: "",
  totalSeats: "",
};

const emptySeatForm: SeatForm = {
  rowCount: "",
  seatsPerRow: "",
};

function AdminScreens() {
  const [theatres, setTheatres] =
    useState<Theatre[]>([]);

  const [selectedTheatreId, setSelectedTheatreId] =
    useState("");

  const [screens, setScreens] =
    useState<Screen[]>([]);

  const [seats, setSeats] =
    useState<Record<string, Seat[]>>({});

  const [loadingTheatres, setLoadingTheatres] =
    useState(true);

  const [loadingScreens, setLoadingScreens] =
    useState(false);

  const [loadingSeats, setLoadingSeats] =
    useState<string | null>(null);

  const [savingScreen, setSavingScreen] =
    useState(false);

  const [generatingSeats, setGeneratingSeats] =
    useState(false);

  const [deletingScreenId, setDeletingScreenId] =
    useState<string | null>(null);

  const [deletingSeatsScreenId, setDeletingSeatsScreenId] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [showScreenForm, setShowScreenForm] =
    useState(false);

  const [editingScreenId, setEditingScreenId] =
    useState<string | null>(null);

  const [screenForm, setScreenForm] =
    useState<ScreenForm>(
      emptyScreenForm
    );

  const [showSeatForm, setShowSeatForm] =
    useState<string | null>(null);

  const [seatForm, setSeatForm] =
    useState<SeatForm>(
      emptySeatForm
    );

  const loadTheatres = async () => {
    try {
      setLoadingTheatres(true);
      setError("");

      const response =
        await api.get("/theatres");

      const theatreList =
        response.data.theatres || [];

      setTheatres(theatreList);

      if (
        theatreList.length > 0 &&
        !selectedTheatreId
      ) {
        setSelectedTheatreId(
          theatreList[0]._id
        );
      }
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
      setLoadingTheatres(false);
    }
  };

  useEffect(() => {
    loadTheatres();
  }, []);

  const loadScreens = async (
    theatreId: string
  ) => {
    if (!theatreId) {
      setScreens([]);
      return;
    }

    try {
      setLoadingScreens(true);
      setError("");

      const response =
        await api.get(
          `/screens/theatre/${theatreId}`
        );

      setScreens(
        response.data.screens || []
      );
    } catch (error: any) {
      console.error(
        "Failed to load screens:",
        error
      );

      setScreens([]);

      setError(
        error?.response?.data?.message ||
          "Failed to load screens."
      );
    } finally {
      setLoadingScreens(false);
    }
  };

  useEffect(() => {
    if (selectedTheatreId) {
      loadScreens(
        selectedTheatreId
      );
    }
  }, [selectedTheatreId]);

  const openCreateScreenForm = () => {
    setEditingScreenId(null);

    setScreenForm(
      emptyScreenForm
    );

    setError("");
    setSuccess("");

    setShowScreenForm(true);
  };

  const openEditScreenForm = (
    screen: Screen
  ) => {
    setEditingScreenId(
      screen._id
    );

    setScreenForm({
      name: screen.name,
      totalSeats: String(
        screen.totalSeats
      ),
    });

    setError("");
    setSuccess("");

    setShowScreenForm(true);
  };

  const closeScreenForm = () => {
    if (savingScreen) {
      return;
    }

    setShowScreenForm(false);
    setEditingScreenId(null);

    setScreenForm(
      emptyScreenForm
    );
  };

  const handleScreenSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!selectedTheatreId) {
      setError(
        "Please select a theatre."
      );
      return;
    }

    const name =
      screenForm.name.trim();

    const totalSeats =
      Number(
        screenForm.totalSeats
      );

    if (!name) {
      setError(
        "Screen name is required."
      );
      return;
    }

    if (
      !Number.isInteger(
        totalSeats
      ) ||
      totalSeats < 1
    ) {
      setError(
        "Total seats must be a positive integer."
      );
      return;
    }

    try {
      setSavingScreen(true);

      if (editingScreenId) {
        const response =
          await api.put(
            `/screens/${editingScreenId}`,
            {
              name,
              totalSeats,
            }
          );

        const updatedScreen =
          response.data.screen;

        setScreens(
          (previous) =>
            previous.map(
              (screen) =>
                screen._id ===
                editingScreenId
                  ? updatedScreen
                  : screen
            )
        );

        setSuccess(
          "Screen updated successfully."
        );
      } else {
        const response =
          await api.post(
            "/screens",
            {
              theatre:
                selectedTheatreId,
              name,
              totalSeats,
            }
          );

        const newScreen =
          response.data.screen;

        setScreens(
          (previous) => [
            newScreen,
            ...previous,
          ]
        );

        setSuccess(
          "Screen created successfully."
        );
      }

      closeScreenForm();
    } catch (error: any) {
      console.error(
        "Failed to save screen:",
        error
      );

      setError(
        error?.response?.data?.message ||
          "Failed to save screen."
      );
    } finally {
      setSavingScreen(false);
    }
  };

  const loadSeats = async (
    screenId: string
  ) => {
    try {
      setLoadingSeats(screenId);
      setError("");

      const response =
        await api.get(
          `/seats/screen/${screenId}`
        );

      setSeats(
        (previous) => ({
          ...previous,
          [screenId]:
            response.data.seats ||
            [],
        })
      );
    } catch (error: any) {
      console.error(
        "Failed to load seats:",
        error
      );

      setError(
        error?.response?.data?.message ||
          "Failed to load seats."
      );
    } finally {
      setLoadingSeats(null);
    }
  };

  const openSeatForm = (
    screen: Screen
  ) => {
    const existingSeats =
      seats[screen._id] || [];

    if (existingSeats.length > 0) {
      setError(
        "Seats already exist for this screen."
      );
      return;
    }

    setShowSeatForm(
      screen._id
    );

    setSeatForm(
      emptySeatForm
    );

    setError("");
    setSuccess("");
  };

  const closeSeatForm = () => {
    if (generatingSeats) {
      return;
    }

    setShowSeatForm(null);

    setSeatForm(
      emptySeatForm
    );
  };

  const generateRowNames = (
    count: number
  ) => {
    const rows: string[] = [];

    for (
      let index = 0;
      index < count;
      index++
    ) {
      let number =
        index + 1;

      let row = "";

      while (number > 0) {
        number--;

        row =
          String.fromCharCode(
            65 +
              (number % 26)
          ) + row;

        number = Math.floor(
          number / 26
        );
      }

      rows.push(row);
    }

    return rows;
  };

  const handleGenerateSeats = async (
    event: FormEvent<HTMLFormElement>,
    screen: Screen
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const rowCount =
      Number(
        seatForm.rowCount
      );

    const seatsPerRow =
      Number(
        seatForm.seatsPerRow
      );

    if (
      !Number.isInteger(
        rowCount
      ) ||
      rowCount < 1
    ) {
      setError(
        "Number of rows must be a positive integer."
      );
      return;
    }

    if (
      !Number.isInteger(
        seatsPerRow
      ) ||
      seatsPerRow < 1
    ) {
      setError(
        "Seats per row must be a positive integer."
      );
      return;
    }

    const total =
      rowCount *
      seatsPerRow;

    if (
      total !==
      screen.totalSeats
    ) {
      setError(
        `This layout creates ${total} seats, but ${screen.name} requires exactly ${screen.totalSeats} seats.`
      );
      return;
    }

    const rows =
      generateRowNames(
        rowCount
      );

    try {
      setGeneratingSeats(true);

      const response =
        await api.post(
          "/seats/generate",
          {
            screen:
              screen._id,
            rows,
            seatsPerRow,
          }
        );

      setSeats(
        (previous) => ({
          ...previous,
          [screen._id]:
            response.data.seats ||
            [],
        })
      );

      setSuccess(
        `${response.data.count || total} seats generated successfully.`
      );

      closeSeatForm();
    } catch (error: any) {
      console.error(
        "Failed to generate seats:",
        error
      );

      setError(
        error?.response?.data?.message ||
          "Failed to generate seats."
      );
    } finally {
      setGeneratingSeats(false);
    }
  };

  const handleDeleteSeats = async (
    screen: Screen
  ) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete all seats from "${screen.name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingSeatsScreenId(
        screen._id
      );

      setError("");
      setSuccess("");

      await api.delete(
        `/seats/screen/${screen._id}`
      );

      setSeats(
        (previous) => ({
          ...previous,
          [screen._id]: [],
        })
      );

      setSuccess(
        "Seats deleted successfully."
      );
    } catch (error: any) {
      console.error(
        "Failed to delete seats:",
        error
      );

      setError(
        error?.response?.data?.message ||
          "Failed to delete seats."
      );
    } finally {
      setDeletingSeatsScreenId(
        null
      );
    }
  };

  const handleDeleteScreen = async (
    screen: Screen
  ) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${screen.name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingScreenId(
        screen._id
      );

      setError("");
      setSuccess("");

      await api.delete(
        `/screens/${screen._id}`
      );

      setScreens(
        (previous) =>
          previous.filter(
            (item) =>
              item._id !==
              screen._id
          )
      );

      setSeats(
        (previous) => {
          const copy = {
            ...previous,
          };

          delete copy[
            screen._id
          ];

          return copy;
        }
      );

      setSuccess(
        "Screen deleted successfully."
      );
    } catch (error: any) {
      console.error(
        "Failed to delete screen:",
        error
      );

      setError(
        error?.response?.data?.message ||
          "Failed to delete screen."
      );
    } finally {
      setDeletingScreenId(
        null
      );
    }
  };

  return (
    <section className="min-h-[calc(100vh-140px)] bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-7xl">

        <div className="mb-8">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <h1 className="text-3xl font-bold sm:text-4xl">
                Manage Screens & Seats
              </h1>

              <p className="mt-2 text-slate-400">
                Manage cinema screens and generate seat layouts.
              </p>
            </div>

            <button
              type="button"
              onClick={
                openCreateScreenForm
              }
              disabled={
                !selectedTheatreId
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={18} />

              Add Screen
            </button>

          </div>

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

        <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <label className="mb-2 block text-sm font-medium text-slate-300">
            Select Theatre
          </label>

          {loadingTheatres ? (
            <div className="flex items-center gap-2 text-slate-400">
              <Loader2
                size={18}
                className="animate-spin"
              />

              Loading theatres...
            </div>
          ) : theatres.length === 0 ? (
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-400">
              No theatres available. Create a theatre first.
            </div>
          ) : (
            <select
              value={
                selectedTheatreId
              }
              onChange={(event) =>
                setSelectedTheatreId(
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-500"
            >
              {theatres.map(
                (theatre) => (
                  <option
                    key={
                      theatre._id
                    }
                    value={
                      theatre._id
                    }
                  >
                    {theatre.name}
                    {theatre.city
                      ? ` — ${theatre.city}`
                      : ""}
                  </option>
                )
              )}
            </select>
          )}

        </div>

        {showScreenForm && (
          <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="mb-6 flex items-center justify-between">

              <div>
                <h2 className="text-xl font-bold">
                  {editingScreenId
                    ? "Edit Screen"
                    : "Add Screen"}
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Configure the screen name and seat capacity.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeScreenForm
                }
                disabled={
                  savingScreen
                }
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                <X size={20} />
              </button>

            </div>

            <form
              onSubmit={
                handleScreenSubmit
              }
              className="grid gap-5 sm:grid-cols-2"
            >

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Screen Name
                </label>

                <input
                  type="text"
                  value={
                    screenForm.name
                  }
                  onChange={(event) =>
                    setScreenForm(
                      (previous) => ({
                        ...previous,
                        name:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="e.g. Screen 1"
                  disabled={
                    savingScreen
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-red-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Total Seats
                </label>

                <input
                  type="number"
                  min="1"
                  value={
                    screenForm.totalSeats
                  }
                  onChange={(event) =>
                    setScreenForm(
                      (previous) => ({
                        ...previous,
                        totalSeats:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="e.g. 100"
                  disabled={
                    savingScreen
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-red-500"
                />
              </div>

              <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={
                    closeScreenForm
                  }
                  className="rounded-lg border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    savingScreen
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
                >
                  {savingScreen ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />

                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus size={17} />

                      {editingScreenId
                        ? "Update Screen"
                        : "Create Screen"}
                    </>
                  )}
                </button>

              </div>

            </form>
          </div>
        )}

        {loadingScreens ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">

            <Loader2
              size={36}
              className="mx-auto mb-4 animate-spin text-red-500"
            />

            <p className="text-slate-400">
              Loading screens...
            </p>

          </div>
        ) : screens.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">

            <LayoutGrid
              size={48}
              className="mx-auto text-slate-600"
            />

            <h2 className="mt-5 text-xl font-semibold">
              No screens found
            </h2>

            <p className="mt-2 text-slate-400">
              Create a screen for this theatre.
            </p>

          </div>
        ) : (
          <div className="space-y-6">

            {screens.map(
              (screen) => {
                const screenSeats =
                  seats[
                    screen._id
                  ] || [];

                return (
                  <div
                    key={
                      screen._id
                    }
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
                  >

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                      <div className="flex items-start gap-4">

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                          <LayoutGrid
                            size={24}
                          />
                        </div>

                        <div>
                          <h2 className="text-xl font-bold">
                            {screen.name}
                          </h2>

                          <p className="mt-1 text-sm text-slate-400">
                                Capacity:{" "}
                        <span className="font-semibold text-slate-300">
                        {screen.totalSeats}
                    </span>
                        </p>

                          {screenSeats.length >
                            0 && (
                            <p className="mt-1 text-sm text-green-400">
                              {
                                screenSeats.length
                              }{" "}
                              seats configured
                            </p>
                          )}

                        </div>

                      </div>

                      <div className="flex flex-wrap gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            openEditScreenForm(
                              screen
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"
                        >
                          <Edit
                            size={16}
                          />

                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteScreen(
                              screen
                            )
                          }
                          disabled={
                            deletingScreenId ===
                            screen._id
                          }
                          className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                        >
                          {deletingScreenId ===
                          screen._id ? (
                            <Loader2
                              size={16}
                              className="animate-spin"
                            />
                          ) : (
                            <Trash2
                              size={16}
                            />
                          )}

                          Delete
                        </button>

                      </div>

                    </div>

                    <div className="mt-6 border-t border-slate-800 pt-6">

                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                        <div>
                          <h3 className="font-semibold">
                            Seat Layout
                          </h3>

                          <p className="mt-1 text-sm text-slate-500">
                            Generate seats based on rows and seats per row.
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              loadSeats(
                                screen._id
                              )
                            }
                            disabled={
                              loadingSeats ===
                              screen._id
                            }
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800"
                          >
                            {loadingSeats ===
                            screen._id ? (
                              <Loader2
                                size={16}
                                className="animate-spin"
                              />
                            ) : (
                              <LayoutGrid
                                size={16}
                              />
                            )}

                            Load Seats
                          </button>

                          {screenSeats.length ===
                            0 && (
                            <button
                              type="button"
                              onClick={() =>
                                openSeatForm(
                                  screen
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold hover:bg-red-700"
                            >
                              <Plus
                                size={16}
                              />

                              Generate Seats
                            </button>
                          )}

                          {screenSeats.length >
                            0 && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteSeats(
                                  screen
                                )
                              }
                              disabled={
                                deletingSeatsScreenId ===
                                screen._id
                              }
                              className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                            >
                              {deletingSeatsScreenId ===
                              screen._id ? (
                                <Loader2
                                  size={16}
                                  className="animate-spin"
                                />
                              ) : (
                                <Trash2
                                  size={16}
                                />
                              )}

                              Delete Seats
                            </button>
                          )}

                        </div>

                      </div>

                      {showSeatForm ===
                        screen._id && (
                        <form
                          onSubmit={(
                            event
                          ) =>
                            handleGenerateSeats(
                              event,
                              screen
                            )
                          }
                          className="mt-5 rounded-xl border border-slate-800 bg-slate-950 p-5"
                        >

                          <div className="mb-5">
                            <h4 className="font-semibold">
                              Generate Seat Layout
                            </h4>

                            <p className="mt-1 text-sm text-slate-500">
                              Required capacity:{" "}
                              <span className="font-semibold text-slate-300">
                                {
                                  screen.totalSeats
                                }
                              </span>
                            </p>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2">

                            <div>
                              <label className="mb-2 block text-sm text-slate-300">
                                Number of Rows
                              </label>

                              <input
                                type="number"
                                min="1"
                                value={
                                  seatForm.rowCount
                                }
                                onChange={(
                                  event
                                ) =>
                                  setSeatForm(
                                    (
                                      previous
                                    ) => ({
                                      ...previous,
                                      rowCount:
                                        event
                                          .target
                                          .value,
                                    })
                                  )
                                }
                                placeholder="e.g. 10"
                                disabled={
                                  generatingSeats
                                }
                                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-red-500"
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-sm text-slate-300">
                                Seats Per Row
                              </label>

                              <input
                                type="number"
                                min="1"
                                value={
                                  seatForm.seatsPerRow
                                }
                                onChange={(
                                  event
                                ) =>
                                  setSeatForm(
                                    (
                                      previous
                                    ) => ({
                                      ...previous,
                                      seatsPerRow:
                                        event
                                          .target
                                          .value,
                                    })
                                  )
                                }
                                placeholder="e.g. 10"
                                disabled={
                                  generatingSeats
                                }
                                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-red-500"
                              />
                            </div>

                          </div>

                          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">

                            <button
                              type="button"
                              onClick={
                                closeSeatForm
                              }
                              disabled={
                                generatingSeats
                              }
                              className="rounded-lg border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-800"
                            >
                              Cancel
                            </button>

                            <button
                              type="submit"
                              disabled={
                                generatingSeats
                              }
                              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
                            >
                              {generatingSeats ? (
                                <>
                                  <Loader2
                                    size={17}
                                    className="animate-spin"
                                  />

                                  Generating...
                                </>
                              ) : (
                                <>
                                  <LayoutGrid
                                    size={17}
                                  />

                                  Generate Seats
                                </>
                              )}
                            </button>

                          </div>

                        </form>
                      )}

                      {screenSeats.length >
                        0 && (
                        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-5">

                          <div className="mb-5 flex items-center justify-between">

                            <div>
                              <p className="text-sm font-semibold">
                                Seat Layout
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {
                                  screenSeats.length
                                }{" "}
                                /{" "}
                                {
                                  screen.totalSeats
                                }{" "}
                                seats
                              </p>
                            </div>

                          </div>

                          <div className="min-w-125 space-y-3">

                            {Array.from(
                              new Set(
                                screenSeats.map(
                                  (seat) =>
                                    seat.row
                                )
                              )
                            ).map(
                              (row) => {
                                const rowSeats =
                                  screenSeats.filter(
                                    (seat) =>
                                      seat.row ===
                                      row
                                  );

                                return (
                                  <div
                                    key={
                                      row
                                    }
                                    className="flex items-center gap-3"
                                  >

                                    <div className="w-8 shrink-0 text-sm font-bold text-slate-500">
                                      {row}
                                    </div>

                                    <div className="flex flex-wrap gap-2">

                                      {rowSeats.map(
                                        (
                                          seat
                                        ) => (
                                          <div
                                            key={
                                              seat._id
                                            }
                                            title={`${seat.row}${seat.number} • ${seat.type} • ₹${seat.price}`}
                                            className={`flex h-9 w-9 items-center justify-center rounded-md border text-xs font-semibold ${
                                              seat.type ===
                                              "premium"
                                                ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
                                                : seat.type ===
                                                  "recliner"
                                                ? "border-purple-500/30 bg-purple-500/10 text-purple-400"
                                                : "border-slate-700 bg-slate-900 text-slate-300"
                                            }`}
                                          >
                                            {
                                              seat.number
                                            }
                                          </div>
                                        )
                                      )}

                                    </div>

                                  </div>
                                );
                              }
                            )}

                          </div>

                          <div className="mt-6 flex flex-wrap gap-4 border-t border-slate-800 pt-4 text-xs text-slate-400">

                            <div className="flex items-center gap-2">
                              <span className="h-3 w-3 rounded border border-slate-700 bg-slate-900" />
                              Regular ₹150
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="h-3 w-3 rounded border border-yellow-500/30 bg-yellow-500/10" />
                              Premium ₹200
                            </div>

                          </div>

                        </div>
                      )}

                    </div>

                  </div>
                );
              }
            )}

          </div>
        )}

      </div>
    </section>
  );
}

export default AdminScreens;
