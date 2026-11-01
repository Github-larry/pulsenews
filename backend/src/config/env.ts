import dotenv from 'dotenv';
dotenv.config();
const req = (k: string) => { const v = process.env[k]; if (!v) throw new Error(`Missing: ${k}`); return v; };
const opt = (k: string, fb = '') => process.env[k] ?? fb;
export const env = {
  NODE_ENV: opt('NODE_ENV','development'),
  PORT:     parseInt(opt('PORT','5000'),10),
  IS_PROD:  process.env.NODE_ENV === 'production',
  IS_DEV:   process.env.NODE_ENV !== 'production',
  DATABASE_URL:           req('DATABASE_URL'),
  JWT_SECRET:             req('JWT_SECRET'),
  JWT_REFRESH_SECRET:     req('JWT_REFRESH_SECRET'),
  JWT_EXPIRES_IN:         opt('JWT_EXPIRES_IN','15m'),
  JWT_REFRESH_EXPIRES_IN: opt('JWT_REFRESH_EXPIRES_IN','7d'),
  CLOUDINARY_CLOUD_NAME:  opt('CLOUDINARY_CLOUD_NAME'),
  CLOUDINARY_API_KEY:     opt('CLOUDINARY_API_KEY'),
  CLOUDINARY_API_SECRET:  opt('CLOUDINARY_API_SECRET'),
  ALLOWED_ORIGINS: opt('ALLOWED_ORIGINS','http://localhost:3000').split(',').map(o=>o.trim()),
  RATE_LIMIT_WINDOW_MS: parseInt(opt('RATE_LIMIT_WINDOW_MS','900000'),10),
  RATE_LIMIT_MAX:       parseInt(opt('RATE_LIMIT_MAX','100'),10),
  COOKIE_SECRET: req('COOKIE_SECRET'),
  FRONTEND_URL:  opt('FRONTEND_URL','http://localhost:3000'),
} as const;
