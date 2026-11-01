// src/__tests__/response.test.ts — API response helper tests
import { sendSuccess, sendError, buildPaginationMeta } from '../utils/response';

// ── Mock Express Response ─────────────────────────────────────
function mockResponse() {
  const res: {
    statusCode: number;
    body: unknown;
    status: (code: number) => typeof res;
    json: (data: unknown) => typeof res;
  } = {
    statusCode: 200,
    body: null,
    status(code: number) { this.statusCode = code; return this; },
    json(data: unknown) { this.body = data; return this; },
  };
  return res;
}

// ── sendSuccess Tests ─────────────────────────────────────────
describe('sendSuccess', () => {
  it('sends 200 with success payload by default', () => {
    const res = mockResponse() as never;
    sendSuccess(res, { id: '1' }, 'Done');
    expect((res as { statusCode: number }).statusCode).toBe(200);
    const body = (res as { body: { success: boolean; message: string; data: unknown } }).body;
    expect(body.success).toBe(true);
    expect(body.message).toBe('Done');
    expect(body.data).toEqual({ id: '1' });
  });

  it('respects custom status codes', () => {
    const res = mockResponse() as never;
    sendSuccess(res, null, 'Created', 201);
    expect((res as { statusCode: number }).statusCode).toBe(201);
  });

  it('attaches pagination meta when provided', () => {
    const res  = mockResponse() as never;
    const meta = { total: 50, page: 2, limit: 10, totalPages: 5, hasNext: true, hasPrev: true };
    sendSuccess(res, [], 'OK', 200, meta);
    const body = (res as { body: { meta: typeof meta } }).body;
    expect(body.meta).toEqual(meta);
  });

  it('handles null data without error', () => {
    const res = mockResponse() as never;
    expect(() => sendSuccess(res, null)).not.toThrow();
    const body = (res as { body: { data: unknown } }).body;
    expect(body.data).toBeNull();
  });
});

// ── sendError Tests ───────────────────────────────────────────
describe('sendError', () => {
  it('sends 400 with error payload by default', () => {
    const res = mockResponse() as never;
    sendError(res, 'Something broke');
    expect((res as { statusCode: number }).statusCode).toBe(400);
    const body = (res as { body: { success: boolean; message: string } }).body;
    expect(body.success).toBe(false);
    expect(body.message).toBe('Something broke');
  });

  it('respects custom error status codes', () => {
    const res = mockResponse() as never;
    sendError(res, 'Not found', 404);
    expect((res as { statusCode: number }).statusCode).toBe(404);
  });

  it('attaches field-level validation errors when provided', () => {
    const res    = mockResponse() as never;
    const errors = [{ field: 'email', message: 'Invalid email' }];
    sendError(res, 'Validation failed', 422, errors);
    const body = (res as { body: { errors: typeof errors } }).body;
    expect(body.errors).toEqual(errors);
  });
});

// ── buildPaginationMeta Tests ─────────────────────────────────
describe('buildPaginationMeta', () => {
  it('calculates correct totalPages', () => {
    expect(buildPaginationMeta(100, 1, 10).totalPages).toBe(10);
    expect(buildPaginationMeta(101, 1, 10).totalPages).toBe(11);
    expect(buildPaginationMeta(0, 1, 10).totalPages).toBe(0);
  });

  it('correctly flags hasNext and hasPrev', () => {
    const first = buildPaginationMeta(50, 1, 10);
    expect(first.hasPrev).toBe(false);
    expect(first.hasNext).toBe(true);

    const last = buildPaginationMeta(50, 5, 10);
    expect(last.hasPrev).toBe(true);
    expect(last.hasNext).toBe(false);

    const middle = buildPaginationMeta(100, 5, 10);
    expect(middle.hasPrev).toBe(true);
    expect(middle.hasNext).toBe(true);
  });

  it('returns all expected fields', () => {
    const meta = buildPaginationMeta(25, 2, 10);
    expect(meta).toMatchObject({ total: 25, page: 2, limit: 10 });
  });

  it('handles zero total', () => {
    const meta = buildPaginationMeta(0, 1, 10);
    expect(meta.totalPages).toBe(0);
    expect(meta.hasNext).toBe(false);
    expect(meta.hasPrev).toBe(false);
  });
});
