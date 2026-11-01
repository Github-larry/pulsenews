// routes/auth.routes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { asyncHandler }   from '../utils/asyncHandler';
import { authenticate, authRateLimiter, validateRequest, handleUploadError } from '../middleware';
import { registerValidator, loginValidator } from '../validators';
import { uploadAvatar }   from '../utils/upload';
import * as auth from '../controllers/auth.controller';

const router = Router();

function withUpload(middleware: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    (middleware as Function)(req, res, (err: Error) => {
      if (err) return handleUploadError(err, req, res, next);
      next();
    });
  };
}

// ── Public ────────────────────────────────────────────────────
router.post('/register', authRateLimiter, registerValidator, validateRequest, asyncHandler(auth.register));
router.post('/login',    authRateLimiter, loginValidator,    validateRequest, asyncHandler(auth.login));
router.post('/refresh',  asyncHandler(auth.refresh));
router.post('/logout',   asyncHandler(auth.logout));

// ── Authenticated ─────────────────────────────────────────────
router.post('/logout-all', authenticate, asyncHandler(auth.logoutAll));
router.get('/me',          authenticate, asyncHandler(auth.getMe));
router.patch('/me',        authenticate, asyncHandler(auth.updateMe));
router.patch('/profile',   authenticate, asyncHandler(auth.updateMe));  // alias
router.patch('/avatar',    authenticate, withUpload(uploadAvatar), asyncHandler(auth.updateAvatar));

export default router;
