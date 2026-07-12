import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import { prisma } from '../config/db'
import { authenticate } from '../middleware/auth'
import type { AuthRequest } from '../middleware/auth'

const router = Router()

// ── Helper: format route for response ────────────────────────────────────────
const formatRoute = (r: {
  id: number
  name: string
  startLat: number
  startLng: number
  endLat: number
  endLng: number
  userId: number
  createdAt: Date
}) => ({
  id: r.id,
  name: r.name,
  start_lat: r.startLat,
  start_lng: r.startLng,
  end_lat: r.endLat,
  end_lng: r.endLng,
  user_id: r.userId,
  created_at: r.createdAt,
})

// ── GET /api/routes ───────────────────────────────────────────────────────────
router.get('/', authenticate, async (req: AuthRequest, res: any) => {
  try {
    const routes = await prisma.savedRoute.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    })
    return res.json(routes.map(formatRoute))
  } catch (err) {
    console.error('[GET /routes]', err)
    return res.status(500).json({ message: 'Failed to fetch routes' })
  }
})

// ── POST /api/routes ──────────────────────────────────────────────────────────
router.post(
  '/',
  authenticate,
  [
    body('name').trim().notEmpty().withMessage('Route name is required'),
    body('start_lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid start latitude'),
    body('start_lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid start longitude'),
    body('end_lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid end latitude'),
    body('end_lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid end longitude'),
  ],
  async (req: AuthRequest, res: any) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0]?.msg })
    }

    try {
      const { name, start_lat, start_lng, end_lat, end_lng } = req.body
      const route = await prisma.savedRoute.create({
        data: {
          name,
          startLat: parseFloat(start_lat),
          startLng: parseFloat(start_lng),
          endLat: parseFloat(end_lat),
          endLng: parseFloat(end_lng),
          userId: req.userId!,
        },
      })
      return res.status(201).json(formatRoute(route))
    } catch (err) {
      console.error('[POST /routes]', err)
      return res.status(500).json({ message: 'Failed to save route' })
    }
  }
)

// ── DELETE /api/routes/:id ────────────────────────────────────────────────────
router.delete('/:id', authenticate, async (req: AuthRequest, res: any) => {
  try {
    const id = parseInt(req.params.id as string)
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid route ID' })

    const route = await prisma.savedRoute.findUnique({ where: { id } })
    if (!route) return res.status(404).json({ message: 'Route not found' })

    if (route.userId !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this route' })
    }

    await prisma.savedRoute.delete({ where: { id } })
    return res.json({ message: 'Route deleted successfully' })
  } catch (err) {
    console.error('[DELETE /routes/:id]', err)
    return res.status(500).json({ message: 'Failed to delete route' })
  }
})

export default router
