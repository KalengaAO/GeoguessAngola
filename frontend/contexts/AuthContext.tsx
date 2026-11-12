"use client"

import { useRouter } from "next/navigation"
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react"

import type { AuthContextValue, ExampleAuthUser } from "@/types/auth"
import {
  STORAGE_KEYS,
  storageGet,
  storageRemove,
  storageSet,
} from "@/utils/storage"
import { logoutService } from "@/services/auth"

type SessionSnapshot = {
  user: ExampleAuthUser | null
  isLoading: boolean
}

const initialSnapshot: SessionSnapshot = { user: null, isLoading: true }
let sessionSnapshot = initialSnapshot
let initialized = false
const listeners = new Set<() => void>()

function emitChange() {
  for (const listener of listeners) {
    listener()
  }
}

function initializeSession() {
  if (initialized || typeof window === "undefined") return

  const token = storageGet<string>(STORAGE_KEYS.TOKEN)
  const user = storageGet<ExampleAuthUser>(STORAGE_KEYS.USER)

  sessionSnapshot = { user: token && user ? user : null, isLoading: false }
  initialized = true
  emitChange()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  initializeSession()

  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot() {
  return sessionSnapshot
}

function getServerSnapshot() {
  return initialSnapshot
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const session = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  )

  const setSession = useCallback(
    ({ token, refresh, user }: { token: string; refresh: string; user: ExampleAuthUser }) => {
      storageSet(STORAGE_KEYS.TOKEN, token)
      storageSet(STORAGE_KEYS.REFRESH_TOKEN, refresh)
      storageSet(STORAGE_KEYS.USER, user)
      sessionSnapshot = { user, isLoading: false }
      initialized = true
      emitChange()
    },
    [],
  )

  const logout = useCallback(async() => {
    storageRemove(STORAGE_KEYS.TOKEN)
    storageRemove(STORAGE_KEYS.REFRESH_TOKEN)
    storageRemove(STORAGE_KEYS.USER)
    sessionSnapshot = { user: null, isLoading: false }
    initialized = true
    emitChange()
    await logoutService()
    router.replace("/entrar")
  }, [router])

  const value = useMemo(
    () => ({
      user: session.user,
      isLoading: session.isLoading,
      isAuthenticated: session.user !== null,
      setSession,
      logout,
    }),
    [logout, session, setSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider.")
  }
  return context
}
