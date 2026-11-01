// src/routes/index.ts — Mounts all sub-routers
import { Router } from 'express';
import authRoutes from './auth.routes';
import postRoutes from './posts.routes';
import adminRoutes from './admin.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/posts', postRoutes);
router.use('/admin', adminRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'PulseNews API is running', timestamp: new Date().toISOString() });
});

export default router;
