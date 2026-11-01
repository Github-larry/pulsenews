// src/controllers/admin.controller.ts
import { Response } from 'express';
import { PostStatus, UserStatus, ReportStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { cloudinary } from '../config/cloudinary';
import { sendSuccess, sendError, buildPaginationMeta } from '../utils/response';
import { AuthRequest } from '../types';
import { logger } from '../config/logger';

// ── GET /api/admin/posts — All posts with filters ─────────────
export async function adminGetPosts(req: AuthRequest, res: Response): Promise<void> {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 15));
  const skip = (page - 1) * limit;
  const status = req.query.status as PostStatus | undefined;

  const where = { ...(status && { status }) };

  const [posts, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      select: {
        id: true, title: true, slug: true, category: true,
        status: true, location: true, likeCount: true,
        commentCount: true, viewCount: true, createdAt: true,
        author: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip, take: limit,
    }),
    prisma.post.count({ where }),
  ]);

  sendSuccess(res, posts, 'Admin posts fetched', 200, buildPaginationMeta(total, page, limit));
}

// ── PATCH /api/admin/posts/:id/moderate ──────────────────────
export async function moderatePost(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { status } = req.body as { status: PostStatus };

  const validStatuses: PostStatus[] = [PostStatus.APPROVED, PostStatus.REJECTED, PostStatus.PENDING];
  if (!validStatuses.includes(status)) {
    sendError(res, 'Invalid status. Must be APPROVED, REJECTED, or PENDING', 400);
    return;
  }

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) { sendError(res, 'Post not found', 404); return; }

  const updated = await prisma.post.update({
    where: { id },
    data: {
      status,
      moderatedAt: new Date(),
      moderatedBy: req.user!.id,
    },
    select: {
      id: true, title: true, status: true, moderatedAt: true,
    },
  });

  logger.info(`Admin ${req.user!.email} set post ${id} to ${status}`);
  sendSuccess(res, updated, `Post ${status.toLowerCase()} successfully`);
}

// ── DELETE /api/admin/posts/:id ───────────────────────────────
export async function adminDeletePost(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  const post = await prisma.post.findUnique({
    where: { id },
    select: { id: true, imagePublicId: true, title: true },
  });
  if (!post) { sendError(res, 'Post not found', 404); return; }

  if (post.imagePublicId) {
    await cloudinary.uploader.destroy(post.imagePublicId).catch(() => {});
  }

  await prisma.post.delete({ where: { id } });
  logger.info(`Admin ${req.user!.email} deleted post: ${post.title}`);
  sendSuccess(res, null, 'Post deleted by admin');
}

// ── GET /api/admin/users ──────────────────────────────────────
export async function adminGetUsers(req: AuthRequest, res: Response): Promise<void> {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 15));
  const skip = (page - 1) * limit;
  const search = req.query.search as string | undefined;

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, role: true,
        status: true, country: true, createdAt: true,
        _count: { select: { posts: true, comments: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip, take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  sendSuccess(res, users, 'Users fetched', 200, buildPaginationMeta(total, page, limit));
}

// ── PATCH /api/admin/users/:id/status ────────────────────────
export async function updateUserStatus(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { status } = req.body as { status: UserStatus };

  // Prevent admin from banning themselves
  if (id === req.user!.id) {
    sendError(res, 'You cannot change your own status', 400);
    return;
  }

  const validStatuses: UserStatus[] = [UserStatus.ACTIVE, UserStatus.BANNED, UserStatus.SUSPENDED];
  if (!validStatuses.includes(status)) {
    sendError(res, 'Invalid status', 400);
    return;
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) { sendError(res, 'User not found', 404); return; }

  // Prevent modifying other admins
  if (user.role === 'ADMIN') {
    sendError(res, 'Cannot modify another admin account', 403);
    return;
  }

  // If banning, revoke all refresh tokens
  if (status === 'BANNED') {
    await prisma.refreshToken.deleteMany({ where: { userId: id } });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { status },
    select: { id: true, name: true, email: true, status: true },
  });

  logger.info(`Admin ${req.user!.email} set user ${user.email} status to ${status}`);
  sendSuccess(res, updated, `User status updated to ${status.toLowerCase()}`);
}

// ── GET /api/admin/reports ────────────────────────────────────
export async function getReports(req: AuthRequest, res: Response): Promise<void> {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 15));
  const skip = (page - 1) * limit;
  const status = req.query.status as ReportStatus | undefined;

  const where = { ...(status && { status }) };

  const [reports, total] = await prisma.$transaction([
    prisma.report.findMany({
      where,
      select: {
        id: true, reason: true, details: true, status: true, createdAt: true,
        post: { select: { id: true, title: true, slug: true } },
        reportedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip, take: limit,
    }),
    prisma.report.count({ where }),
  ]);

  sendSuccess(res, reports, 'Reports fetched', 200, buildPaginationMeta(total, page, limit));
}

// ── PATCH /api/admin/reports/:id ─────────────────────────────
export async function resolveReport(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { status } = req.body as { status: ReportStatus };

  if (!['RESOLVED', 'DISMISSED'].includes(status)) {
    sendError(res, 'Status must be RESOLVED or DISMISSED', 400);
    return;
  }

  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) { sendError(res, 'Report not found', 404); return; }

  const updated = await prisma.report.update({
    where: { id },
    data: { status, resolvedAt: new Date(), resolvedById: req.user!.id },
    select: { id: true, status: true, resolvedAt: true },
  });

  sendSuccess(res, updated, 'Report updated');
}

// ── GET /api/admin/dashboard ──────────────────────────────────
export async function getDashboard(_req: AuthRequest, res: Response): Promise<void> {
  const [
    totalPosts, pendingPosts, approvedPosts, rejectedPosts,
    totalUsers, bannedUsers, totalComments, totalLikes, openReports,
  ] = await prisma.$transaction([
    prisma.post.count(),
    prisma.post.count({ where: { status: 'PENDING' } }),
    prisma.post.count({ where: { status: 'APPROVED' } }),
    prisma.post.count({ where: { status: 'REJECTED' } }),
    prisma.user.count(),
    prisma.user.count({ where: { status: 'BANNED' } }),
    prisma.comment.count(),
    prisma.like.count(),
    prisma.report.count({ where: { status: 'OPEN' } }),
  ]);

  const recentPosts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    take: 7,
    select: {
      id: true, title: true, status: true, createdAt: true,
      author: { select: { name: true } },
    },
  });

  // Return stats at top-level so /stats alias works directly
  sendSuccess(res, {
    totalPosts, pendingPosts, approvedPosts, rejectedPosts,
    totalUsers, bannedUsers, totalComments, totalLikes, openReports,
    recentPosts,
  }, 'Dashboard data fetched');
}

// ── PATCH /api/admin/reports/:id/resolve (alias) ──────────────
export async function resolveReportAlias(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) { sendError(res, 'Report not found', 404); return; }
  const updated = await prisma.report.update({
    where: { id },
    data: { status: 'RESOLVED', resolvedAt: new Date(), resolvedById: req.user!.id },
    select: { id: true, status: true, resolvedAt: true },
  });
  sendSuccess(res, updated, 'Report resolved');
}
