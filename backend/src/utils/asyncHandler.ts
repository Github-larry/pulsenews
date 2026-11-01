// src/utils/asyncHandler.ts — Wraps async route handlers to forward errors
import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncFn = (req: Request, res: Response, next: NextFunction) => Promise<void>;

/**
 * Wraps an async Express handler so unhandled promise rejections
 * are forwarded to the global error handler via next(err).
 */
export const asyncHandler = (fn: AsyncFn): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
