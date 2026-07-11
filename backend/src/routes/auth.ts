import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../config/db'
import { authenticate, requireSuperuser } from '../middleware/auth'
import type { AuthRequest } from '../middleware/auth'

const router = Router()

// ── Helper: format user for response ─────────────────────────────────────────
const formatUser = (user: {
  id: number
  username: string
  email: string
  isGovernment: boolean
  isVerified: boolean
  isSuperuser: boolean
  agencyName: string | null
  department: string | null
}) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  is_government: user.isGovernment,
  is_verified: user.isVerified,
  is_superuser: user.isSuperuser,
  agency_name: user.agencyName,
  department: user.department,
})

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post(
  '/register',
  [
    body('username').trim().isLength({ min: 4 }).withMessage('Username must be at least 4 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('user_type').isIn(['user', 'government']).withMessage('Invalid user type'),
  ],
  async (req: AuthRequest, res: any) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0]?.msg })
    }

    const { username, email, password, user_type, agency_name, department } = req.body

    try {
      const exists = await prisma.user.findFirst({
        where: { OR: [{ username }, { email }] },
      })
      if (exists) {
        return res.status(409).json({ message: 'Username or email already taken' })
      }

      const passwordHash = await bcrypt.hash(password, 12)
      const user = await prisma.user.create({
        data: {
          username,
          email,
          passwordHash,
          isGovernment: user_type === 'government',
          agencyName: agency_name ?? null,
          department: department ?? null,
        },
      })

      return res.status(201).json({ message: 'Account created successfully', userId: user.id })
    } catch (err) {
      console.error('[register]', err)
      return res.status(500).json({ message: 'Registration failed. Please try again.' })
    }
  }
)

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req: AuthRequest, res: any) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password required' })
  }

  try {
    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return res.status(401).json({ message: 'Invalid username or password' })
    }

    const token = jwt.sign(
      {
        userId: user.id,
        isGovernment: user.isGovernment,
        isVerified: user.isVerified,
        isSuperuser: user.isSuperuser,
      },
      process.env.JWT_SECRET!,
      { expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as any }
    )

    return res.json({ token, user: formatUser(user) })
  } catch (err) {
    console.error('[login]', err)
    return res.status(500).json({ message: 'Login failed. Please try again.' })
  }
})

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
// Stateless JWT — client simply drops the token. We just acknowledge.
router.post('/logout', authenticate, (_req, res: any) => {
  return res.json({ message: 'Logged out successfully' })
})

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', authenticate, async (req: AuthRequest, res: any) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user) return res.status(404).json({ message: 'User not found' })
    return res.json(formatUser(user))
  } catch (err) {
    console.error('[me]', err)
    return res.status(500).json({ message: 'Failed to fetch user' })
  }
})

// ── GET /api/auth/admin/gov-users ─────────────────────────────────────────────
router.get(
  '/admin/gov-users',
  authenticate,
  requireSuperuser,
  async (_req, res: any) => {
    try {
      const users = await prisma.user.findMany({
        where: { isGovernment: true },
        orderBy: { createdAt: 'desc' },
      })
      return res.json(
        users.map(u => ({
          ...formatUser(u),
          created_at: u.createdAt,
        }))
      )
    } catch (err) {
      console.error('[admin/gov-users]', err)
      return res.status(500).json({ message: 'Failed to fetch government users' })
    }
  }
)

// ── POST /api/auth/admin/gov-users/:id/approve ────────────────────────────────
router.post(
  '/admin/gov-users/:id/approve',
  authenticate,
  requireSuperuser,
  async (req: AuthRequest, res: any) => {
    try {
      const id = parseInt(req.params.id!)
      if (isNaN(id)) return res.status(400).json({ message: 'Invalid user ID' })
      await prisma.user.update({ where: { id }, data: { isVerified: true } })
      return res.json({ message: 'Government user approved' })
    } catch (err) {
      console.error('[approve]', err)
      return res.status(500).json({ message: 'Failed to approve user' })
    }
  }
)

// ── POST /api/auth/admin/gov-users/:id/revoke ─────────────────────────────────
router.post(
  '/admin/gov-users/:id/revoke',
  authenticate,
  requireSuperuser,
  async (req: AuthRequest, res: any) => {
    try {
      const id = parseInt(req.params.id!)
      if (isNaN(id)) return res.status(400).json({ message: 'Invalid user ID' })
      await prisma.user.update({ where: { id }, data: { isVerified: false } })
      return res.json({ message: 'Government user revoked' })
    } catch (err) {
      console.error('[revoke]', err)
      return res.status(500).json({ message: 'Failed to revoke user' })
    }
  }
)

export default router
