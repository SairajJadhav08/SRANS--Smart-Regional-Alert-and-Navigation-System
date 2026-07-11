import { Router } from 'express'
import { prisma } from '../config/db'
import { authenticate, requireGov } from '../middleware/auth'
import type { AuthRequest } from '../middleware/auth'

const router = Router()

const formatReport = (r: any) => ({
  id: r.id,
  title: r.title,
  description: r.description,
  report_type: r.reportType,
  location_lat: r.locationLat,
  location_lng: r.locationLng,
  status: r.status,
  submitted_by: r.submittedBy,
  promoted_to: r.promotedTo,
  review_note: r.reviewNote,
  created_at: r.createdAt,
  updated_at: r.updatedAt,
  user: r.user ? { username: r.user.username, email: r.user.email } : undefined,
})

// ── GET /api/reports ──────────────────────────────────────────────────────────
// Gov users see all reports; regular users see only their own
router.get('/', authenticate, async (req: AuthRequest, res: any) => {
  try {
    const isGov = (req.userRole?.isGovernment && req.userRole?.isVerified) || req.userRole?.isSuperuser
    const reports = await prisma.report.findMany({
      where: isGov ? {} : { submittedBy: req.userId },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { username: true, email: true } } },
    })
    return res.json(reports.map(formatReport))
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch reports' })
  }
})

// ── POST /api/reports ─────────────────────────────────────────────────────────
// Any logged-in user can submit a report
router.post('/', authenticate, async (req: AuthRequest, res: any) => {
  try {
    const { title, description, report_type, location_lat, location_lng } = req.body
    if (!title || !description || !location_lat || !location_lng) {
      return res.status(400).json({ message: 'title, description, location_lat, and location_lng are required' })
    }
    const VALID_TYPES = ['Traffic', 'Emergency', 'Construction', 'Weather', 'Other']
    const type = VALID_TYPES.includes(report_type) ? report_type : 'Other'

    const report = await prisma.report.create({
      data: {
        title: title.slice(0, 120),
        description: description.slice(0, 500),
        reportType: type,
        locationLat: parseFloat(location_lat),
        locationLng: parseFloat(location_lng),
        submittedBy: req.userId!,
      },
      include: { user: { select: { username: true, email: true } } },
    })
    return res.status(201).json(formatReport(report))
  } catch (err) {
    console.error('[POST /reports]', err)
    return res.status(500).json({ message: 'Failed to submit report' })
  }
})

// ── POST /api/reports/:id/approve ─────────────────────────────────────────────
// Gov user: approve report and auto-promote to official alert
router.post('/:id/approve', authenticate, requireGov, async (req: AuthRequest, res: any) => {
  try {
    const id = parseInt(req.params.id as string)
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid report ID' })

    const report = await prisma.report.findUnique({ where: { id } })
    if (!report) return res.status(404).json({ message: 'Report not found' })

    // Create official alert from report
    const alert = await prisma.alert.create({
      data: {
        title: report.title,
        description: `[Citizen Report] ${report.description}`,
        alertType: report.reportType === 'Other' ? 'Emergency' : report.reportType,
        locationLat: report.locationLat,
        locationLng: report.locationLng,
        authorId: req.userId!,
      },
    })

    // Mark report as approved and link to new alert
    const updated = await prisma.report.update({
      where: { id },
      data: { status: 'approved', promotedTo: alert.id, reviewNote: req.body.note || null },
      include: { user: { select: { username: true, email: true } } },
    })

    return res.json({ report: formatReport(updated), alert_id: alert.id })
  } catch (err) {
    console.error('[POST /reports/:id/approve]', err)
    return res.status(500).json({ message: 'Failed to approve report' })
  }
})

// ── POST /api/reports/:id/reject ──────────────────────────────────────────────
router.post('/:id/reject', authenticate, requireGov, async (req: AuthRequest, res: any) => {
  try {
    const id = parseInt(req.params.id as string)
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid report ID' })

    const updated = await prisma.report.update({
      where: { id },
      data: { status: 'rejected', reviewNote: req.body.note || null },
      include: { user: { select: { username: true, email: true } } },
    })
    return res.json(formatReport(updated))
  } catch (err) {
    return res.status(500).json({ message: 'Failed to reject report' })
  }
})

// ── DELETE /api/reports/:id ───────────────────────────────────────────────────
router.delete('/:id', authenticate, async (req: AuthRequest, res: any) => {
  try {
    const id = parseInt(req.params.id as string)
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid report ID' })

    const report = await prisma.report.findUnique({ where: { id } })
    if (!report) return res.status(404).json({ message: 'Report not found' })

    const isGov = (req.userRole?.isGovernment && req.userRole?.isVerified) || req.userRole?.isSuperuser
    if (report.submittedBy !== req.userId && !isGov) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    await prisma.report.delete({ where: { id } })
    return res.json({ message: 'Report deleted' })
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete report' })
  }
})

export default router
