import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import authRouter from './routes/auth'
import alertsRouter from './routes/alerts'
import routesRouter from './routes/routes'
import aiRouter from './routes/ai'
import contactRouter from './routes/contact'
import analyticsRouter from './routes/analytics'
import reportsRouter from './routes/reports'
import { errorHandler, notFound } from './middleware/errorHandler'

const app = express()
const PORT = process.env.PORT ?? 5000

// ── Security & Logging ────────────────────────────────────────────────────────
app.use(helmet())
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL ?? 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:4173',
]

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`))
      }
    },
    credentials: true,
  })
)

// ── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter)
app.use('/api/alerts', alertsRouter)
app.use('/api/routes', routesRouter)
app.use('/api/ai', aiRouter)
app.use('/api/contact', contactRouter)
app.use('/api/analytics', analyticsRouter)
app.use('/api/reports', reportsRouter)

// ── 404 & Error Handlers ──────────────────────────────────────────────────────
app.use(notFound)
app.use(errorHandler)

// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`SRANS backend running on http://localhost:${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV ?? 'development'}`)
})
