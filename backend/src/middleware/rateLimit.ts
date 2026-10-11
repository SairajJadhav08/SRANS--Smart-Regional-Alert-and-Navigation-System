import type { Request, Response, NextFunction } from 'express'

// Minimal in-memory fixed-window rate limiter keyed by client IP. Good enough
// for a single server instance; swap for a shared store if the API scales out.
export function rateLimit({ windowMs, max }: { windowMs: number; max: number }) {
  const hits = new Map<string, { count: number; resetAt: number }>()

  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now()
    const key = req.ip ?? 'unknown'
    let entry = hits.get(key)

    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs }
      hits.set(key, entry)
      // Opportunistic cleanup so the map does not grow unbounded
      if (hits.size > 5000) {
        for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k)
      }
    }

    entry.count++
    res.setHeader('RateLimit-Limit', String(max))
    res.setHeader('RateLimit-Remaining', String(Math.max(0, max - entry.count)))

    if (entry.count > max) {
      res.setHeader('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)))
      res.status(429).json({ message: 'Too many AI requests. Please wait a moment and try again.' })
      return
    }
    next()
  }
}
