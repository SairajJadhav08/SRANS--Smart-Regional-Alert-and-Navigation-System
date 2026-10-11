import { Router } from 'express'
import { prisma } from '../config/db'
import { authenticate, requireGov } from '../middleware/auth'
import type { AuthRequest } from '../middleware/auth'
import {
  askJson, fenceData, ALERT_TYPES, TYPE_WEIGHT,
  distanceToSegmentKm, routeLengthKm, riskLevel,
} from '../lib/ai'

// AI insight endpoints — mounted under /api/ai alongside routes/ai.ts.
const router = Router()

const HOURS = 60 * 60 * 1000

const clampStr = (v: unknown, max: number, fallback = '') =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : fallback

const strList = (v: unknown, maxItems: number, maxLen: number) =>
  Array.isArray(v)
    ? v.filter(x => typeof x === 'string' && x.trim()).slice(0, maxItems).map(x => (x as string).trim().slice(0, maxLen))
    : []

// ── POST /api/ai/route-risk ───────────────────────────────────────────────────
// Scores a saved route 0–100 from alerts near the start→end corridor. The score
// is computed deterministically; the model only writes the human summary, so
// the number stays stable even if the AI call fails.
router.post('/route-risk', authenticate, async (req: AuthRequest, res: any) => {
  try {
    const id = parseInt(req.body.route_id)
    if (isNaN(id)) return res.status(400).json({ message: 'route_id is required' })

    const route = await prisma.savedRoute.findUnique({ where: { id } })
    if (!route || route.userId !== req.userId) {
      return res.status(404).json({ message: 'Route not found' })
    }

    const a = { lat: route.startLat, lng: route.startLng }
    const b = { lat: route.endLat, lng: route.endLng }
    const pad = 0.05
    const candidates = await prisma.alert.findMany({
      where: {
        locationLat: { gte: Math.min(a.lat, b.lat) - pad, lte: Math.max(a.lat, b.lat) + pad },
        locationLng: { gte: Math.min(a.lng, b.lng) - pad, lte: Math.max(a.lng, b.lng) + pad },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const CORRIDOR_KM = 2
    const now = Date.now()
    const onRoute = candidates
      .map(al => ({ al, km: distanceToSegmentKm({ lat: al.locationLat, lng: al.locationLng }, a, b) }))
      .filter(x => x.km <= CORRIDOR_KM)

    let score = 0
    for (const { al, km } of onRoute) {
      const proximity = 1 - (km / CORRIDOR_KM) * 0.6           // 1.0 on the line → 0.4 at the edge
      const ageH = (now - al.createdAt.getTime()) / HOURS
      const recency = ageH < 24 ? 1 : ageH < 72 ? 0.6 : 0.3
      score += (TYPE_WEIGHT[al.alertType] ?? 12) * proximity * recency
    }
    score = Math.min(100, Math.round(score))
    const level = riskLevel(score)

    const affecting = onRoute
      .sort((x, y) => x.km - y.km)
      .slice(0, 6)
      .map(({ al, km }) => ({
        id: al.id,
        title: al.title,
        alert_type: al.alertType,
        distance_km: Math.round(km * 10) / 10,
      }))

    const lengthKm = Math.round(routeLengthKm(a, b) * 10) / 10
    let summary = level === 'low'
      ? 'No significant disruptions detected along this route.'
      : `${affecting.length} active alert${affecting.length === 1 ? '' : 's'} near this route.`
    let advice: string[] = []
    let bestDeparture: string | null = null

    try {
      const alertText = onRoute.length === 0
        ? 'None.'
        : onRoute.slice(0, 8).map(({ al, km }) =>
            `- [${al.alertType}] ${al.title}: ${al.description} (${km.toFixed(1)} km from route)`).join('\n')

      const ai = await askJson<{ summary?: string; advice?: string[]; best_departure?: string }>(
        'You are SRANS, a commute risk analyst for Indian cities. Be specific, practical and brief.',
        `Route "${route.name}", straight-line length ${lengthKm} km.
Computed risk score: ${score}/100 (${level}).
Target arrival time: ${clampStr(req.body.arrival_time, 10, 'not specified')}.
${fenceData('alerts', alertText)}

Return JSON: {"summary": "one sentence, max 25 words", "advice": ["2-3 short actionable tips"], "best_departure": "e.g. 'Leave by 8:10 AM' or null"}`,
        { maxTokens: 300 }
      )
      if (ai) {
        summary = clampStr(ai.summary, 220, summary)
        advice = strList(ai.advice, 3, 140)
        bestDeparture = clampStr(ai.best_departure, 60) || null
      }
    } catch (err) {
      console.error('[route-risk] AI summary failed', err)
    }

    return res.json({
      route_id: route.id,
      score,
      level,
      length_km: lengthKm,
      summary,
      advice,
      best_departure: bestDeparture,
      alerts: affecting,
      generated_at: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[POST /ai/route-risk]', err)
    return res.status(500).json({ message: 'Failed to score route' })
  }
})

// ── POST /api/ai/explain-alert ────────────────────────────────────────────────
// Plain-language impact explanation of a single alert for commuters.
router.post('/explain-alert', authenticate, async (req: AuthRequest, res: any) => {
  try {
    const id = parseInt(req.body.alert_id)
    if (isNaN(id)) return res.status(400).json({ message: 'alert_id is required' })

    const alert = await prisma.alert.findUnique({ where: { id } })
    if (!alert) return res.status(404).json({ message: 'Alert not found' })

    const ai = await askJson<{
      impact?: string; who_affected?: string; expected_delay?: string; advice?: string[]
    }>(
      'You are SRANS, explaining road and safety alerts to everyday commuters in India in plain language.',
      `${fenceData('alert', `[${alert.alertType}] ${alert.title}\n${alert.description}\nLocation: ${alert.locationLat.toFixed(4)}, ${alert.locationLng.toFixed(4)}\nPosted: ${alert.createdAt.toISOString()}`)}

Return JSON: {"impact": "1-2 sentences on what this means for travel", "who_affected": "short phrase, e.g. 'Two-wheelers and buses on the east side'", "expected_delay": "short estimate like '10–20 min' or 'Avoid area'", "advice": ["2-3 short tips"]}`,
      { maxTokens: 300 }
    )

    if (!ai) return res.status(502).json({ message: 'AI could not explain this alert right now.' })

    return res.json({
      alert_id: alert.id,
      impact: clampStr(ai.impact, 400),
      who_affected: clampStr(ai.who_affected, 160),
      expected_delay: clampStr(ai.expected_delay, 60),
      advice: strList(ai.advice, 3, 160),
    })
  } catch (err) {
    console.error('[POST /ai/explain-alert]', err)
    return res.status(500).json({ message: 'Failed to explain alert' })
  }
})

// ── POST /api/ai/draft-alert ──────────────────────────────────────────────────
// Turns rough field notes into a structured alert (gov) or report (citizen).
router.post('/draft-alert', authenticate, async (req: AuthRequest, res: any) => {
  try {
    const notes = clampStr(req.body.notes, 1200)
    if (!notes) return res.status(400).json({ message: 'notes are required' })
    const mode = req.body.mode === 'report' ? 'report' : 'alert'

    const ai = await askJson<{
      title?: string; description?: string; alert_type?: string
      severity?: string; expected_duration?: string; broadcast_recommended?: boolean
    }>(
      mode === 'alert'
        ? 'You are SRANS, helping a government traffic/civic official publish a clear, official public alert for commuters.'
        : 'You are SRANS, helping a citizen write a clear incident report for city officials to review.',
      `${fenceData('notes', notes)}

Rewrite the notes as a concise ${mode}. Return JSON:
{"title": "max 70 chars, specific (road/area + issue)", "description": "max 280 chars, factual, include what, where, impact and any diversion", "alert_type": one of ${JSON.stringify(ALERT_TYPES)}, "severity": "low" | "moderate" | "high" | "critical", "expected_duration": "short estimate or 'Unknown'", "broadcast_recommended": true only for life-safety emergencies}`,
      { maxTokens: 400, temperature: 0.3 }
    )

    if (!ai) return res.status(502).json({ message: 'AI could not draft this right now.' })

    const type = ALERT_TYPES.includes(ai.alert_type as any) ? ai.alert_type : 'Traffic'
    const severity = ['low', 'moderate', 'high', 'critical'].includes(ai.severity ?? '') ? ai.severity : 'moderate'

    return res.json({
      title: clampStr(ai.title, 120, 'Untitled alert'),
      description: clampStr(ai.description, 500),
      alert_type: type,
      severity,
      expected_duration: clampStr(ai.expected_duration, 60, 'Unknown'),
      broadcast_recommended: ai.broadcast_recommended === true,
    })
  } catch (err) {
    console.error('[POST /ai/draft-alert]', err)
    return res.status(500).json({ message: 'Failed to draft alert' })
  }
})

// ── POST /api/ai/triage-report ────────────────────────────────────────────────
// Helps officials review a citizen report: credibility, severity, likely
// duplicates of existing alerts and a recommended action.
router.post('/triage-report', authenticate, requireGov, async (req: AuthRequest, res: any) => {
  try {
    const id = parseInt(req.body.report_id)
    if (isNaN(id)) return res.status(400).json({ message: 'report_id is required' })

    const report = await prisma.report.findUnique({ where: { id } })
    if (!report) return res.status(404).json({ message: 'Report not found' })

    const d = 0.02 // ≈ 2 km box
    const nearby = await prisma.alert.findMany({
      where: {
        locationLat: { gte: report.locationLat - d, lte: report.locationLat + d },
        locationLng: { gte: report.locationLng - d, lte: report.locationLng + d },
        createdAt: { gte: new Date(Date.now() - 72 * HOURS) },
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    })
    const reporterHistory = await prisma.report.groupBy({
      by: ['status'],
      where: { submittedBy: report.submittedBy, NOT: { id: report.id } },
      _count: { id: true },
    })
    const history = Object.fromEntries(reporterHistory.map(h => [h.status, h._count.id]))

    const ai = await askJson<{
      credibility?: number; severity?: string; suggested_type?: string
      duplicate_of?: number | null; recommendation?: string; reasoning?: string
      suggested_title?: string; suggested_description?: string
    }>(
      'You are SRANS, assisting a government official triaging citizen incident reports. Be impartial and concise.',
      `${fenceData('report', `Type: ${report.reportType}\nTitle: ${report.title}\nDescription: ${report.description}\nLocation: ${report.locationLat.toFixed(4)}, ${report.locationLng.toFixed(4)}\nSubmitted: ${report.createdAt.toISOString()}`)}
Reporter history: ${history.approved ?? 0} approved, ${history.rejected ?? 0} rejected, ${history.pending ?? 0} pending.
${fenceData('nearby_alerts', nearby.length ? nearby.map(n => `#${n.id} [${n.alertType}] ${n.title}: ${n.description}`).join('\n') : 'None in the last 72 hours.')}

Return JSON: {"credibility": 0-100, "severity": "low"|"moderate"|"high"|"critical", "suggested_type": one of ${JSON.stringify(ALERT_TYPES)}, "duplicate_of": alert id number if this report describes the same incident as a nearby alert, else null, "recommendation": "approve"|"reject"|"merge"|"needs_info", "reasoning": "max 40 words", "suggested_title": "clean official title, max 70 chars", "suggested_description": "clean official description, max 240 chars"}`,
      { maxTokens: 450, temperature: 0.2 }
    )

    if (!ai) return res.status(502).json({ message: 'AI triage unavailable right now.' })

    const duplicate = nearby.find(n => n.id === Number(ai.duplicate_of))
    return res.json({
      report_id: report.id,
      credibility: Math.max(0, Math.min(100, Math.round(Number(ai.credibility) || 0))),
      severity: ['low', 'moderate', 'high', 'critical'].includes(ai.severity ?? '') ? ai.severity : 'moderate',
      suggested_type: ALERT_TYPES.includes(ai.suggested_type as any) ? ai.suggested_type : report.reportType,
      duplicate_of: duplicate ? { id: duplicate.id, title: duplicate.title } : null,
      recommendation: ['approve', 'reject', 'merge', 'needs_info'].includes(ai.recommendation ?? '') ? ai.recommendation : 'needs_info',
      reasoning: clampStr(ai.reasoning, 300),
      suggested_title: clampStr(ai.suggested_title, 120, report.title),
      suggested_description: clampStr(ai.suggested_description, 500, report.description),
    })
  } catch (err) {
    console.error('[POST /ai/triage-report]', err)
    return res.status(500).json({ message: 'Failed to triage report' })
  }
})

// ── POST /api/ai/situation-report ─────────────────────────────────────────────
// Command-center summary of the whole region for government officials.
router.post('/situation-report', authenticate, requireGov, async (_req: AuthRequest, res: any) => {
  try {
    const since = new Date(Date.now() - 48 * HOURS)
    const [alerts, pendingReports] = await Promise.all([
      prisma.alert.findMany({ where: { createdAt: { gte: since } }, orderBy: { createdAt: 'desc' }, take: 30 }),
      prisma.report.findMany({ where: { status: 'pending' }, orderBy: { createdAt: 'desc' }, take: 10 }),
    ])

    const counts: Record<string, number> = {}
    alerts.forEach(a => { counts[a.alertType] = (counts[a.alertType] ?? 0) + 1 })

    if (alerts.length === 0 && pendingReports.length === 0) {
      return res.json({
        status: 'normal',
        headline: 'No new alerts or pending reports in the last 48 hours.',
        key_points: [],
        recommended_actions: ['Keep monitoring citizen reports and weather advisories.'],
        counts,
        pending_reports: 0,
        generated_at: new Date().toISOString(),
      })
    }

    const ai = await askJson<{
      status?: string; headline?: string; key_points?: string[]; recommended_actions?: string[]
    }>(
      'You are SRANS Command, briefing a city traffic and disaster-management control room. Be crisp, factual and operational.',
      `Window: last 48 hours. Alert counts by type: ${JSON.stringify(counts)}. Pending citizen reports: ${pendingReports.length}.
${fenceData('alerts', alerts.map(a => `#${a.id} [${a.alertType}] ${a.title}: ${a.description} @ ${a.locationLat.toFixed(3)},${a.locationLng.toFixed(3)}`).join('\n') || 'None.')}
${fenceData('pending_reports', pendingReports.map(r => `#${r.id} [${r.reportType}] ${r.title}`).join('\n') || 'None.')}

Return JSON: {"status": "normal"|"elevated"|"critical", "headline": "one sentence, max 22 words", "key_points": ["3-4 short bullet points naming specific incidents or clusters"], "recommended_actions": ["2-3 concrete actions for officials"]}`,
      { maxTokens: 500, temperature: 0.3 }
    )

    if (!ai) return res.status(502).json({ message: 'AI situation report unavailable right now.' })

    return res.json({
      status: ['normal', 'elevated', 'critical'].includes(ai.status ?? '') ? ai.status : 'elevated',
      headline: clampStr(ai.headline, 200),
      key_points: strList(ai.key_points, 4, 200),
      recommended_actions: strList(ai.recommended_actions, 3, 200),
      counts,
      pending_reports: pendingReports.length,
      generated_at: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[POST /ai/situation-report]', err)
    return res.status(500).json({ message: 'Failed to generate situation report' })
  }
})

// ── POST /api/ai/smart-search ─────────────────────────────────────────────────
// Natural-language search over current alerts ("flooding near the station",
// "anything blocking my way to the airport this morning").
router.post('/smart-search', authenticate, async (req: AuthRequest, res: any) => {
  try {
    const query = clampStr(req.body.query, 300)
    if (!query) return res.status(400).json({ message: 'query is required' })

    const alerts = await prisma.alert.findMany({ orderBy: { createdAt: 'desc' }, take: 60 })
    if (alerts.length === 0) return res.json({ answer: 'There are no active alerts right now.', alert_ids: [] })

    const ai = await askJson<{ answer?: string; alert_ids?: number[] }>(
      'You are SRANS search. Match a commuter\'s question to the most relevant alerts from the list.',
      `Question: ${fenceData('query', query)}
${fenceData('alerts', alerts.map(a => `#${a.id} [${a.alertType}] ${a.title}: ${a.description}`).join('\n'))}

Return JSON: {"answer": "1-2 sentence direct answer", "alert_ids": [ids of up to 8 relevant alerts, most relevant first; empty if none]}`,
      { maxTokens: 300, temperature: 0.1 }
    )
    if (!ai) return res.status(502).json({ message: 'AI search unavailable right now.' })

    const valid = new Set(alerts.map(a => a.id))
    return res.json({
      answer: clampStr(ai.answer, 400),
      alert_ids: (Array.isArray(ai.alert_ids) ? ai.alert_ids : []).map(Number).filter(id => valid.has(id)).slice(0, 8),
    })
  } catch (err) {
    console.error('[POST /ai/smart-search]', err)
    return res.status(500).json({ message: 'Smart search failed' })
  }
})

// ── POST /api/ai/analytics-insights ───────────────────────────────────────────
// Trend analysis over the last 14 days of alerts for the analytics page.
router.post('/analytics-insights', authenticate, requireGov, async (_req: AuthRequest, res: any) => {
  try {
    const since = new Date(Date.now() - 14 * 24 * HOURS)
    const alerts = await prisma.alert.findMany({
      where: { createdAt: { gte: since } },
      select: { alertType: true, locationLat: true, locationLng: true, createdAt: true, title: true },
    })
    if (alerts.length < 3) {
      return res.json({
        insights: ['Not enough data in the last 14 days to identify trends yet.'],
        forecast: null,
        generated_at: new Date().toISOString(),
      })
    }

    const byDay: Record<string, number> = {}
    const byHour: Record<string, number> = {}
    const byType: Record<string, number> = {}
    const cells: Record<string, number> = {}
    for (const a of alerts) {
      const day = a.createdAt.toISOString().slice(0, 10)
      byDay[day] = (byDay[day] ?? 0) + 1
      const h = a.createdAt.getHours()
      byHour[h] = (byHour[h] ?? 0) + 1
      byType[a.alertType] = (byType[a.alertType] ?? 0) + 1
      const cell = `${a.locationLat.toFixed(2)},${a.locationLng.toFixed(2)}`
      cells[cell] = (cells[cell] ?? 0) + 1
    }
    const topCells = Object.entries(cells).sort((x, y) => y[1] - x[1]).slice(0, 5)

    const ai = await askJson<{ insights?: string[]; forecast?: string }>(
      'You are SRANS Analytics, a data analyst for a city traffic and disaster-management department.',
      `Alert statistics for the last 14 days (aggregates only):
Per day: ${JSON.stringify(byDay)}
Per hour of day: ${JSON.stringify(byHour)}
Per type: ${JSON.stringify(byType)}
Top grid cells (lat,lng ≈1 km): ${JSON.stringify(topCells)}

Return JSON: {"insights": ["3-4 specific, quantified observations about trends, peaks and clusters"], "forecast": "one sentence on what to expect in the next 3 days and how to prepare"}`,
      { maxTokens: 400, temperature: 0.3 }
    )
    if (!ai) return res.status(502).json({ message: 'AI insights unavailable right now.' })

    return res.json({
      insights: strList(ai.insights, 4, 220),
      forecast: clampStr(ai.forecast, 260) || null,
      generated_at: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[POST /ai/analytics-insights]', err)
    return res.status(500).json({ message: 'Failed to generate insights' })
  }
})

export default router
