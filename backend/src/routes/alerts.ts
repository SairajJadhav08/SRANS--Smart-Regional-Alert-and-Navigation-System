import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import jwt from 'jsonwebtoken'
import { prisma } from '../config/db'
import { authenticate, requireGov } from '../middleware/auth'
import type { AuthRequest } from '../middleware/auth'

const router = Router()

// ── Helper: format alert for response ────────────────────────────────────────
const formatAlert = (a: {
  id: number
  title: string
  description: string
  alertType: string
  locationLat: number
  locationLng: number
  isBroadcast: boolean
  authorId: number
  createdAt: Date
  updatedAt: Date
}) => ({
  id: a.id,
  title: a.title,
  description: a.description,
  alert_type: a.alertType,
  location_lat: a.locationLat,
  location_lng: a.locationLng,
  is_broadcast: a.isBroadcast,
  author_id: a.authorId,
  created_at: a.createdAt,
  updated_at: a.updatedAt,
})

// ── Validation rules ──────────────────────────────────────────────────────────
const alertValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('alert_type')
    .isIn(['Traffic', 'Emergency', 'Construction', 'Weather'])
    .withMessage('alert_type must be Traffic, Emergency, Construction, or Weather'),
  body('location_lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),
  body('location_lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude'),
]

// ── GET /api/alerts ───────────────────────────────────────────────────────────
// Public. Optional query params: ?type=Traffic  &author_only=true
router.get('/', async (req: AuthRequest, res: any) => {
  try {
    const { type, author_only } = req.query

    // Soft-auth: try to extract userId from token if present (for author_only)
    let userId: number | undefined
    const header = req.headers.authorization
    if (header?.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(
          header.split(' ')[1]!,
          process.env.JWT_SECRET!
        ) as { userId: number }
        userId = decoded.userId
      } catch {
        // unauthenticated — fine for public listing
      }
    }

    const where: Record<string, any> = {}
    if (type && typeof type === 'string') where.alertType = type
    if (author_only === 'true' && userId) where.authorId = userId

    const alerts = await prisma.alert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return res.json(alerts.map(formatAlert))
  } catch (err) {
    console.error('[GET /alerts]', err)
    return res.status(500).json({ message: 'Failed to fetch alerts' })
  }
})

// ── GET /api/alerts/:id ───────────────────────────────────────────────────────
router.get('/:id', async (req: AuthRequest, res: any) => {
  try {
    const id = parseInt(req.params.id as string)
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid alert ID' })

    const alert = await prisma.alert.findUnique({ where: { id } })
    if (!alert) return res.status(404).json({ message: 'Alert not found' })

    return res.json(formatAlert(alert))
  } catch (err) {
    console.error('[GET /alerts/:id]', err)
    return res.status(500).json({ message: 'Failed to fetch alert' })
  }
})

// ── POST /api/alerts/broadcast ────────────────────────────────────────────────
// Superuser only. Creates a critical broadcast alert visible to all users.
router.post('/broadcast', authenticate, async (req: AuthRequest, res: any) => {
  try {
    if (!req.userRole?.isSuperuser) {
      return res.status(403).json({ message: 'Superuser access required' })
    }
    const { title, description, alert_type, location_lat, location_lng } = req.body
    if (!title || !description) {
      return res.status(400).json({ message: 'title and description are required' })
    }
    const alert = await prisma.alert.create({
      data: {
        title: `🚨 BROADCAST: ${title}`,
        description,
        alertType: alert_type || 'Emergency',
        locationLat: parseFloat(location_lat) || 18.5204,
        locationLng: parseFloat(location_lng) || 73.8567,
        authorId: req.userId!,
        isBroadcast: true,
      },
    })
    return res.status(201).json(formatAlert(alert))
  } catch (err) {
    console.error('[POST /alerts/broadcast]', err)
    return res.status(500).json({ message: 'Failed to send broadcast' })
  }
})

// ── GET /api/alerts/broadcast/active ─────────────────────────────────────────
// Returns the most recent broadcast alert if any exists
router.get('/broadcast/active', async (_req, res: any) => {
  try {
    const broadcast = await prisma.alert.findFirst({
      where: { isBroadcast: true },
      orderBy: { createdAt: 'desc' },
    })
    return res.json(broadcast ? formatAlert(broadcast) : null)
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch broadcast' })
  }
})

// ── POST /api/alerts/bulk-delete ──────────────────────────────────────────────
// Must be registered BEFORE /:id to avoid route conflict
router.post(
  '/bulk-delete',
  authenticate,
  requireGov,
  async (req: AuthRequest, res: any) => {
    try {
      const { ids } = req.body
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'ids must be a non-empty array' })
      }

      // Gov users can only bulk-delete their own alerts; superusers can delete any
      const where: Record<string, any> = { id: { in: ids } }
      if (!req.userRole?.isSuperuser) {
        where.authorId = req.userId
      }

      const { count } = await prisma.alert.deleteMany({ where })
      return res.json({ message: `${count} alert(s) deleted` })
    } catch (err) {
      console.error('[bulk-delete]', err)
      return res.status(500).json({ message: 'Bulk delete failed' })
    }
  }
)

// ── POST /api/alerts ──────────────────────────────────────────────────────────
router.post(
  '/',
  authenticate,
  requireGov,
  alertValidation,
  async (req: AuthRequest, res: any) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0]?.msg })
    }

    try {
      const { title, description, alert_type, location_lat, location_lng } = req.body
      const alert = await prisma.alert.create({
        data: {
          title,
          description,
          alertType: alert_type,
          locationLat: parseFloat(location_lat),
          locationLng: parseFloat(location_lng),
          authorId: req.userId!,
        },
      })
      return res.status(201).json(formatAlert(alert))
    } catch (err) {
      console.error('[POST /alerts]', err)
      return res.status(500).json({ message: 'Failed to create alert' })
    }
  }
)

// ── PUT /api/alerts/:id ───────────────────────────────────────────────────────
router.put(
  '/:id',
  authenticate,
  requireGov,
  alertValidation,
  async (req: AuthRequest, res: any) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0]?.msg })
    }

    try {
      const id = parseInt(req.params.id as string)
      if (isNaN(id)) return res.status(400).json({ message: 'Invalid alert ID' })

      const existing = await prisma.alert.findUnique({ where: { id } })
      if (!existing) return res.status(404).json({ message: 'Alert not found' })

      if (existing.authorId !== req.userId && !req.userRole?.isSuperuser) {
        return res.status(403).json({ message: 'Not authorized to edit this alert' })
      }

      const { title, description, alert_type, location_lat, location_lng } = req.body
      const updated = await prisma.alert.update({
        where: { id },
        data: {
          title,
          description,
          alertType: alert_type,
          locationLat: parseFloat(location_lat),
          locationLng: parseFloat(location_lng),
        },
      })
      return res.json(formatAlert(updated))
    } catch (err) {
      console.error('[PUT /alerts/:id]', err)
      return res.status(500).json({ message: 'Failed to update alert' })
    }
  }
)

// ── DELETE /api/alerts/:id ────────────────────────────────────────────────────
router.delete('/:id', authenticate, requireGov, async (req: AuthRequest, res: any) => {
  try {
    const id = parseInt(req.params.id as string)
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid alert ID' })

    const existing = await prisma.alert.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ message: 'Alert not found' })

    if (existing.authorId !== req.userId && !req.userRole?.isSuperuser) {
      return res.status(403).json({ message: 'Not authorized to delete this alert' })
    }

    await prisma.alert.delete({ where: { id } })
    return res.json({ message: 'Alert deleted successfully' })
  } catch (err) {
    console.error('[DELETE /alerts/:id]', err)
    return res.status(500).json({ message: 'Failed to delete alert' })
  }
})

export default router
