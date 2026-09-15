import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    globals: false,
    setupFiles: ['tests/helpers/setup.integration.ts'],
    // Integration tests need real DB/Redis — longer timeouts
    testTimeout: 30000,
    hookTimeout: 30000,
    // Run serially to avoid DB concurrency issues in tests
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
