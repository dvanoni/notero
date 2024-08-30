import { TextEncoder, TextDecoder } from 'util';

import { mockDeep } from 'jest-mock-extended';

import type { logger } from '../src/content/utils/logger';

type MockedGlobal = typeof globalThis & {
  Components: typeof Components;
  Cc: typeof Components.classes;
  Ci: typeof Components.interfaces;
  Cu: typeof Components.utils;
  ChromeUtils: typeof Components.utils;
  Services: typeof Services;
  Zotero: typeof Zotero;
};

const mockedGlobal = global as MockedGlobal;

mockedGlobal.Components = mockDeep<typeof Components>();
mockedGlobal.Cc = Components.classes;
mockedGlobal.Ci = Components.interfaces;
mockedGlobal.Cu = Components.utils;
mockedGlobal.ChromeUtils = Components.utils;
mockedGlobal.Services = mockDeep<typeof Services>();
mockedGlobal.Zotero = mockDeep<typeof Zotero>();

// Workaround for https://github.com/jsdom/jsdom/issues/2524
mockedGlobal.TextEncoder = TextEncoder;
// @ts-expect-error The types don't match
mockedGlobal.TextDecoder = TextDecoder;

jest.mock('../src/content/utils/logger', () => ({
  logger: mockDeep<typeof logger>(),
}));
