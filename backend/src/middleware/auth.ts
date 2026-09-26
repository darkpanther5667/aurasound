import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, AuthUserPayload, ApiResponse } from '../types/index.js';
import { prisma } from '../lib/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'aurasound-jwt-secret-key-change-in-production';
const DEFAULT_GUEST_EMAIL = 'guest@aurasound.internal';
let cachedGuestUserId: string | null = null;

export async function getOrCreateGuestUser(): Promise<AuthUserPayload> {
  if (cachedGuestUserId) {
    return { userId: cachedGuestUserId, email: DEFAULT_GUEST_EMAIL };
  }
  let guest = await prisma.user.findUnique({ where: { email: DEFAULT_GUEST_EMAIL } });
  if (!guest) {
    guest = await prisma.user.create({
      data: {
        email: DEFAULT_GUEST_EMAIL,
        password_hash: '$2a$10$aurasound_guest_account_placeholder_hash'
      }
    });
  }
  cachedGuestUserId = guest.id;
  return { userId: guest.id, email: guest.email };
}

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    try {
      req.user = await getOrCreateGuestUser();
      next();
      return;
    } catch (err) {
      console.error('Guest auth error:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to initialize session'
      });
      return;
    }
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUserPayload;
    req.user = decoded;
    next();
  } catch (err) {
    // If token invalid, fall back to guest session
    try {
      req.user = await getOrCreateGuestUser();
      next();
    } catch {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired authentication token'
      });
    }
  }
};

export const optionalAuth = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUserPayload;
      req.user = decoded;
    } catch {
      // Ignored for optional auth
    }
  }
  next();
};
