import api from "./api";

import type {
  AuthResponse,
  GetMeResponse,
  LoginData,
  RegisterData,
} from "../types/auth";

export async function loginUser(
  data: LoginData
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>(
    "/auth/login",
    data
  );

  return response.data;
}

export async function registerUser(
  data: RegisterData
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>(
    "/auth/register",
    data
  );

  return response.data;
}

export async function getMe(): Promise<GetMeResponse> {
  const response = await api.get<GetMeResponse>(
    "/auth/me"
  );

  return response.data;
}
