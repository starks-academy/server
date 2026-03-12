// Global test setup
// This file runs before all tests

// Set test environment
process.env.NODE_ENV = 'test';

// Increase timeout for E2E tests
jest.setTimeout(30000);

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error for debugging
  error: console.error,
};
