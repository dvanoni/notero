import { describe, expect, it } from 'vitest';
import { DeepMockProxy, mock } from 'vitest-mock-extended';

import type { NotionAuthManager } from '../../auth';
import { logger } from '../../utils';
import {
  ProtocolHandlerExtension,
  parseHandlerNameFromPathname,
} from '../protocol-handler-extension';

const pluginInfo = {
  pluginID: 'test',
  rootURI: 'test',
  version: 'test',
};

function setup() {
  const zoteroProtocolHandler = mock<Zotero.ZoteroProtocolHandler>();
  const servicesMock = Services as DeepMockProxy<typeof Services>;
  servicesMock.io.getProtocolHandler.mockReturnValue(
    mock<XPCOM.nsIProtocolHandler>({ wrappedJSObject: zoteroProtocolHandler }),
  );

  const notionAuthManager = mock<NotionAuthManager>();
  const protocolHandlerExtension = new ProtocolHandlerExtension();

  const dependencies = { notionAuthManager };

  protocolHandlerExtension.startup({ dependencies, pluginInfo });

  return { notionAuthManager, protocolHandlerExtension, zoteroProtocolHandler };
}

describe('parseHandlerNameFromPathname', () => {
  // Zotero 7 behavior
  it('returns handler name when host and pathname are present', () => {
    const handlerName = parseHandlerNameFromPathname('//notero/notion-auth');
    expect(handlerName).toBe('notion-auth');
  });

  // Zotero 7 behavior
  it('returns undefined when only host is present', () => {
    const handlerName = parseHandlerNameFromPathname('//notero');
    expect(handlerName).toBeUndefined();
  });

  // Zotero 8 behavior
  it('returns handler name when only pathname is present', () => {
    const handlerName = parseHandlerNameFromPathname('/notion-auth');
    expect(handlerName).toBe('notion-auth');
  });

  // Zotero 8 behavior
  it('returns undefined when pathname is empty', () => {
    const handlerName = parseHandlerNameFromPathname('');
    expect(handlerName).toBeUndefined();
  });
});

describe('ProtocolHandlerExtension', () => {
  it('registers upon startup', () => {
    const { zoteroProtocolHandler } = setup();

    expect(zoteroProtocolHandler._extensions['zotero://notero']).toBeTruthy();
  });

  it('unregisters upon shutdown', () => {
    const { protocolHandlerExtension, zoteroProtocolHandler } = setup();

    expect(zoteroProtocolHandler._extensions['zotero://notero']).toBeTruthy();

    protocolHandlerExtension.shutdown();

    expect(
      zoteroProtocolHandler._extensions['zotero://notero'],
    ).toBeUndefined();
  });

  it('logs warning if no handler matches URI', () => {
    const { zoteroProtocolHandler } = setup();

    const uri = mock<XPCOM.nsIURI>({ spec: 'zotero://notero/bogus' });

    zoteroProtocolHandler._extensions['zotero://notero']?.newChannel(uri, {});

    expect(logger.warn).toHaveBeenCalledWith('No handler with name:', 'bogus');
  });

  it('calls NotionAuthManager.handleTokenResponse with provided URI params', () => {
    const { notionAuthManager, zoteroProtocolHandler } = setup();

    const uri = mock<XPCOM.nsIURI>({
      spec: 'zotero://notero/notion-auth?key1=val1&key2=val2',
    });

    zoteroProtocolHandler._extensions['zotero://notero']?.newChannel(uri, {});

    const expectedParams = new URLSearchParams({ key1: 'val1', key2: 'val2' });

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(notionAuthManager.handleTokenResponse).toHaveBeenCalledWith(
      expectedParams,
    );
  });
});
