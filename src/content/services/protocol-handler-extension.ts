import { getGlobalNotero, logger } from '../utils';

import type { Service } from './service';

const ZOTERO_SCHEME = 'zotero';
const NOTERO_PATH = '//notero';
const EXTENSION_SPEC = `${ZOTERO_SCHEME}:${NOTERO_PATH}`;

export class ProtocolHandlerExtension implements Service {
  private zoteroProtocolHandler?: Zotero.ZoteroProtocolHandler;

  public startup() {
    this.registerExtension();
  }

  public shutdown() {
    this.unregisterExtension();
  }

  private registerExtension() {
    const protocolHandler =
      Services.io.getProtocolHandler(ZOTERO_SCHEME).wrappedJSObject;

    if (!protocolHandler) {
      logger.error('Failed to get Zotero protocol handler');
      return;
    }

    this.zoteroProtocolHandler =
      protocolHandler as Zotero.ZoteroProtocolHandler;

    this.zoteroProtocolHandler._extensions[EXTENSION_SPEC] = this.extension;
  }

  private unregisterExtension() {
    if (!this.zoteroProtocolHandler) return;
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete this.zoteroProtocolHandler._extensions[EXTENSION_SPEC];
  }

  private extension: Zotero.ZoteroProtocolHandlerExtension = {
    doAction: async (uri) => {
      logger.debug('Protocol extension received URI:', uri.spec);
      const url = new URL(uri.spec);

      const matches = url.pathname.match(`${NOTERO_PATH}/(.+)`);
      const handlerName = matches?.[1];
      if (!handlerName) return;

      const handler = this.handlers[handlerName];
      if (!handler) return;

      logger.debug('Invoking handler:', handlerName);
      try {
        await handler(url);
      } catch (error) {
        logger.error(`Error in ${handlerName} handler:`, error);
      }
    },
    newChannel: (uri) => {
      void this.extension.doAction(uri);
    },
    noContent: true,
  };

  private handlers: Record<string, (url: URL) => void | Promise<void>> = {
    'notion-auth': async (url) => {
      const key = url.searchParams.get('key');
      const iv = url.searchParams.get('iv');
      const tokenResponse = url.searchParams.get('tokenResponse');
      if (!key || !iv || !tokenResponse) {
        throw new Error('Invalid access token parameters');
      }
      const encryptedTokenResponse = { key, iv, tokenResponse };
      await getGlobalNotero().notionAuthManager.handleTokenResponse(
        encryptedTokenResponse,
      );
    },
  };
}
