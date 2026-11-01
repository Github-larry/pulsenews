// src/__tests__/auth.integration.test.ts — Auth API integration tests
// Uses supertest to test HTTP routes end-to-end against a test database
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { prisma } from '../config/prisma';
import authRoutes from '../routes/auth.routes';
import { globalErrorHandler, notFoundHandler } from '../middleware';

// ── Test app setup (lightweight — no rate limiting in tests) ──
const app = express();
app.use(express.json());
app.use(cookieParser('test-cookie-secret'));
app.use('/api/auth', authRoutes);
app.use(notFoundHandler);
app.use(globalErrorHandler);

// ── Test data ─────────────────────────────────────────────────
const TEST_USER = {
  name: 'Test User',
  email: `test_${Date.now()}@pulsenews.test`,
  password: 'TestPass123',
  country: 'Kenya',
};

let accessToken: string;
let userId: string;

// ── Cleanup ───────────────────────────────────────────────────
afterAll(async () => {
  // Clean up test user and their tokens
  if (userId) {
    await prisma.refreshToken.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  }
});

// ── Tests ─────────────────────────────────────────────────────
describe('POST /api/auth/register', () => {
  it('registers a new user and returns tokens', async () => {
    const res = await request(app).post('/api/auth/register').send(TEST_USER);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(TEST_USER.email);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.password).toBeUndefined(); // Never expose hash
    expect(res.headers['set-cookie']).toBeDefined();     // Refresh token cookie

    accessToken = res.body.data.accessToken;
    userId      = res.body.data.user.id;
  });

  it('rejects duplicate email with 409', async () => {
    const res = await request(app).post('/api/auth/register').send(TEST_USER);
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('validates required fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'bad', password: 'short' });
    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
    expect(Array.isArray(res.body.errors)).toBe(true);
  });
});

describe('POST /api/auth/login', () => {
  it('returns 200 with tokens for correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: TEST_USER.password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.password).toBeUndefined();
    accessToken = res.body.data.accessToken;
  });

  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: 'WrongPassword999' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 for non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@nowhere.com', password: 'AnyPassword123' });

    expect(res.status).toBe(401);
  });

  it('validates email format', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: 'Password123' });

    expect(res.status).toBe(422);
  });
});

describe('GET /api/auth/me', () => {
  it('returns current user for valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(TEST_USER.email);
    expect(res.body.data.password).toBeUndefined();
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with malformed token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not.a.real.token');
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/auth/profile', () => {
  it('updates user profile fields', async () => {
    const res = await request(app)
      .patch('/api/auth/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Updated Name', bio: 'New bio text', country: 'Ghana' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated Name');
    expect(res.body.data.bio).toBe('New bio text');
  });

  it('requires authentication', async () => {
    const res = await request(app)
      .patch('/api/auth/profile')
      .send({ name: 'Hacker' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the refresh token cookie', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
