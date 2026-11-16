export type ExampleAuthUser = {
  id: string | number
  name: string
  email: string
}

export type ExampleLoginRequest = {
  username: string
  password: string
}

export type ExampleRegisterRequest = {
  username: string
  password: string
}

export type ExampleLoginResponse = {
    access: string
    refresh: string
}

export type ExampleRegisterResponse = {
  detail:string
}

export type AuthContextValue = {
  user: ExampleAuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  // eslint-disable-next-line no-unused-vars -- Parameter types are part of this public context API.
  setSession: (session: { token: string; refresh: string; user: ExampleAuthUser | null}) => void
  logout: () => void
}
