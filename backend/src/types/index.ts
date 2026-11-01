// src/types/index.ts — Shared TypeScript interfaces
import { Request } from 'express';
import { Role } from '@prisma/client';

// Authenticated user payload attached to req.user
export interface AuthPayload {
  id: string;
  email: string;
  role: Role;
  name: string;
}

// Express Request extended with auth user
export interface AuthRequest extends Request {
  user?: AuthPayload;
}

// Standard API response shape
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: PaginationMeta;
  errors?: ValidationError[];
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
}

// JWT Payload
export interface JwtPayload {
  id: string;
  email: string;
  role: Role;
  name: string;
  iat?: number;
  exp?: number;
}

// Multer file with Cloudinary fields
export interface CloudinaryFile extends Express.Multer.File {
  path: string;      // Cloudinary secure URL
  filename: string;  // Cloudinary public_id
}
