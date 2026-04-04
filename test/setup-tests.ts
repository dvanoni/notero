import { vi } from 'vite-plus/test';
import { mockDeep } from 'vitest-mock-extended';

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

// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const mockedGlobal = global as MockedGlobal;

mockedGlobal.Components = mockDeep<typeof Components>();
mockedGlobal.Cc = Components.classes;
mockedGlobal.Ci = Components.interfaces;
mockedGlobal.Cu = Components.utils;
mockedGlobal.ChromeUtils = Components.utils;
mockedGlobal.Services = mockDeep<typeof Services>();
mockedGlobal.Zotero = mockDeep<typeof Zotero>();

vi.mock('../src/content/utils/logger', () => ({
  logger: mockDeep<typeof logger>(),
}));
