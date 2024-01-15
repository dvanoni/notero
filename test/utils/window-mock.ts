import { JSDOM } from 'jsdom';

export function createWindowMock(): Zotero.ZoteroWindow {
  const dom = new JSDOM();
  return dom.window as unknown as Zotero.ZoteroWindow;
}
