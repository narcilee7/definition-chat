import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', 'test/'],
    },
  },
  resolve: {
    alias: {
      '@ohme/prompts': path.resolve(__dirname, '../../packages/prompts/dist'),
      '@ohme/agent-framework': path.resolve(__dirname, '../../packages/agent-framework/dist'),
      '@ohme/types': path.resolve(__dirname, '../../packages/types/src'),
    },
  },
});
