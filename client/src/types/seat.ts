export type SeatStatus =
  | "available"
  | "locked"
  | "booked";

export interface Seat {
  _id: string;
  row: string;
  number: number;
  type?: "regular" | "premium" | "recliner";
  price?: number;
}

export interface ShowSeat {
  _id: string;
  show: string;
  seat: string | Seat;
  status: SeatStatus;
  lockedUntil?: string;
  lockedBy?: string;
  booking?: string;
}

export interface ShowSeatResponse {
  success: boolean;
  seats: ShowSeat[];
}
