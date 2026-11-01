// src/routes/admin.routes.ts
import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, authorize, validateRequest } from '../middleware';
import { paginationValidator } from '../validators';
import { body } from 'express-validator';
import * as admin from '../controllers/admin.controller';

const router = Router();

// All admin routes require authentication + ADMIN role
router.use(authenticate, authorize('ADMIN'));

// ── Dashboard & stats ─────────────────────────────────────────
router.get('/dashboard', asyncHandler(admin.getDashboard));
// /stats alias — used by frontend useAdminStats hook
router.get('/stats',     asyncHandler(admin.getDashboard));

// ── Post management ───────────────────────────────────────────
router.get('/posts',  paginationValidator, validateRequest, asyncHandler(admin.adminGetPosts));
router.patch(
  '/posts/:id/moderate',
  body('status').isIn(['APPROVED', 'REJECTED', 'PENDING']).withMessage('Invalid status'),
  validateRequest,
  asyncHandler(admin.moderatePost)
);
router.delete('/posts/:id', asyncHandler(admin.adminDeletePost));

// ── User management ───────────────────────────────────────────
router.get('/users',  paginationValidator, validateRequest, asyncHandler(admin.adminGetUsers));
router.patch(
  '/users/:id/status',
  body('status').isIn(['ACTIVE', 'BANNED', 'SUSPENDED']).withMessage('Invalid status'),
  validateRequest,
  asyncHandler(admin.updateUserStatus)
);

// ── Reports ───────────────────────────────────────────────────
router.get('/reports', paginationValidator, validateRequest, asyncHandler(admin.getReports));
// PATCH /reports/:id — body contains { status: 'RESOLVED' | 'DISMISSED' }
router.patch(
  '/reports/:id',
  body('status').isIn(['RESOLVED', 'DISMISSED']).withMessage('Invalid status'),
  validateRequest,
  asyncHandler(admin.resolveReport)
);
// Alias: frontend calls PATCH /reports/:id/resolve (no body needed)
router.patch('/reports/:id/resolve', asyncHandler(admin.resolveReportAlias));

export default router;
