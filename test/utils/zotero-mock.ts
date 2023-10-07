import { DeepMockProxy } from 'jest-mock-extended';

export const zoteroMock = Zotero as DeepMockProxy<typeof Zotero>;

export function mockZoteroPrefs() {
  const prefsStore = new Map<string, Zotero.Prefs.Value>();

  zoteroMock.Prefs.get.mockImplementation(prefsStore.get.bind(prefsStore));
  zoteroMock.Prefs.set.mockImplementation(prefsStore.set.bind(prefsStore));
}
