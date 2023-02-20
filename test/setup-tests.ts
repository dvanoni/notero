import { mockDeep } from 'jest-mock-extended';

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
