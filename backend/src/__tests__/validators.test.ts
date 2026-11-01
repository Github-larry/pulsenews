// src/__tests__/validators.test.ts — Input validation tests
import { validationResult } from 'express-validator';
import { Request } from 'express';
import {
  registerValidator,
  loginValidator,
  createPostValidator,
  commentValidator,
} from '../validators';

// ── Helper: run validators against a mock request ─────────────
async function validate(
  validators: ReturnType<typeof registerValidator>,
  body: Record<string, unknown>,
  params: Record<string, string> = {},
  query: Record<string, string> = {}
): Promise<{ valid: boolean; errors: { field: string; message: string }[] }> {
  const req = { body, params, query } as unknown as Request;
  for (const v of validators) {
    await (v as (req: Request) => Promise<void>)(req);
  }
  const result = validationResult(req);
  const errors = result.array().map((e) => ({
    field: 'path' in e ? String(e.path) : 'unknown',
    message: e.msg as string,
  }));
  return { valid: result.isEmpty(), errors };
}

// ── registerValidator ─────────────────────────────────────────
describe('registerValidator', () => {
  const valid = {
    name: 'Jane Mwangi',
    email: 'jane@example.com',
    password: 'SecurePass1',
    country: 'Kenya',
  };

  it('accepts valid registration data', async () => {
    const { valid: ok } = await validate(registerValidator, valid);
    expect(ok).toBe(true);
  });

  it('rejects missing name', async () => {
    const { valid: ok, errors } = await validate(registerValidator, { ...valid, name: '' });
    expect(ok).toBe(false);
    expect(errors.some((e) => e.field === 'name')).toBe(true);
  });

  it('rejects invalid email', async () => {
    const { valid: ok, errors } = await validate(registerValidator, { ...valid, email: 'not-an-email' });
    expect(ok).toBe(false);
    expect(errors.some((e) => e.field === 'email')).toBe(true);
  });

  it('rejects password shorter than 8 chars', async () => {
    const { valid: ok, errors } = await validate(registerValidator, { ...valid, password: 'Ab1' });
    expect(ok).toBe(false);
    expect(errors.some((e) => e.field === 'password')).toBe(true);
  });

  it('rejects password without uppercase', async () => {
    const { valid: ok } = await validate(registerValidator, { ...valid, password: 'nouppercase1' });
    expect(ok).toBe(false);
  });

  it('rejects password without number', async () => {
    const { valid: ok } = await validate(registerValidator, { ...valid, password: 'NoNumber!' });
    expect(ok).toBe(false);
  });

  it('accepts registration without optional country', async () => {
    const { name, email, password } = valid;
    const { valid: ok } = await validate(registerValidator, { name, email, password });
    expect(ok).toBe(true);
  });
});

// ── loginValidator ────────────────────────────────────────────
describe('loginValidator', () => {
  it('accepts valid credentials', async () => {
    const { valid: ok } = await validate(loginValidator, {
      email: 'user@example.com', password: 'anypassword',
    });
    expect(ok).toBe(true);
  });

  it('rejects missing email', async () => {
    const { valid: ok, errors } = await validate(loginValidator, { password: 'pass' });
    expect(ok).toBe(false);
    expect(errors.some((e) => e.field === 'email')).toBe(true);
  });

  it('rejects missing password', async () => {
    const { valid: ok, errors } = await validate(loginValidator, { email: 'a@b.com', password: '' });
    expect(ok).toBe(false);
    expect(errors.some((e) => e.field === 'password')).toBe(true);
  });
});

// ── createPostValidator ───────────────────────────────────────
describe('createPostValidator', () => {
  const valid = {
    title: 'This is a valid news headline with enough characters',
    description: 'This is a valid description that is well over fifty characters long and contains meaningful content about an event.',
    category: 'Technology',
    location: 'Nairobi, Kenya',
  };

  it('accepts valid post data', async () => {
    const { valid: ok } = await validate(createPostValidator, valid);
    expect(ok).toBe(true);
  });

  it('rejects title shorter than 10 chars', async () => {
    const { valid: ok, errors } = await validate(createPostValidator, { ...valid, title: 'Short' });
    expect(ok).toBe(false);
    expect(errors.some((e) => e.field === 'title')).toBe(true);
  });

  it('rejects description shorter than 50 chars', async () => {
    const { valid: ok } = await validate(createPostValidator, { ...valid, description: 'Too short' });
    expect(ok).toBe(false);
  });

  it('rejects invalid category', async () => {
    const { valid: ok, errors } = await validate(createPostValidator, {
      ...valid, category: 'InvalidCategory',
    });
    expect(ok).toBe(false);
    expect(errors.some((e) => e.field === 'category')).toBe(true);
  });

  it('accepts post without optional location', async () => {
    const { title, description, category } = valid;
    const { valid: ok } = await validate(createPostValidator, { title, description, category });
    expect(ok).toBe(true);
  });

  it('accepts all valid categories', async () => {
    const categories = ['Politics','Business','Technology','Health','Sports','Culture','Environment','Crime','Other'];
    for (const category of categories) {
      const { valid: ok } = await validate(createPostValidator, { ...valid, category });
      expect(ok).toBe(true);
    }
  });
});

// ── commentValidator ──────────────────────────────────────────
describe('commentValidator', () => {
  it('accepts valid comment', async () => {
    const { valid: ok } = await validate(commentValidator, { content: 'This is a great story!' });
    expect(ok).toBe(true);
  });

  it('rejects empty comment', async () => {
    const { valid: ok } = await validate(commentValidator, { content: '' });
    expect(ok).toBe(false);
  });

  it('rejects comment over 1000 chars', async () => {
    const { valid: ok } = await validate(commentValidator, { content: 'A'.repeat(1001) });
    expect(ok).toBe(false);
  });

  it('accepts comment at exactly 1000 chars', async () => {
    const { valid: ok } = await validate(commentValidator, { content: 'A'.repeat(1000) });
    expect(ok).toBe(true);
  });
});
