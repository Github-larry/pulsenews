// src/utils/jwt.ts — JWT sign and verify helpers
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayload } from '../types';

export function signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    issuer: 'pulsenews-api',
    audience: 'pulsenews-client',
  } as jwt.SignOptions);
}

export function signRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    issuer: 'pulsenews-api',
    audience: 'pulsenews-client',
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET, {
    issuer: 'pulsenews-api',
    audience: 'pulsenews-client',
  }) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, {
    issuer: 'pulsenews-api',
    audience: 'pulsenews-client',
  }) as JwtPayload;
}

// Calculates expiry in milliseconds for cookie maxAge
export function getRefreshTokenExpiry(): number {
  // 7 days in ms
  return 7 * 24 * 60 * 60 * 1000;
}
