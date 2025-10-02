import { defineConfig } from 'vitest/config';

// eslint-disable-next-line import-x/no-default-export
export default defineConfig({
  test: {
    clearMocks: true,
    environment: 'jsdom',
    expect: {
      requireAssertions: true,
    },
    setupFiles: 'test/setup-tests.ts',
  },
});
