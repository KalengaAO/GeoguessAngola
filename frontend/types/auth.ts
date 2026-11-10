export type ExampleAuthUser = {
  id: string | number
  name: string
  email: string
}

export type ExampleLoginRequest = {
  email: string
  password: string
}

export type ExampleRegisterRequest = {
  name: string
  email: string
  password: string
}

export type ExampleLoginResponse = {
  data: {
    access_token: string
    expires_in?: number
    user: ExampleAuthUser
  }
  message?: string
}

export type ExampleRegisterResponse = {
  data: {
    user: ExampleAuthUser
  }
  message?: string
}

export type AuthContextValue = {
  user: ExampleAuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  // eslint-disable-next-line no-unused-vars -- Parameter types are part of this public context API.
  setSession: (session: { token: string; user: ExampleAuthUser }) => void
  logout: () => void
}
