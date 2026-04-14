import React, { createContext, useContext, useState, useEffect } from 'react'
import type { User } from '../types'

interface AuthState {
  token: string | null
  user: User | null
  isLoggedIn: boolean
  isGovUser: boolean
  isAnyGovUser: boolean
  isSuperuser: boolean
}

interface AuthContextValue extends AuthState {
  login: (token: string, user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem('user')
      return raw ? (JSON.parse(raw) as User) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    const handleLogout = () => {
      setToken(null)
      setUser(null)
    }
    window.addEventListener('auth:logout', handleLogout)
    return () => window.removeEventListener('auth:logout', handleLogout)
  }, [])

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  const isLoggedIn = token !== null
  const isGovUser = user?.is_government === true && user?.is_verified === true
  const isAnyGovUser = user?.is_government === true
  const isSuperuser = user?.is_superuser === true

  return (
    <AuthContext.Provider value={{ token, user, isLoggedIn, isGovUser, isAnyGovUser, isSuperuser, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
