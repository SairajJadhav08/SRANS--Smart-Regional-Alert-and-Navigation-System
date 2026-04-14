import client from './client'
import type { User, Alert, SavedRoute, AuthResponse } from '../types'

export type { AuthResponse }

export interface RegisterPayload {
  username: string
  email: string
  password: string
  user_type: 'user' | 'government'
  agency_name?: string
  department?: string
}

export interface AlertPayload {
  title: string
  description: string
  alert_type: string
  location_lat: number
  location_lng: number
}

export interface RoutePayload {
  name: string
  start_lat: number
  start_lng: number
  end_lat: number
  end_lng: number
}

export interface ContactPayload {
  name: string
  email: string
  subject: string
  message: string
}

// Auth
export const login = (username: string, password: string) =>
  client.post<AuthResponse>('/auth/login', { username, password })

export const register = (data: RegisterPayload) =>
  client.post<{ message: string }>('/auth/register', data)

export const logout = () => client.post('/auth/logout')

export const getMe = () => client.get<User>('/auth/me')

// Alerts
export const getAlerts = (params?: { type?: string; author_only?: boolean }) =>
  client.get<Alert[]>('/alerts', { params })

export const getAlert = (id: number) => client.get<Alert>(`/alerts/${id}`)

export const createAlert = (data: AlertPayload) =>
  client.post<Alert>('/alerts', data)

export const updateAlert = (id: number, data: AlertPayload) =>
  client.put<Alert>(`/alerts/${id}`, data)

export const deleteAlert = (id: number) => client.delete(`/alerts/${id}`)

export const bulkDeleteAlerts = (ids: number[]) =>
  client.post('/alerts/bulk-delete', { ids })

// Routes
export const getRoutes = () => client.get<SavedRoute[]>('/routes')

export const createRoute = (data: RoutePayload) =>
  client.post<SavedRoute>('/routes', data)

export const deleteRoute = (id: number) => client.delete(`/routes/${id}`)

// Contact
export const sendContact = (data: ContactPayload) =>
  client.post('/contact', { data })

// Superuser admin
export const getGovUsers = () => client.get<User[]>('/auth/admin/gov-users')
export const approveGovUser = (id: number) => client.post(`/auth/admin/gov-users/${id}/approve`)
export const revokeGovUser = (id: number) => client.post(`/auth/admin/gov-users/${id}/revoke`)
