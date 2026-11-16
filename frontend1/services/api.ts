import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios"

import { STORAGE_KEYS, storageGet, storageRemove, storageSet } from "@/utils/storage"
import {refreshTokenService} from "@/services/auth"

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api",
  timeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT ?? 10000),
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
})

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = storageGet<string>(STORAGE_KEYS.TOKEN)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => Promise.reject(error),
)

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status

    if (status === 401 && typeof window !== "undefined") {
        try {
          const { access_token, refresh_token } = await refreshTokenService(storageGet(STORAGE_KEYS.REFRESH_TOKEN) || "")
          storageSet(STORAGE_KEYS.TOKEN, access_token)
          if (refresh_token) {
            storageSet(STORAGE_KEYS.REFRESH_TOKEN, refresh_token)
          }
          window.location.reload()
        } catch (refreshError) {
          console.error("Falha ao atualizar o token:", refreshError)
          storageRemove(STORAGE_KEYS.TOKEN)
          storageRemove(STORAGE_KEYS.REFRESH_TOKEN)
          storageRemove(STORAGE_KEYS.USER)
          window.location.replace("/entrar")
          return Promise.reject(refreshError)
        }
    }

    if (status === 403) {
      console.warn("Acesso negado (403).")
    }

    if (status && status >= 500) {
      console.error(`Erro do servidor (${status}):`, error.message)
    }

    return Promise.reject(error)
  },
)

export default api
