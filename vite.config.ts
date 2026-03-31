import { defineConfig } from 'vite-plus';

// oxlint-disable-next-line import/no-default-export
export default defineConfig({
  staged: {
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
      'typescript/no-invalid-void-type': [
        'error',
        { allowAsThisParameter: true },
      ],
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
    sortPackageJson: false,
    ignorePatterns: ['CHANGELOG.md'],
  },
});
