import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: [
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
      'src/tests/stories/**/*.test.ts',
    ],
    testTimeout: 30000,
    env: {
      USE_MOCK_BACKEND: 'true',
    },
    setupFiles: ['./src/tests/setup.ts'],
  },
  resolve: {
    alias: [
      { find: '@/contest', replacement: resolve(__dirname, 'src/features/contest') },
      { find: '@/src', replacement: resolve(__dirname, 'src') },
      { find: '@/components', replacement: resolve(__dirname, 'src/components') },
      { find: '@/features', replacement: resolve(__dirname, 'src/features') },
      { find: '@/lib', replacement: resolve(__dirname, 'src/lib') },
      { find: '@', replacement: resolve(__dirname, './') },
    ],
  },
});
