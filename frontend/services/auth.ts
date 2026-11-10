import type {
  ExampleLoginRequest,
  ExampleLoginResponse,
  ExampleRegisterRequest,
  ExampleRegisterResponse,
} from "@/types/auth"

import api from "./api"

export const loginService = async (
  data: ExampleLoginRequest,
): Promise<ExampleLoginResponse> => {
  const response = await api.post<ExampleLoginResponse>("/auth/login", data)
  return response.data
}

export const registerService = async (
  data: ExampleRegisterRequest,
): Promise<ExampleRegisterResponse> => {
  const response = await api.post<ExampleRegisterResponse>(
    "/auth/register",
    data,
  )

  return response.data
}

export const logoutService = async (): Promise<void> => {
  await api.post("/auth/logout")
}

export const refreshTokenService = async (): Promise<{
  access_token: string
  expires_in: number
}> => {
  const response = await api.post<{
    data: { access_token: string; expires_in: number }
  }>("/auth/refresh")

  return response.data.data
}
