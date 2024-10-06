declare module 'eslint-plugin-jest' {
  import type { TSESLint } from '@typescript-eslint/utils';

  const configs: {
    'flat/all': TSESLint.FlatConfig.Config;
    'flat/recommended': TSESLint.FlatConfig.Config;
    'flat/style': TSESLint.FlatConfig.Config;
  };
}
