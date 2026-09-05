import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, refreshAccessToken, setAccessToken } from '../api/client'
import type { User } from '../api/types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const restored = await refreshAccessToken()
      if (restored) {
        try {
          setUser(await api.get<User>('/auth/me'))
        } catch {
          setAccessToken(null)
        }
      }
      setLoading(false)
    })()
  }, [])

  async function login(email: string, password: string) {
    await api.post<{ access_token: string }>('/auth/login', { email, password }).then((res) => {
      setAccessToken(res.access_token)
    })
    setUser(await api.get<User>('/auth/me'))
  }

  async function register(email: string, password: string) {
    const res = await api.post<{ access_token: string }>('/auth/register', { email, password })
    setAccessToken(res.access_token)
    setUser(await api.get<User>('/auth/me'))
  }

  async function logout() {
    await api.post('/auth/logout').catch(() => undefined)
    setAccessToken(null)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
