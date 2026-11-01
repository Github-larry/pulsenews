// middleware/index.ts
// All Express middleware — auth, security, validation, error handling
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import slowDown  from 'express-slow-down';
import { verifyAccessToken } from '../utils/jwt';
import { sendError }         from '../utils/response';
import { AuthRequest, AuthPayload } from '../types';
import { logger }            from '../config/logger';
import { Role }              from '@prisma/client';
import { env }               from '../config/env';

// ── Validation error handler ──────────────────────────────────
export function validateRequest(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map(e => ({
      field:   'path' in e ? String(e.path) : 'unknown',
      message: e.msg as string,
    }));
    sendError(res, 'Validation failed', 422, formatted);
    return;
  }
  next();
}

// ── JWT Authentication ────────────────────────────────────────
export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    sendError(res, 'Authentication required', 401); return;
  }
  const token = authHeader.slice(7);
  if (!token || token.length > 1000) {
    sendError(res, 'Invalid token format', 401); return;
  }
  try {
    const payload = verifyAccessToken(token);
    req.user = payload as AuthPayload;
    next();
  } catch {
    sendError(res, 'Invalid or expired token', 401);
  }
}

// ── Optional auth ─────────────────────────────────────────────
export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    if (token && token.length <= 1000) {
      try {
        req.user = verifyAccessToken(token) as AuthPayload;
      } catch { /* silent — optional auth */ }
    }
  }
  next();
}

// ── Role authorization ────────────────────────────────────────
export function authorize(...roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) { sendError(res, 'Authentication required', 401); return; }
    if (!roles.includes(req.user.role)) {
      sendError(res, 'Insufficient permissions', 403); return;
    }
    next();
  };
}

// ── Rate limiters ─────────────────────────────────────────────

// General API — 100 requests per 15 minutes
export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max:      env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  skip: () => env.IS_DEV,
});

// Auth endpoints — 10 attempts per 15 minutes
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  standardHeaders: true,
  legacyHeaders:   false,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many auth attempts. Please wait 15 minutes.' },
});

// Slow down repeated requests
export const speedLimiter = slowDown({
  windowMs:  15 * 60 * 1000,
  delayAfter: 50,
  delayMs: (hits) => hits * 100,
});

// ── Upload error handler ──────────────────────────────────────
export function handleUploadError(err: Error, _req: Request, res: Response, next: NextFunction): void {
  if (err.message.includes('Only') || err.message.includes('image')) {
    sendError(res, err.message, 400); return;
  }
  if (err.message.includes('too large') || err.message.includes('File size')) {
    sendError(res, 'File size exceeds the maximum allowed size', 400); return;
  }
  next(err);
}

// ── Global error handler ──────────────────────────────────────
export function globalErrorHandler(
  err: Error & { statusCode?: number; code?: string },
  req: Request, res: Response, _next: NextFunction
): void {
  logger.error({
    message: err.message,
    stack:   err.stack,
    url:     req.url,
    method:  req.method,
    ip:      req.ip,
  });

  // Prisma unique constraint
  if (err.code === 'P2002') { sendError(res, 'A record with this value already exists', 409); return; }
  // Prisma record not found
  if (err.code === 'P2025') { sendError(res, 'Record not found', 404); return; }
  // Prisma invalid ID
  if (err.code === 'P2023') { sendError(res, 'Invalid ID format', 400); return; }

  const statusCode = err.statusCode ?? 500;
  const message    = env.IS_PROD && statusCode === 500
    ? 'An unexpected error occurred'
    : err.message;

  sendError(res, message, statusCode);
}

// ── 404 handler ───────────────────────────────────────────────
export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, `Route ${req.method} ${req.url} not found`, 404);
}
