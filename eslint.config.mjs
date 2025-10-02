import eslint from '@eslint/js';
import pluginVitest from '@vitest/eslint-plugin';
import { defineConfig } from 'eslint/config';
import configPrettier from 'eslint-config-prettier';
import { importX } from 'eslint-plugin-import-x';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// eslint-disable-next-line import-x/no-default-export
export default defineConfig(
  { files: ['**/*.{js,cjs,mjs,ts,mts,tsx}'] },
  { ignores: ['build', 'gen'] },
  eslint.configs.recommended,
  // @ts-expect-error https://github.com/typescript-eslint/typescript-eslint/issues/11543
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,
  // eslint-disable-next-line import-x/no-named-as-default-member
  ...tseslint.configs.strictTypeChecked,
  configPrettier,
  {
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    settings: {
      'import/resolver': {
        node: true,
        typescript: true,
      },
    },
  },
  {
    files: ['**/__tests__/**', '**/*.spec.*'],
    ...pluginVitest.configs.recommended,
  },
  {
    rules: {
      '@typescript-eslint/no-invalid-void-type': [
        'error',
        { allowAsThisParameter: true },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true },
      ],
      '@typescript-eslint/unbound-method': ['error', { ignoreStatic: true }],
      'import-x/no-extraneous-dependencies': 'error',
      'import-x/no-default-export': 'error',
      'import-x/order': [
        'error',
        {
          alphabetize: { order: 'asc' },
          'newlines-between': 'always',
          warnOnUnassignedImports: true,
        },
      ],
      'no-console': 'error',
    },
  },
  {
    files: ['scripts/**'],
    rules: {
      'import-x/no-named-as-default-member': 'off',
      'no-console': 'off',
    },
  },
);
