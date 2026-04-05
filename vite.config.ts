import { defineConfig } from 'vite-plus';

// oxlint-disable-next-line import/no-default-export
export default defineConfig({
  staged: {
    'src/locale/en-US/notero.ftl': [
      'vp run generate-fluent-types',
      'git add src/locale/fluent-types.ts',
    ],
    '*': 'vp check --fix',
  },
  lint: {
    plugins: [
      'eslint',
      'import',
      'jest',
      'oxc',
      'react',
      'typescript',
      'unicorn',
      'vitest',
    ],
    categories: {
      correctness: 'error',
      suspicious: 'warn',
    },
    options: {
      reportUnusedDisableDirectives: 'error',
      typeAware: true,
      typeCheck: true,
    },
    env: {
      'shared-node-browser': true,
      es2022: true,
    },
    ignorePatterns: ['build', 'gen'],
    rules: {
      'import/no-default-export': 'error',
      'no-console': 'error',
      'typescript/no-explicit-any': 'error',
      'typescript/no-invalid-void-type': [
        'error',
        { allowAsThisParameter: true },
      ],
      'typescript/no-misused-promises': 'error',
      'typescript/no-non-null-assertion': 'error',
      'typescript/no-unsafe-return': 'error',
    },
    overrides: [
      {
        files: ['scripts/**'],
        rules: {
          'no-console': 'off',
        },
      },
    ],
  },
  fmt: {
    singleQuote: true,
    printWidth: 80,
    sortImports: {
      groups: [
        'builtin',
        'external',
        ['internal', 'subpath'],
        'parent',
        ['sibling', 'index'],
        'style',
        'unknown',
      ],
    },
    sortPackageJson: true,
    ignorePatterns: ['CHANGELOG.md'],
  },
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
