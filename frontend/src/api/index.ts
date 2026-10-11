import client from './client'
import type {
  User, Alert, SavedRoute, AuthResponse,
  RouteRisk, AlertExplanation, AlertDraft, ReportTriage, SituationReport,
} from '../types'

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

export const getAiRoutinePlan = (routeId: number, arrivalTime: string) =>
  client.post<{ recommendation: string }>('/ai/routine-planner', { route_id: routeId, arrival_time: arrivalTime })

export const getAiDetectAlerts = (lat: number, lng: number) =>
  client.post<{
    created: number
    alerts: Array<{
      id: number
      title: string
      description: string
      alert_type: string
      location_lat: number
      location_lng: number
      created_at: string
    }>
  }>('/ai/detect-alerts', { lat, lng })

export const getAiNavigationChat = (data: {
  message: string
  start_lat?: number
  start_lng?: number
  end_lat?: number
  end_lng?: number
  current_step?: string
  total_distance?: string
  total_time?: string
}) => client.post<{ reply: string }>('/ai/navigation-chat', data)

export const getAiChat = (message: string) =>
  client.post<{ reply: string }>('/ai/chat', { message })

// Contact — submitted straight to Formspree, which emails the message to the team
const FORMSPREE_URL = 'https://formspree.io/f/mrbyjvyj'

export async function sendContact(data: ContactPayload): Promise<void> {
  const res = await fetch(FORMSPREE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
      _subject: `SRANS contact: ${data.subject}`,
      _replyto: data.email,
    }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    const msg = body?.errors?.map((e: { message: string }) => e.message).join(' ') || 'Could not send your message.'
    throw new Error(msg)
  }
}

// Superuser admin
export const getGovUsers = () => client.get<User[]>('/auth/admin/gov-users')
export const approveGovUser = (id: number) => client.post(`/auth/admin/gov-users/${id}/approve`)
export const revokeGovUser = (id: number) => client.post(`/auth/admin/gov-users/${id}/revoke`)

// ── Broadcast ──────────────────────────────────────────────────────────────
export const getActiveBroadcast = () =>
  client.get<any>('/alerts/broadcast/active')

export const sendBroadcast = (data: {
  title: string; description: string; alert_type: string;
  location_lat?: number; location_lng?: number
}) => client.post<any>('/alerts/broadcast', data)

// ── Analytics ──────────────────────────────────────────────────────────────
export const getAnalyticsSummary = () =>
  client.get<{ totalAlerts: number; totalUsers: number; totalRoutes: number; totalReports: number }>('/analytics/summary')

export const getAnalyticsByType = () =>
  client.get<Array<{ type: string; count: number }>>('/analytics/by-type')

export const getAnalyticsWeekly = () =>
  client.get<Array<{ date: string; count: number }>>('/analytics/weekly')

export const getAnalyticsHotspots = () =>
  client.get<Array<{ lat: number; lng: number; count: number; types: string[] }>>('/analytics/hotspots')

export const getAnalyticsRecentActivity = () =>
  client.get<any>('/analytics/recent-activity')

// ── Reports (Crowdsourcing) ────────────────────────────────────────────────
export const getReports = () => client.get<any[]>('/reports')

export const submitReport = (data: {
  title: string; description: string; report_type: string;
  location_lat: number; location_lng: number
}) => client.post<any>('/reports', data)

export const approveReport = (
  id: number,
  note?: string,
  overrides?: { title?: string; description?: string; alert_type?: string }
) => client.post<any>(`/reports/${id}/approve`, { note, ...overrides })

export const rejectReport = (id: number, note?: string) =>
  client.post<any>(`/reports/${id}/reject`, { note })

export const deleteReport = (id: number) =>
  client.delete(`/reports/${id}`)

// ── AI insights ────────────────────────────────────────────────────────────
export interface ChatTurn { role: 'user' | 'assistant'; content: string }

export const getAiChatWithHistory = (message: string, history: ChatTurn[]) =>
  client.post<{ reply: string }>('/ai/chat', { message, history })

export const getAiDailyBriefing = (data: { city?: string; lat?: number; lng?: number }) =>
  client.post<{ briefing: string; alertCount: number }>('/ai/daily-briefing', data)

export const getAiRouteRisk = (routeId: number, arrivalTime?: string) =>
  client.post<RouteRisk>('/ai/route-risk', { route_id: routeId, arrival_time: arrivalTime })

export const getAiExplainAlert = (alertId: number) =>
  client.post<AlertExplanation>('/ai/explain-alert', { alert_id: alertId })

export const getAiDraftAlert = (notes: string, mode: 'alert' | 'report' = 'alert') =>
  client.post<AlertDraft>('/ai/draft-alert', { notes, mode })

export const getAiTriageReport = (reportId: number) =>
  client.post<ReportTriage>('/ai/triage-report', { report_id: reportId })

export const getAiSituationReport = () =>
  client.post<SituationReport>('/ai/situation-report')

export const getAiSmartSearch = (query: string) =>
  client.post<{ answer: string; alert_ids: number[] }>('/ai/smart-search', { query })

export const getAiAnalyticsInsights = () =>
  client.post<{ insights: string[]; forecast: string | null; generated_at: string }>('/ai/analytics-insights')
