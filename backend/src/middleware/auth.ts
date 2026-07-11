import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  userId?: number
  userRole?: {
    isGovernment: boolean
    isVerified: boolean
    isSuperuser: boolean
  }
}

interface JwtPayload {
  userId: number
  isGovernment: boolean
  isVerified: boolean
  isSuperuser: boolean
}

export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No token provided' })
    return
  }

  const token = header.split(' ')[1]!
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
    req.userId = decoded.userId
    req.userRole = {
      isGovernment: decoded.isGovernment,
      isVerified: decoded.isVerified,
      isSuperuser: decoded.isSuperuser,
    }
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' })
  }
}

export function requireGov(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.userRole?.isGovernment) {
    res.status(403).json({ message: 'Government account required' })
    return
  }
  if (!req.userRole.isVerified) {
    res.status(403).json({ message: 'Your government account is pending verification' })
    return
  }
  next()
}

export function requireSuperuser(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.userRole?.isSuperuser) {
    res.status(403).json({ message: 'Superuser access required' })
    return
  }
  next()
}
