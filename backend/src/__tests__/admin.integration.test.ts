// src/__tests__/admin.integration.test.ts — Admin API integration tests
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { prisma } from '../config/prisma';
import { signAccessToken } from '../utils/jwt';
import authRoutes from '../routes/auth.routes';
import postRoutes from '../routes/posts.routes';
import adminRoutes from '../routes/admin.routes';
import { globalErrorHandler, notFoundHandler } from '../middleware';
import { Role } from '@prisma/client';

// ── Lightweight test app ──────────────────────────────────────
const app = express();
app.use(express.json());
app.use(cookieParser('test-cookie-secret'));
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/admin', adminRoutes);
app.use(notFoundHandler);
app.use(globalErrorHandler);

// ── Test fixtures ─────────────────────────────────────────────
let adminId: string;
let userId: string;
let adminToken: string;
let userToken: string;
let pendingPostId: string;
let approvedPostId: string;
let reportId: string;

beforeAll(async () => {
  const bcrypt = await import('bcryptjs');
  const hash = await bcrypt.hash('TestPass123', 10);

  // Admin user
  const admin = await prisma.user.create({
    data: {
      name: 'Admin Test',
      email: `admin_test_${Date.now()}@test.com`,
      password: hash,
      role: 'ADMIN',
    },
  });
  adminId = admin.id;
  adminToken = signAccessToken({
    id: admin.id, email: admin.email,
    role: 'ADMIN' as Role, name: admin.name,
  });

  // Regular user
  const user = await prisma.user.create({
    data: {
      name: 'Regular Test',
      email: `regular_test_${Date.now()}@test.com`,
      password: hash,
    },
  });
  userId = user.id;
  userToken = signAccessToken({
    id: user.id, email: user.email,
    role: 'USER' as Role, name: user.name,
  });

  // A pending post for moderation tests
  const pending = await prisma.post.create({
    data: {
      title: 'Admin Test Pending Post Title Here',
      slug: `admin-pending-${Date.now()}`,
      description: 'This post is pending review. It has enough content for the validator.',
      category: 'Technology',
      status: 'PENDING',
      authorId: userId,
    },
  });
  pendingPostId = pending.id;

  // An approved post for report tests
  const approved = await prisma.post.create({
    data: {
      title: 'Admin Test Approved Post Title',
      slug: `admin-approved-${Date.now()}`,
      description: 'This post is approved and visible. Has enough content here.',
      category: 'Business',
      status: 'APPROVED',
      authorId: userId,
    },
  });
  approvedPostId = approved.id;

  // A report on the approved post
  const report = await prisma.report.create({
    data: {
      reason: 'SPAM',
      details: 'This is a test spam report',
      postId: approvedPostId,
      reportedById: userId,
    },
  });
  reportId = report.id;
});

afterAll(async () => {
  await prisma.report.deleteMany({ where: { id: reportId } });
  await prisma.post.deleteMany({ where: { authorId: { in: [adminId, userId] } } });
  await prisma.refreshToken.deleteMany({ where: { userId: { in: [adminId, userId] } } });
  await prisma.user.deleteMany({ where: { id: { in: [adminId, userId] } } });
});

// ── Access Control Tests ──────────────────────────────────────
describe('Admin route access control', () => {
  it('blocks unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/admin/stats');
    expect(res.status).toBe(401);
  });

  it('blocks regular users from admin routes with 403', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it('allows admin users through', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});

// ── GET /api/admin/stats ──────────────────────────────────────
describe('GET /api/admin/stats', () => {
  it('returns all required dashboard stats', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const { data } = res.body;
    expect(typeof data.totalPosts).toBe('number');
    expect(typeof data.pendingPosts).toBe('number');
    expect(typeof data.approvedPosts).toBe('number');
    expect(typeof data.rejectedPosts).toBe('number');
    expect(typeof data.totalUsers).toBe('number');
    expect(typeof data.totalLikes).toBe('number');
    expect(typeof data.totalComments).toBe('number');
    expect(typeof data.openReports).toBe('number');
  });

  it('GET /api/admin/dashboard returns same data as /stats', async () => {
    const stats = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    const dashboard = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(stats.body.data.totalPosts).toBe(dashboard.body.data.totalPosts);
  });
});

// ── GET /api/admin/posts ──────────────────────────────────────
describe('GET /api/admin/posts', () => {
  it('returns all posts including pending and rejected', async () => {
    const res = await request(app)
      .get('/api/admin/posts')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    // Should include our pending post
    const ids = res.body.data.map((p: { id: string }) => p.id);
    expect(ids).toContain(pendingPostId);
  });

  it('filters by status=PENDING', async () => {
    const res = await request(app)
      .get('/api/admin/posts?status=PENDING')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    res.body.data.forEach((p: { status: string }) => {
      expect(p.status).toBe('PENDING');
    });
  });

  it('returns pagination meta', async () => {
    const res = await request(app)
      .get('/api/admin/posts?page=1&limit=5')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.body.meta).toBeDefined();
    expect(res.body.meta.limit).toBe(5);
  });
});

// ── PATCH /api/admin/posts/:id/moderate ──────────────────────
describe('PATCH /api/admin/posts/:id/moderate', () => {
  it('approves a pending post', async () => {
    const res = await request(app)
      .patch(`/api/admin/posts/${pendingPostId}/moderate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'APPROVED' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify in DB
    const post = await prisma.post.findUnique({ where: { id: pendingPostId } });
    expect(post?.status).toBe('APPROVED');
  });

  it('rejects a post back to REJECTED', async () => {
    const res = await request(app)
      .patch(`/api/admin/posts/${pendingPostId}/moderate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'REJECTED' });

    expect(res.status).toBe(200);
    const post = await prisma.post.findUnique({ where: { id: pendingPostId } });
    expect(post?.status).toBe('REJECTED');
  });

  it('rejects invalid status values', async () => {
    const res = await request(app)
      .patch(`/api/admin/posts/${pendingPostId}/moderate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'PUBLISHED' }); // invalid
    expect(res.status).toBe(422);
  });

  it('returns 404 for non-existent post', async () => {
    const res = await request(app)
      .patch('/api/admin/posts/nonexistent_post_id_xyz/moderate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'APPROVED' });
    expect(res.status).toBe(404);
  });
});

// ── GET /api/admin/users ──────────────────────────────────────
describe('GET /api/admin/users', () => {
  it('returns list of all users', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    // Should NOT include password hashes
    res.body.data.forEach((u: Record<string, unknown>) => {
      expect(u.password).toBeUndefined();
    });
  });

  it('returns pagination metadata', async () => {
    const res = await request(app)
      .get('/api/admin/users?limit=2')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.body.meta).toBeDefined();
    expect(res.body.meta.limit).toBe(2);
  });
});

// ── PATCH /api/admin/users/:id/status ────────────────────────
describe('PATCH /api/admin/users/:id/status', () => {
  it('bans a user', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${userId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'BANNED' });

    expect(res.status).toBe(200);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user?.status).toBe('BANNED');
  });

  it('unbans a user', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${userId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'ACTIVE' });

    expect(res.status).toBe(200);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user?.status).toBe('ACTIVE');
  });

  it('rejects invalid status values', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${userId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'DELETED' }); // not a valid status
    expect(res.status).toBe(422);
  });
});

// ── GET /api/admin/reports ────────────────────────────────────
describe('GET /api/admin/reports', () => {
  it('returns list of reports', async () => {
    const res = await request(app)
      .get('/api/admin/reports')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    // Our test report should be in there
    const ids = res.body.data.map((r: { id: string }) => r.id);
    expect(ids).toContain(reportId);
  });
});

// ── PATCH /api/admin/reports/:id/resolve ─────────────────────
describe('PATCH /api/admin/reports/:id/resolve', () => {
  it('resolves an open report via the alias endpoint', async () => {
    const res = await request(app)
      .patch(`/api/admin/reports/${reportId}/resolve`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    expect(report?.status).toBe('RESOLVED');
  });

  it('returns 404 for non-existent report', async () => {
    const res = await request(app)
      .patch('/api/admin/reports/nonexistent_report_id/resolve')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });
});
