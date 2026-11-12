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
  const response = await api.post<ExampleLoginResponse>("/token/", data)
  return response.data
}

export const registerService = async (
  data: ExampleRegisterRequest,
): Promise<ExampleRegisterResponse> => {
  const response = await api.post<ExampleRegisterResponse>(
    "/register",
    data,
  )
  return response.data
}

export const logoutService = async (): Promise<void> => {
  await api.post("/token/logout")
}

export const refreshTokenService = async (refresh:string): Promise<{
  access_token: string
  refresh_token: string
}> => {
  const response = await api.post<{
    data: { access_token: string; refresh_token: string }
  }>("/token/refresh", { refresh })

  return response.data.data
}
