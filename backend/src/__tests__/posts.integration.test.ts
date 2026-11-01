// src/__tests__/posts.integration.test.ts — Posts API integration tests
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { prisma } from '../config/prisma';
import { signAccessToken } from '../utils/jwt';
import authRoutes from '../routes/auth.routes';
import postRoutes from '../routes/posts.routes';
import { globalErrorHandler, notFoundHandler } from '../middleware';
import { Role } from '@prisma/client';

// ── Lightweight test app ──────────────────────────────────────
const app = express();
app.use(express.json());
app.use(cookieParser('test-cookie-secret'));
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use(notFoundHandler);
app.use(globalErrorHandler);

// ── Test fixtures ─────────────────────────────────────────────
let userId: string;
let adminId: string;
let userToken: string;
let adminToken: string;
let approvedPostId: string;
let pendingPostId: string;

beforeAll(async () => {
  // Create test user
  const bcrypt = await import('bcryptjs');
  const hash   = await bcrypt.hash('TestPass123', 10);

  const user = await prisma.user.create({
    data: { name: 'Post Test User', email: `post_user_${Date.now()}@test.com`, password: hash },
  });
  userId    = user.id;
  userToken = signAccessToken({ id: user.id, email: user.email, role: 'USER' as Role, name: user.name });

  const admin = await prisma.user.create({
    data: { name: 'Post Test Admin', email: `post_admin_${Date.now()}@test.com`, password: hash, role: 'ADMIN' },
  });
  adminId    = admin.id;
  adminToken = signAccessToken({ id: admin.id, email: admin.email, role: 'ADMIN' as Role, name: admin.name });

  // Create an approved post for read tests
  const approved = await prisma.post.create({
    data: {
      title: 'Approved Integration Test Post',
      slug: `approved-test-${Date.now()}`,
      description: 'This is the description of the approved test post with plenty of content here.',
      category: 'Technology',
      status: 'APPROVED',
      authorId: userId,
    },
  });
  approvedPostId = approved.id;

  // Create a pending post
  const pending = await prisma.post.create({
    data: {
      title: 'Pending Integration Test Post',
      slug: `pending-test-${Date.now()}`,
      description: 'This post is still pending review and should not appear in public feed.',
      category: 'Business',
      status: 'PENDING',
      authorId: userId,
    },
  });
  pendingPostId = pending.id;
});

afterAll(async () => {
  // Clean up all test data
  await prisma.like.deleteMany({ where: { userId: { in: [userId, adminId] } } });
  await prisma.comment.deleteMany({ where: { authorId: { in: [userId, adminId] } } });
  await prisma.post.deleteMany({ where: { authorId: { in: [userId, adminId] } } });
  await prisma.refreshToken.deleteMany({ where: { userId: { in: [userId, adminId] } } });
  await prisma.user.deleteMany({ where: { id: { in: [userId, adminId] } } });
});

// ── GET /api/posts ────────────────────────────────────────────
describe('GET /api/posts', () => {
  it('returns paginated list of approved posts', async () => {
    const res = await request(app).get('/api/posts');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    // All returned posts should be APPROVED
    res.body.data.forEach((p: { status: string }) => {
      expect(p.status).toBe('APPROVED');
    });
  });

  it('filters by category', async () => {
    const res = await request(app).get('/api/posts?category=Technology');
    expect(res.status).toBe(200);
    res.body.data.forEach((p: { category: string }) => {
      expect(p.category).toBe('Technology');
    });
  });

  it('supports search query', async () => {
    const res = await request(app).get('/api/posts?search=Integration Test');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('returns pagination meta', async () => {
    const res = await request(app).get('/api/posts?page=1&limit=5');
    expect(res.status).toBe(200);
    expect(res.body.meta).toBeDefined();
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.limit).toBe(5);
    expect(typeof res.body.meta.total).toBe('number');
  });

  it('attaches isLiked for authenticated users', async () => {
    const res = await request(app)
      .get('/api/posts')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    res.body.data.forEach((p: { isLiked: boolean }) => {
      expect(typeof p.isLiked).toBe('boolean');
    });
  });

  it('does NOT expose pending posts to public', async () => {
    const res = await request(app).get('/api/posts');
    const ids = res.body.data.map((p: { id: string }) => p.id);
    expect(ids).not.toContain(pendingPostId);
  });
});

// ── GET /api/posts/:id ────────────────────────────────────────
describe('GET /api/posts/:id', () => {
  it('returns single approved post with comments', async () => {
    const res = await request(app).get(`/api/posts/${approvedPostId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(approvedPostId);
    expect(Array.isArray(res.body.data.comments)).toBe(true);
  });

  it('returns 404 for pending post (unauthenticated)', async () => {
    const res = await request(app).get(`/api/posts/${pendingPostId}`);
    expect(res.status).toBe(404);
  });

  it('returns 404 for non-existent post', async () => {
    const res = await request(app).get('/api/posts/non_existent_id_xyz');
    expect(res.status).toBe(404);
  });
});

// ── POST /api/posts/:id/like ──────────────────────────────────
describe('POST /api/posts/:id/like', () => {
  it('toggles like on an approved post', async () => {
    // First like
    const res1 = await request(app)
      .post(`/api/posts/${approvedPostId}/like`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res1.status).toBe(200);
    expect(res1.body.data.liked).toBe(true);

    // Second call should unlike
    const res2 = await request(app)
      .post(`/api/posts/${approvedPostId}/like`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res2.status).toBe(200);
    expect(res2.body.data.liked).toBe(false);
  });

  it('requires authentication', async () => {
    const res = await request(app).post(`/api/posts/${approvedPostId}/like`);
    expect(res.status).toBe(401);
  });
});

// ── POST /api/posts/:postId/comments ─────────────────────────
describe('POST /api/posts/:postId/comments', () => {
  it('creates a comment on an approved post', async () => {
    const res = await request(app)
      .post(`/api/posts/${approvedPostId}/comments`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ content: 'This is a test comment!' });

    expect(res.status).toBe(201);
    expect(res.body.data.content).toBe('This is a test comment!');
    expect(res.body.data.author).toBeDefined();
  });

  it('rejects empty comment', async () => {
    const res = await request(app)
      .post(`/api/posts/${approvedPostId}/comments`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ content: '' });
    expect(res.status).toBe(422);
  });

  it('requires authentication', async () => {
    const res = await request(app)
      .post(`/api/posts/${approvedPostId}/comments`)
      .send({ content: 'Anonymous comment attempt' });
    expect(res.status).toBe(401);
  });
});

// ── GET /api/posts/stats ──────────────────────────────────────
describe('GET /api/posts/stats', () => {
  it('returns platform statistics', async () => {
    const res = await request(app).get('/api/posts/stats');
    expect(res.status).toBe(200);
    expect(typeof res.body.data.totalPosts).toBe('number');
    expect(typeof res.body.data.totalUsers).toBe('number');
    expect(typeof res.body.data.totalLikes).toBe('number');
    expect(typeof res.body.data.totalComments).toBe('number');
  });
});
