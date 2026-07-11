import type { Request, Response, NextFunction } from 'express'

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[Error]', err.message)
  res.status(500).json({ message: 'Internal server error' })
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ message: 'Route not found' })
}
