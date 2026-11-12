export const STORAGE_KEYS = {
  TOKEN: "token",
  REFRESH_TOKEN: "refresh_token",
  USER: "user",
} as const

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null
  return window.localStorage
}

export const storageSet = <T>(key: string, value: T): void => {
  const storage = getStorage()
  if (!storage) return

  try {
    storage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Could not save "${key}" in browser storage.`, error)
    throw error
  }
}

export const storageGet = <T>(key: string): T | null => {
  const storage = getStorage()
  if (!storage) return null

  const item = storage.getItem(key)
  if (item === null) return null

  try {
    return JSON.parse(item) as T
  } catch (error) {
    console.error(`Could not parse "${key}" from browser storage.`, error)
    return null
  }
}

export const storageRemove = (key: string): void => {
  getStorage()?.removeItem(key)
}
