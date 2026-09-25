import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface BookingContextType {
  showId: string | null;

  seatIds: string[];
  selectedSeatIds: string[];

  seatNames: string[];
  selectedSeatNames: string[];

  expiresAt: number | null;

  setBooking: (
    showId: string,
    seatIds: string[],
    seatNames: string[],
    expiresAt: number
  ) => void;

  clearBooking: () => void;
}

const BookingContext =
  createContext<BookingContextType | undefined>(
    undefined
  );

interface BookingProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = "movie_booking";

interface StoredBooking {
  showId: string;
  seatIds: string[];
  seatNames: string[];
  expiresAt: number;
}

export function BookingProvider({
  children,
}: BookingProviderProps) {
  const [showId, setShowId] =
    useState<string | null>(null);

  const [seatIds, setSeatIds] =
    useState<string[]>([]);

  const [seatNames, setSeatNames] =
    useState<string[]>([]);

  const [expiresAt, setExpiresAt] =
    useState<number | null>(null);

  useEffect(() => {
    const stored =
      localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return;
    }

    try {
      const booking: StoredBooking =
        JSON.parse(stored);

      if (
        !booking.showId ||
        !booking.seatIds?.length ||
        !booking.expiresAt
      ) {
        localStorage.removeItem(
          STORAGE_KEY
        );

        return;
      }

      if (
        booking.expiresAt <= Date.now()
      ) {
        localStorage.removeItem(
          STORAGE_KEY
        );

        return;
      }

      setShowId(booking.showId);
      setSeatIds(booking.seatIds);
      setSeatNames(
        booking.seatNames || []
      );
      setExpiresAt(
        booking.expiresAt
      );
    } catch {
      localStorage.removeItem(
        STORAGE_KEY
      );
    }
  }, []);

  const setBooking = (
    newShowId: string,
    newSeatIds: string[],
    newSeatNames: string[],
    newExpiresAt: number
  ) => {
    setShowId(newShowId);
    setSeatIds(newSeatIds);
    setSeatNames(newSeatNames);
    setExpiresAt(newExpiresAt);

    const booking: StoredBooking = {
      showId: newShowId,
      seatIds: newSeatIds,
      seatNames: newSeatNames,
      expiresAt: newExpiresAt,
    };

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(booking)
    );
  };

  const clearBooking = () => {
    setShowId(null);
    setSeatIds([]);
    setSeatNames([]);
    setExpiresAt(null);

    localStorage.removeItem(
      STORAGE_KEY
    );
  };

  return (
    <BookingContext.Provider
      value={{
        showId,

        seatIds,
        selectedSeatIds: seatIds,

        seatNames,
        selectedSeatNames: seatNames,

        expiresAt,

        setBooking,
        clearBooking,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking(): BookingContextType {
  const context =
    useContext(BookingContext);

  if (!context) {
    throw new Error(
      "useBooking must be used inside BookingProvider"
    );
  }

  return context;
}
