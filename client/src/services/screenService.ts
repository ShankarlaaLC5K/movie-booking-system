import api from "./api";

export interface Screen {
  _id: string;
  theatre: string;
  name: string;
  totalSeats: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScreenListResponse {
  success: boolean;
  count: number;
  screens: Screen[];
}

export interface ScreenResponse {
  success: boolean;
  screen: Screen;
}

export async function getScreensByTheatre(
  theatreId: string
): Promise<ScreenListResponse> {
  const response =
    await api.get<ScreenListResponse>(
      `/screens/theatre/${theatreId}`
    );

  return response.data;
}

export async function getScreenById(
  screenId: string
): Promise<ScreenResponse> {
  const response =
    await api.get<ScreenResponse>(
      `/screens/${screenId}`
    );

  return response.data;
}
