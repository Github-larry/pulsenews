// src/__tests__/middleware.test.ts — Middleware unit tests
import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { signAccessToken, signRefreshToken } from '../utils/jwt';
import {
  authenticate,
  authorize,
  optionalAuth,
  validateRequest,
  globalErrorHandler,
  notFoundHandler,
} from '../middleware';
import { AuthRequest } from '../types';
import { validationResult, body } from 'express-validator';

// Set required env vars for JWT utils
process.env.JWT_SECRET = 'middleware_test_secret_that_is_64_characters_long_ok_yes_indeed';
process.env.JWT_REFRESH_SECRET = 'middleware_test_refresh_secret_64_chars_long_ok_yes_indeed_xyz';

// ── Mock helpers ──────────────────────────────────────────────
function mockReq(overrides: Partial<AuthRequest> = {}): AuthRequest {
  return {
    headers: {},
    body: {},
    params: {},
    query: {},
    cookies: {},
    url: '/test',
    method: 'GET',
    ip: '127.0.0.1',
    ...overrides,
  } as AuthRequest;
}

function mockRes(): Response & { statusCode: number; body: unknown } {
  const res = {
    statusCode: 200,
    body: null as unknown,
    status(code: number) { this.statusCode = code; return this; },
    json(data: unknown) { this.body = data; return this; },
  } as Response & { statusCode: number; body: unknown };
  return res;
}

const mockNext: NextFunction = jest.fn();

// ── authenticate middleware ───────────────────────────────────
describe('authenticate middleware', () => {
  const payload = { id: 'user1', email: 'a@b.com', role: 'USER' as Role, name: 'Test' };

  beforeEach(() => jest.clearAllMocks());

  it('attaches user to req for valid Bearer token', () => {
    const token = signAccessToken(payload);
    const req = mockReq({ headers: { authorization: `Bearer ${token}` } });
    const res = mockRes();

    authenticate(req, res, mockNext);

    expect(req.user).toBeDefined();
    expect(req.user?.id).toBe(payload.id);
    expect(req.user?.email).toBe(payload.email);
    expect(mockNext).toHaveBeenCalledWith();      // called with no args = success
  });

  it('returns 401 when no Authorization header', () => {
    const req = mockReq({ headers: {} });
    const res = mockRes();

    authenticate(req, res, mockNext);

    expect(res.statusCode).toBe(401);
    expect((res.body as { success: boolean }).success).toBe(false);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 401 for malformed token', () => {
    const req = mockReq({ headers: { authorization: 'Bearer not.valid.token' } });
    const res = mockRes();

    authenticate(req, res, mockNext);

    expect(res.statusCode).toBe(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 401 when Authorization header missing "Bearer " prefix', () => {
    const token = signAccessToken(payload);
    const req = mockReq({ headers: { authorization: token } }); // No "Bearer " prefix
    const res = mockRes();

    authenticate(req, res, mockNext);

    expect(res.statusCode).toBe(401);
  });

  it('returns 401 for refresh token used as access token', () => {
    const refreshToken = signRefreshToken(payload); // Signed with different secret
    const req = mockReq({ headers: { authorization: `Bearer ${refreshToken}` } });
    const res = mockRes();

    authenticate(req, res, mockNext);

    expect(res.statusCode).toBe(401);
  });
});

// ── optionalAuth middleware ───────────────────────────────────
describe('optionalAuth middleware', () => {
  const payload = { id: 'user1', email: 'a@b.com', role: 'USER' as Role, name: 'Test' };

  beforeEach(() => jest.clearAllMocks());

  it('attaches user when valid token present', () => {
    const token = signAccessToken(payload);
    const req = mockReq({ headers: { authorization: `Bearer ${token}` } });
    const res = mockRes();

    optionalAuth(req, res, mockNext);

    expect(req.user?.id).toBe(payload.id);
    expect(mockNext).toHaveBeenCalled();
  });

  it('calls next without error when no token present', () => {
    const req = mockReq({ headers: {} });
    const res = mockRes();

    optionalAuth(req, res, mockNext);

    expect(req.user).toBeUndefined();
    expect(mockNext).toHaveBeenCalled();
    expect(res.statusCode).toBe(200); // unchanged
  });

  it('silently ignores invalid token and calls next', () => {
    const req = mockReq({ headers: { authorization: 'Bearer bad.token.here' } });
    const res = mockRes();

    optionalAuth(req, res, mockNext);

    expect(req.user).toBeUndefined();
    expect(mockNext).toHaveBeenCalled(); // Still proceeds — no 401
  });
});

// ── authorize middleware ──────────────────────────────────────
describe('authorize middleware', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls next for user with correct role', () => {
    const req = mockReq();
    req.user = { id: '1', email: 'a@b.com', role: 'ADMIN' as Role, name: 'Admin' };
    const res = mockRes();

    authorize('ADMIN')(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
  });

  it('returns 403 when user has wrong role', () => {
    const req = mockReq();
    req.user = { id: '1', email: 'a@b.com', role: 'USER' as Role, name: 'User' };
    const res = mockRes();

    authorize('ADMIN')(req, res, mockNext);

    expect(res.statusCode).toBe(403);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 401 when no user attached', () => {
    const req = mockReq(); // no req.user
    const res = mockRes();

    authorize('USER')(req, res, mockNext);

    expect(res.statusCode).toBe(401);
  });

  it('accepts multiple allowed roles', () => {
    const req = mockReq();
    req.user = { id: '1', email: 'a@b.com', role: 'USER' as Role, name: 'User' };
    const res = mockRes();

    authorize('USER', 'ADMIN')(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
  });
});

// ── validateRequest middleware ────────────────────────────────
describe('validateRequest middleware', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls next when no validation errors', async () => {
    const req = { body: { name: 'Valid' }, headers: {}, params: {}, query: {} } as Request;
    await body('name').notEmpty().run(req);
    const res = mockRes();

    validateRequest(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
  });

  it('returns 422 with errors when validation fails', async () => {
    const req = { body: { name: '' }, headers: {}, params: {}, query: {} } as Request;
    await body('name').notEmpty().withMessage('Name required').run(req);
    const res = mockRes();

    validateRequest(req, res, mockNext);

    expect(res.statusCode).toBe(422);
    const body_out = res.body as { success: boolean; errors: Array<{ field: string; message: string }> };
    expect(body_out.success).toBe(false);
    expect(Array.isArray(body_out.errors)).toBe(true);
    expect(body_out.errors[0].message).toBe('Name required');
    expect(mockNext).not.toHaveBeenCalled();
  });
});

// ── notFoundHandler middleware ────────────────────────────────
describe('notFoundHandler middleware', () => {
  it('returns 404 with route info', () => {
    const req = { method: 'GET', url: '/api/nonexistent' } as Request;
    const res = mockRes();

    notFoundHandler(req, res);

    expect(res.statusCode).toBe(404);
    const body_out = res.body as { success: boolean; message: string };
    expect(body_out.success).toBe(false);
    expect(body_out.message).toContain('/api/nonexistent');
  });
});

// ── globalErrorHandler middleware ─────────────────────────────
describe('globalErrorHandler middleware', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 500 for generic errors', () => {
    const err = new Error('Something broke');
    const req = { url: '/test', method: 'GET', ip: '::1' } as Request;
    const res = mockRes();

    globalErrorHandler(err, req, res, mockNext);

    expect(res.statusCode).toBe(500);
  });

  it('respects statusCode on the error object', () => {
    const err = Object.assign(new Error('Not found'), { statusCode: 404 });
    const req = { url: '/test', method: 'GET', ip: '::1' } as Request;
    const res = mockRes();

    globalErrorHandler(err, req, res, mockNext);

    expect(res.statusCode).toBe(404);
  });

  it('returns 409 for Prisma P2002 (unique constraint)', () => {
    const err = Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });
    const req = { url: '/test', method: 'GET', ip: '::1' } as Request;
    const res = mockRes();

    globalErrorHandler(err, req, res, mockNext);

    expect(res.statusCode).toBe(409);
    const body_out = res.body as { message: string };
    expect(body_out.message).toContain('already exists');
  });

  it('returns 404 for Prisma P2025 (record not found)', () => {
    const err = Object.assign(new Error('Record not found'), { code: 'P2025' });
    const req = { url: '/test', method: 'GET', ip: '::1' } as Request;
    const res = mockRes();

    globalErrorHandler(err, req, res, mockNext);

    expect(res.statusCode).toBe(404);
  });
});
