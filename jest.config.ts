import type { Config } from 'jest';

/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */

const config: Config = {
  clearMocks: true,
  errorOnDeprecated: true,
  preset: 'ts-jest',
  setupFilesAfterEnv: ['<rootDir>/test/setup-tests.ts'],
  testEnvironment: 'jsdom',
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
};

// eslint-disable-next-line import/no-default-export
export default config;
