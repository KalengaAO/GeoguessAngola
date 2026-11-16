export type ApiResponse<TData> = {
  data: TData
  message?: string
}

export type ApiError = {
  message?: string
  errors?: Record<string, string[]>
}
