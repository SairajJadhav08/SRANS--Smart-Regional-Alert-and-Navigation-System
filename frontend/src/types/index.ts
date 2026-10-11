export interface User {
  id: number
  username: string
  email: string
  is_government: boolean
  is_superuser: boolean
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

// ── AI insight payloads ──────────────────────────────────────────────────────
export type RiskLevel = 'low' | 'moderate' | 'high' | 'severe'
export type Severity = 'low' | 'moderate' | 'high' | 'critical'

export interface RouteRisk {
  route_id: number
  score: number
  level: RiskLevel
  length_km: number
  summary: string
  advice: string[]
  best_departure: string | null
  alerts: Array<{ id: number; title: string; alert_type: string; distance_km: number }>
  generated_at: string
}

export interface AlertExplanation {
  alert_id: number
  impact: string
  who_affected: string
  expected_delay: string
  advice: string[]
}

export interface AlertDraft {
  title: string
  description: string
  alert_type: Alert['alert_type']
  severity: Severity
  expected_duration: string
  broadcast_recommended: boolean
}

export interface ReportTriage {
  report_id: number
  credibility: number
  severity: Severity
  suggested_type: string
  duplicate_of: { id: number; title: string } | null
  recommendation: 'approve' | 'reject' | 'merge' | 'needs_info'
  reasoning: string
  suggested_title: string
  suggested_description: string
}

export interface SituationReport {
  status: 'normal' | 'elevated' | 'critical'
  headline: string
  key_points: string[]
  recommended_actions: string[]
  counts: Record<string, number>
  pending_reports: number
  generated_at: string
}

export interface Report {
  id: number
  title: string
  description: string
  report_type: string
  location_lat: number
  location_lng: number
  status: 'pending' | 'approved' | 'rejected'
  submitted_by: number
  promoted_to: number | null
  review_note: string | null
  created_at: string
  updated_at: string
  user?: { username: string; email: string }
}
