import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios"

import { STORAGE_KEYS, storageGet, storageRemove } from "@/utils/storage"

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
  (error: AxiosError) => {
    const status = error.response?.status

    if (status === 401 && typeof window !== "undefined") {
      storageRemove(STORAGE_KEYS.TOKEN)
      storageRemove(STORAGE_KEYS.EXPIRES_IN)
      storageRemove(STORAGE_KEYS.USER)

      if (window.location.pathname !== "/entrar") {
        window.location.replace("/entrar")
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
