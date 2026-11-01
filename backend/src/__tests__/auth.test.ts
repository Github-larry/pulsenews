// src/__tests__/auth.test.ts — Auth utility unit tests
import bcrypt from 'bcryptjs';
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from '../utils/jwt';
import { Role } from '@prisma/client';

// Mock environment so tests don't require real .env
process.env.JWT_SECRET = 'test_jwt_secret_that_is_at_least_64_characters_long_for_testing_purposes';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_that_is_at_least_64_chars_long_for_testing_ok';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

const TEST_PAYLOAD = {
  id: 'test_user_id_123',
  email: 'test@example.com',
  role: 'USER' as Role,
  name: 'Test User',
};

// ── JWT Utility Tests ─────────────────────────────────────────
describe('JWT Utilities', () => {
  describe('signAccessToken', () => {
    it('should return a non-empty string token', () => {
      const token = signAccessToken(TEST_PAYLOAD);
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
      // JWT format: three dot-separated base64 segments
      expect(token.split('.')).toHaveLength(3);
    });

    it('should produce different tokens for different payloads', () => {
      const token1 = signAccessToken(TEST_PAYLOAD);
      const token2 = signAccessToken({ ...TEST_PAYLOAD, id: 'different_id' });
      expect(token1).not.toBe(token2);
    });
  });

  describe('signRefreshToken', () => {
    it('should return a JWT string', () => {
      const token = signRefreshToken(TEST_PAYLOAD);
      expect(token.split('.')).toHaveLength(3);
    });

    it('access and refresh tokens should differ for same payload', () => {
      const access  = signAccessToken(TEST_PAYLOAD);
      const refresh = signRefreshToken(TEST_PAYLOAD);
      expect(access).not.toBe(refresh);
    });
  });

  describe('verifyAccessToken', () => {
    it('should successfully verify a valid access token', () => {
      const token   = signAccessToken(TEST_PAYLOAD);
      const decoded = verifyAccessToken(token);
      expect(decoded.id).toBe(TEST_PAYLOAD.id);
      expect(decoded.email).toBe(TEST_PAYLOAD.email);
      expect(decoded.role).toBe(TEST_PAYLOAD.role);
      expect(decoded.name).toBe(TEST_PAYLOAD.name);
    });

    it('should throw on an invalid token string', () => {
      expect(() => verifyAccessToken('not.a.valid.token')).toThrow();
    });

    it('should throw when verifying refresh token as access token', () => {
      const refresh = signRefreshToken(TEST_PAYLOAD);
      // Refresh tokens are signed with a different secret — should fail
      expect(() => verifyAccessToken(refresh)).toThrow();
    });

    it('should throw on empty string', () => {
      expect(() => verifyAccessToken('')).toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should successfully verify a valid refresh token', () => {
      const token   = signRefreshToken(TEST_PAYLOAD);
      const decoded = verifyRefreshToken(token);
      expect(decoded.id).toBe(TEST_PAYLOAD.id);
    });

    it('should throw when verifying access token as refresh token', () => {
      const access = signAccessToken(TEST_PAYLOAD);
      expect(() => verifyRefreshToken(access)).toThrow();
    });
  });
});

// ── Password Hashing Tests ────────────────────────────────────
describe('Password Hashing', () => {
  const PLAIN  = 'SecureP@ssword123';
  const WRONG  = 'WrongPassword999';

  it('should hash a password to a bcrypt string', async () => {
    const hash = await bcrypt.hash(PLAIN, 10);
    expect(hash).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt prefix
    expect(hash).not.toBe(PLAIN);
  });

  it('should verify correct password successfully', async () => {
    const hash  = await bcrypt.hash(PLAIN, 10);
    const match = await bcrypt.compare(PLAIN, hash);
    expect(match).toBe(true);
  });

  it('should reject incorrect password', async () => {
    const hash  = await bcrypt.hash(PLAIN, 10);
    const match = await bcrypt.compare(WRONG, hash);
    expect(match).toBe(false);
  });

  it('should produce different hashes for same password (salt)', async () => {
    const hash1 = await bcrypt.hash(PLAIN, 10);
    const hash2 = await bcrypt.hash(PLAIN, 10);
    expect(hash1).not.toBe(hash2);
    // Both should still verify
    expect(await bcrypt.compare(PLAIN, hash1)).toBe(true);
    expect(await bcrypt.compare(PLAIN, hash2)).toBe(true);
  });
});
