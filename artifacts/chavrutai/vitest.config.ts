/**
 * Standalone Vitest config.
 *
 * Deliberately does NOT reuse vite.config.ts: that config throws unless
 * PORT and BASE_PATH env vars are set (dev-server concerns that are
 * irrelevant to unit tests). With this file present, `pnpm test` works
 * with no environment setup.
 */
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@shared': path.resolve(import.meta.dirname, 'src/shared'),
    },
  },
});
