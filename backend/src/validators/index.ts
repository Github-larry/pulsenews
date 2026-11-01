// src/validators/index.ts — Input validation chains
import { body, param, query } from 'express-validator';

// ── Auth validators ───────────────────────────────────────────

export const registerValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters')
    .matches(/^[a-zA-Z\s'-]+$/).withMessage('Name contains invalid characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage('Email too long'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8, max: 128 }).withMessage('Password must be 8–128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase, one lowercase, and one number'),

  body('country')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Country name too long')
    .matches(/^[a-zA-Z\s'-]+$/).withMessage('Invalid country name'),
];

export const loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),
];

// ── Post validators ───────────────────────────────────────────

export const createPostValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 10, max: 255 }).withMessage('Title must be 10–255 characters'),

  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 50, max: 10000 }).withMessage('Description must be 50–10,000 characters'),

  body('category')
    .trim()
    .notEmpty().withMessage('Category is required')
    .isIn(['Politics', 'Business', 'Technology', 'Health', 'Sports', 'Culture', 'Environment', 'Crime', 'Other'])
    .withMessage('Invalid category'),

  body('location')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Location too long'),
];

export const commentValidator = [
  body('content')
    .trim()
    .notEmpty().withMessage('Comment cannot be empty')
    .isLength({ min: 1, max: 1000 }).withMessage('Comment must be 1–1000 characters'),
];

export const reportValidator = [
  body('reason')
    .notEmpty().withMessage('Reason is required')
    .isIn(['SPAM', 'MISINFORMATION', 'HATE_SPEECH', 'VIOLENCE', 'COPYRIGHT', 'OTHER'])
    .withMessage('Invalid reason'),

  body('details')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Details too long'),
];

// ── Pagination validator ──────────────────────────────────────

export const paginationValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limit must be 1–50')
    .toInt(),
];

// ── Param validators ──────────────────────────────────────────

export const cuidParamValidator = (paramName: string) => [
  param(paramName)
    .notEmpty().withMessage(`${paramName} is required`)
    .isLength({ min: 1, max: 50 }).withMessage(`Invalid ${paramName}`),
];
