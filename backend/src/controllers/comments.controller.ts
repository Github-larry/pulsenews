// controllers/comments.controller.ts
// Handles: list comments, create comment, delete comment
import { Response } from 'express';
import xss from 'xss';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError, buildPaginationMeta } from '../utils/response';
import { AuthRequest } from '../types';

// ── GET /api/posts/:postId/comments ──────────────────────────
export async function getComments(req: AuthRequest, res: Response): Promise<void> {
  const { postId } = req.params;
  const page  = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const skip  = (page - 1) * limit;

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
  if (!post) { sendError(res, 'Post not found', 404); return; }

  const [comments, total] = await prisma.$transaction([
    prisma.comment.findMany({
      where: { postId },
      select: {
        id: true, content: true, createdAt: true,
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip, take: limit,
    }),
    prisma.comment.count({ where: { postId } }),
  ]);

  sendSuccess(res, comments, 'Comments fetched', 200, buildPaginationMeta(total, page, limit));
}

// ── POST /api/posts/:postId/comments ─────────────────────────
export async function createComment(req: AuthRequest, res: Response): Promise<void> {
  const { postId } = req.params;
  const { content } = req.body as { content: string };

  // Sanitize input — prevent XSS
  const safeContent = xss(content.trim());
  if (!safeContent) { sendError(res, 'Comment cannot be empty', 400); return; }
  if (safeContent.length > 1000) { sendError(res, 'Comment too long (max 1000 chars)', 400); return; }

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true, status: true } });
  if (!post || post.status !== 'APPROVED') { sendError(res, 'Post not found', 404); return; }

  const comment = await prisma.comment.create({
    data: { content: safeContent, postId, authorId: req.user!.id },
    select: {
      id: true, content: true, createdAt: true,
      author: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  // Update comment count
  await prisma.post.update({
    where: { id: postId },
    data: { commentCount: { increment: 1 } },
  }).catch(() => {});

  sendSuccess(res, comment, 'Comment posted', 201);
}

// ── DELETE /api/posts/comments/:commentId ────────────────────
export async function deleteComment(req: AuthRequest, res: Response): Promise<void> {
  const { commentId } = req.params;

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, authorId: true, postId: true },
  });
  if (!comment) { sendError(res, 'Comment not found', 404); return; }

  // Only author or admin can delete
  if (comment.authorId !== req.user!.id && req.user!.role !== 'ADMIN') {
    sendError(res, 'Not allowed to delete this comment', 403); return;
  }

  await prisma.comment.delete({ where: { id: commentId } });

  // Update comment count
  await prisma.post.update({
    where: { id: comment.postId },
    data: { commentCount: { decrement: 1 } },
  }).catch(() => {});

  sendSuccess(res, null, 'Comment deleted');
}
