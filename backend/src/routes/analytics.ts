import { Router } from 'express'
import { prisma } from '../config/db'
import { authenticate, requireGov } from '../middleware/auth'
import type { AuthRequest } from '../middleware/auth'

const router = Router()

// ── GET /api/analytics/summary ────────────────────────────────────────────────
router.get('/summary', authenticate, requireGov, async (_req, res: any) => {
  try {
    const [totalAlerts, totalUsers, totalRoutes, totalReports] = await Promise.all([
      prisma.alert.count(),
      prisma.user.count({ where: { isGovernment: false, isSuperuser: false } }),
      prisma.savedRoute.count(),
      prisma.report.count(),
    ])
    return res.json({ totalAlerts, totalUsers, totalRoutes, totalReports })
  } catch (err) {
    console.error('[GET /analytics/summary]', err)
    return res.status(500).json({ message: 'Failed to fetch summary' })
  }
})

// ── GET /api/analytics/by-type ────────────────────────────────────────────────
router.get('/by-type', authenticate, requireGov, async (_req, res: any) => {
  try {
    const alerts = await prisma.alert.groupBy({
      by: ['alertType'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    })
    return res.json(alerts.map(a => ({ type: a.alertType, count: a._count.id })))
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch by-type stats' })
  }
})

// ── GET /api/analytics/weekly ─────────────────────────────────────────────────
// Returns alert counts per day for the last 7 days
router.get('/weekly', authenticate, requireGov, async (_req, res: any) => {
  try {
    const since = new Date()
    since.setDate(since.getDate() - 6)
    since.setHours(0, 0, 0, 0)

    const alerts = await prisma.alert.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    })

    // Build a map of date → count for last 7 days
    const days: Record<string, number> = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days[d.toISOString().slice(0, 10)] = 0
    }
    alerts.forEach(a => {
      const key = a.createdAt.toISOString().slice(0, 10)
      if (key in days) days[key]++
    })

    return res.json(Object.entries(days).map(([date, count]) => ({ date, count })))
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch weekly stats' })
  }
})

// ── GET /api/analytics/hotspots ───────────────────────────────────────────────
// Returns top 5 alerts by location cluster (rounded to 2 decimal places)
router.get('/hotspots', authenticate, requireGov, async (_req, res: any) => {
  try {
    const alerts = await prisma.alert.findMany({
      select: { locationLat: true, locationLng: true, alertType: true, title: true },
    })

    // Cluster by rounding coords to 2 decimal places (~1.1km grid)
    const clusters: Record<string, { lat: number; lng: number; count: number; types: string[] }> = {}
    alerts.forEach(a => {
      const key = `${a.locationLat.toFixed(2)},${a.locationLng.toFixed(2)}`
      if (!clusters[key]) clusters[key] = { lat: a.locationLat, lng: a.locationLng, count: 0, types: [] }
      clusters[key].count++
      if (!clusters[key].types.includes(a.alertType)) clusters[key].types.push(a.alertType)
    })

    const hotspots = Object.values(clusters)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)

    return res.json(hotspots)
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch hotspots' })
  }
})

// ── GET /api/analytics/recent-activity ────────────────────────────────────────
router.get('/recent-activity', authenticate, requireGov, async (_req, res: any) => {
  try {
    const [recentAlerts, recentReports] = await Promise.all([
      prisma.alert.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { author: { select: { username: true, agencyName: true } } },
      }),
      prisma.report.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { user: { select: { username: true } } },
      }),
    ])
    return res.json({
      recentAlerts: recentAlerts.map(a => ({
        id: a.id, title: a.title, type: a.alertType,
        author: a.author.agencyName || a.author.username,
        createdAt: a.createdAt,
      })),
      recentReports: recentReports.map(r => ({
        id: r.id, title: r.title, type: r.reportType,
        status: r.status, submittedBy: r.user.username,
        createdAt: r.createdAt,
      })),
    })
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch recent activity' })
  }
})

export default router
