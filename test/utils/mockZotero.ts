import { mockDeep } from 'jest-mock-extended';

export function mockZotero() {
  const zoteroMock = mockDeep<Zotero>();
  (global as typeof globalThis & { Zotero: Zotero }).Zotero = zoteroMock;
  return zoteroMock;
}
