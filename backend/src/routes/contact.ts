import { Router } from 'express'
import { body, validationResult } from 'express-validator'

const router = Router()

// ── POST /api/contact ─────────────────────────────────────────────────────────
router.post(
  '/',
  [
    body('data.name').trim().notEmpty().withMessage('Name is required'),
    body('data.email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('data.message').trim().notEmpty().withMessage('Message is required'),
  ],
  async (req: any, res: any) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0]?.msg })
    }

    const { name, email, subject, message } = req.body.data

    // Log the submission — swap in nodemailer / Resend here when ready
    console.log(`[Contact] ${new Date().toISOString()}`)
    console.log(`  From:    ${name} <${email}>`)
    console.log(`  Subject: ${subject ?? 'General Inquiry'}`)
    console.log(`  Message: ${message}`)

    return res.json({ message: 'Message received. We will get back to you shortly.' })
  }
)

export default router
