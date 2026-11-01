// src/config/prisma.ts — Singleton Prisma client
// Prevents multiple instances during hot-reload in development
import { PrismaClient } from '@prisma/client';
import { env } from './env';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.IS_DEV ? ['query', 'error', 'warn'] : ['error'],
  });

if (env.IS_DEV) globalForPrisma.prisma = prisma;

export default prisma;
