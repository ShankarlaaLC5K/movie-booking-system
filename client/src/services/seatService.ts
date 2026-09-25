import api from "./api";

import type {
  ShowSeatResponse,
} from "../types/seat";

interface LockSeatsResponse {
  success: boolean;
  message: string;
  lockedUntil: string;
  seats: string[];
}

interface UnlockSeatsResponse {
  success: boolean;
  message: string;
  unlockedCount: number;
}

export async function getShowSeats(
  showId: string
): Promise<ShowSeatResponse> {
  const response =
    await api.get<ShowSeatResponse>(
      `/show-seats/show/${showId}`
    );

  return response.data;
}

export async function lockSeats(
  showId: string,
  seatIds: string[]
): Promise<LockSeatsResponse> {
  const response =
    await api.post<LockSeatsResponse>(
      `/show-seats/show/${showId}/lock`,
      {
        seatIds,
      }
    );

  return response.data;
}

export async function unlockSeats(
  showId: string,
  seatIds: string[]
): Promise<UnlockSeatsResponse> {
  const response =
    await api.post<UnlockSeatsResponse>(
      `/show-seats/show/${showId}/unlock`,
      {
        seatIds,
      }
    );

  return response.data;
}
