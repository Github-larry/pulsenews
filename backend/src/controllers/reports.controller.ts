// controllers/reports.controller.ts
// Handles: create report
import { Response } from 'express';
import xss from 'xss';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../types';

const VALID_REASONS = ['SPAM', 'MISINFORMATION', 'HATE_SPEECH', 'VIOLENCE', 'COPYRIGHT', 'OTHER'];

// ── POST /api/posts/:postId/report ────────────────────────────
export async function createReport(req: AuthRequest, res: Response): Promise<void> {
  const { postId } = req.params;
  const { reason, details } = req.body as { reason: string; details?: string };

  if (!reason || !VALID_REASONS.includes(reason)) {
    sendError(res, `Reason must be one of: ${VALID_REASONS.join(', ')}`, 400); return;
  }

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
  if (!post) { sendError(res, 'Post not found', 404); return; }

  // Check if already reported by this user
  const existing = await prisma.report.findFirst({
    where: { postId, reportedById: req.user!.id, status: 'OPEN' },
  });
  if (existing) { sendError(res, 'You have already reported this post', 409); return; }

  const safeDetails = details ? xss(details.trim()).slice(0, 500) : undefined;

  const report = await prisma.report.create({
    data: {
      reason: reason as 'SPAM' | 'MISINFORMATION' | 'HATE_SPEECH' | 'VIOLENCE' | 'COPYRIGHT' | 'OTHER',
      details: safeDetails,
      postId,
      reportedById: req.user!.id,
    },
    select: { id: true, reason: true, status: true, createdAt: true },
  });

  sendSuccess(res, report, 'Report submitted. Thank you for keeping the community safe.', 201);
}
