import type { Config } from 'jest';

/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */

const config: Config = {
  clearMocks: true,
  errorOnDeprecated: true,
  preset: 'ts-jest',
  rootDir: 'src',
  testEnvironment: 'node',
};

// eslint-disable-next-line import/no-default-export
export default config;
