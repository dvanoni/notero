import type { NotionAuthManager } from '../auth';
import { logger } from '../utils';

import type { Service, ServiceParams } from './service';

const ZOTERO_SCHEME = 'zotero';
const NOTERO_HOST = '//notero';
const EXTENSION_SPEC = `${ZOTERO_SCHEME}:${NOTERO_HOST}`;

/**
 * Parse the handler name from the pathname of a URL.
 *
 * Note: Zotero 7 and Zotero 8 parse URLs differently.
 * For example, the URL `zotero://notero/notion-auth` results in the following:
 * - Zotero 7: `{ host: '', pathname: '//notero/notion-auth' }`
 * - Zotero 8: `{ host: 'notero', pathname: '/notion-auth' }`
 *
 * @param pathname The pathname of the URL.
 * @returns The handler name or undefined if the pathname is empty.
 *
 * @todo Simplify regex if dropping support for Zotero 7.
 */
export function parseHandlerNameFromPathname(
  pathname: string,
): string | undefined {
  const matches = pathname.match(`^(?:${NOTERO_HOST}/|/)([^/]+)`);
  return matches?.[1];
}

export class ProtocolHandlerExtension implements Service {
  private notionAuthManager!: NotionAuthManager;
  private zoteroProtocolHandler?: Zotero.ZoteroProtocolHandler;

  public startup({ dependencies }: ServiceParams<'notionAuthManager'>) {
    this.notionAuthManager = dependencies.notionAuthManager;
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
      logger.debug('Protocol handler extension received URI:', uri.spec);
      await this.invokeHandlerForURL(new URL(uri.spec));
    },
    newChannel: (uri) => {
      void this.extension.doAction(uri);
    },
    noContent: true,
  };

  private async invokeHandlerForURL(url: URL): Promise<void> {
    const handlerName = parseHandlerNameFromPathname(url.pathname);
    if (!handlerName) {
      logger.warn('Failed to parse handler name from URL');
      return;
    }

    const handler = this.handlers[handlerName];
    if (!handler) {
      logger.warn('No handler with name:', handlerName);
      return;
    }

    logger.debug('Invoking handler:', handlerName);
    try {
      await handler(url);
    } catch (error) {
      logger.error(`Error in ${handlerName} handler:`, error);
    }
  }

  private handlers: Record<string, (url: URL) => void | Promise<void>> = {
    'notion-auth': async (url) => {
      await this.notionAuthManager.handleTokenResponse(url.searchParams);
    },
  };
}
