export interface User {
  id: number
  username: string
  email: string
  is_government: boolean
  agency_name: string | null
  department: string | null
  is_verified: boolean
}

export interface Alert {
  id: number
  title: string
  description: string
  alert_type: 'Traffic' | 'Emergency' | 'Construction' | 'Weather'
  location_lat: number
  location_lng: number
  created_at: string
  updated_at: string
  author_id: number
}

export interface SavedRoute {
  id: number
  name: string
  start_lat: number
  start_lng: number
  end_lat: number
  end_lng: number
  created_at: string
  user_id: number
}

export interface AuthResponse {
  token: string
  user: User
}

export interface ApiError {
  error: string
  message: string
}

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
