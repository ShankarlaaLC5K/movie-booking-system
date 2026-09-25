import api from "./api";

export interface Theatre {
  _id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TheatreListResponse {
  success: boolean;
  count: number;
  theatres: Theatre[];
}

export interface TheatreResponse {
  success: boolean;
  theatre: Theatre;
}

export async function getTheatres(): Promise<TheatreListResponse> {
  const response =
    await api.get<TheatreListResponse>(
      "/theatres"
    );

  return response.data;
}

export async function getTheatreById(
  theatreId: string
): Promise<TheatreResponse> {
  const response =
    await api.get<TheatreResponse>(
      `/theatres/${theatreId}`
    );

  return response.data;
}
