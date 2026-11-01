// src/config/logger.ts — Winston structured logging
import winston from 'winston';
import { env } from './env';

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

const devFormat = printf(({ level, message, timestamp: ts, stack }) => {
  return `${ts} [${level}]: ${stack || message}`;
});

export const logger = winston.createLogger({
  level: env.IS_DEV ? 'debug' : 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true })
  ),
  transports: [
    // Console output
    new winston.transports.Console({
      format: env.IS_DEV
        ? combine(colorize(), devFormat)
        : combine(json()),
    }),
    // Error log file
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: combine(json()),
    }),
    // Combined log file
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: combine(json()),
    }),
  ],
});
