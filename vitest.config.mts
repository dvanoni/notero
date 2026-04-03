import { defineConfig } from 'vite-plus';

// oxlint-disable-next-line import-x/no-default-export
export default defineConfig({
  test: {
    clearMocks: true,
    environment: 'jsdom',
    expect: {
      requireAssertions: true,
    },
    // Adding `server.deps.inline: ['vitest-mock-extended']` tells Vitest to
    // process this package through Vite's transform pipeline instead of
    // loading it as an external. This allows Vitest to properly intercept the
    // `import { vi } from 'vitest'` inside `vitest-mock-extended` and provide
    // the correct context-aware `vi` instance.
    server: {
      deps: {
        inline: ['vitest-mock-extended'],
      },
    },
    setupFiles: 'test/setup-tests.ts',
  },
});
