import { DeepMockProxy } from 'jest-mock-extended';

export const zoteroMock = Zotero as DeepMockProxy<typeof Zotero>;
