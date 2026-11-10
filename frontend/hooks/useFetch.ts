"use client"

import {
  type QueryKey,
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query"
import type { AxiosError, AxiosRequestConfig } from "axios"

import api from "@/services/api"
import type { ApiError, ApiResponse } from "@/types/api"

export type UseFetchOptions = {
  queryKey?: QueryKey
  enabled?: boolean
  params?: AxiosRequestConfig["params"]
}

function isApiResponse<TData>(
  value: ApiResponse<TData> | TData,
): value is ApiResponse<TData> {
  return typeof value === "object" && value !== null && "data" in value
}

export function useFetch<TData>(
  endpoint: string,
  options: UseFetchOptions = {},
): UseQueryResult<TData, AxiosError<ApiError>> {
  const { enabled = true, params, queryKey = [endpoint, params] } = options

  return useQuery<TData, AxiosError<ApiError>>({
    queryKey,
    enabled,
    queryFn: async ({ signal }) => {
      const response = await api.get<ApiResponse<TData> | TData>(endpoint, {
        params,
        signal,
      })

      return isApiResponse(response.data) ? response.data.data : response.data
    },
  })
}
