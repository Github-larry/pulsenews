// src/__tests__/setup.ts — Jest global test setup
import { prisma } from '../config/prisma';

// Clean up database connections after all tests
afterAll(async () => {
  await prisma.$disconnect();
});

// Silence console logs during tests (remove if you want verbose output)
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error output for debugging failures
  error: console.error,
};
