// src/utils/response.ts — Standardised API response helpers
import { Response } from 'express';
import { ApiResponse, PaginationMeta } from '../types';

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
  meta?: PaginationMeta
): void {
  const payload: ApiResponse<T> = { success: true, message, data };
  if (meta) payload.meta = meta;
  res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 400,
  errors?: { field: string; message: string }[]
): void {
  const payload: ApiResponse = { success: false, message };
  if (errors) payload.errors = errors;
  res.status(statusCode).json(payload);
}

export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
