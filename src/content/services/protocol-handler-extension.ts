import type { OauthTokenResponse } from '@notionhq/client/build/src/api-endpoints';

import { isObject, logger } from '../utils';

import type { PreferencePaneManager, Service, ServiceParams } from '.';

const ZOTERO_SCHEME = 'zotero';
const NOTERO_PATH = '//notero';
const EXTENSION_SPEC = `${ZOTERO_SCHEME}:${NOTERO_PATH}`;

export class ProtocolHandlerExtension implements Service {
  private preferencesPaneManager!: PreferencePaneManager;
  private zoteroProtocolHandler?: Zotero.ZoteroProtocolHandler;

  public startup({
    dependencies: { preferencePaneManager },
  }: ServiceParams<'preferencePaneManager'>) {
    this.preferencesPaneManager = preferencePaneManager;
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
    doAction: (uri) => {
      logger.debug('Protocol extension received URI:', uri.spec);
      const url = new URL(uri.spec);

      const matches = url.pathname.match(`${NOTERO_PATH}/(.+)`);
      if (!matches?.[1]) return;

      const handler = this.handlers[matches[1]];
      if (!handler) return;

      logger.debug('Invoking handler:', matches[1]);
      handler(url);
    },
    newChannel: (uri) => {
      this.extension.doAction(uri);
    },
    noContent: true,
  };

  private handlers: Record<string, (url: URL) => void> = {
    'notion-auth': (url) => {
      const tokenResponse = this.getTokenResponse(url);

      const preferencesWindow = this.preferencesPaneManager.openPreferences();
      if (preferencesWindow) {
        preferencesWindow.alert(
          `Connected to Notion workspace: ${tokenResponse.workspace_name}`,
        );
      }
    },
  };

  private getTokenResponse(url: URL): OauthTokenResponse {
    const param = url.searchParams.get('tokenResponse');
    if (!param) throw new Error('No token response in URL');

    const parsedValue = JSON.parse(window.atob(param));
    if (isObject(parsedValue) && parsedValue.access_token) {
      return parsedValue as OauthTokenResponse;
    }
    throw new Error('Invalid token response');
  }
}
