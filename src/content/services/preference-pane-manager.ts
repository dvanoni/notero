import { IS_ZOTERO_7 } from '../constants';

import type { Service, ServiceParams } from './service';

export class PreferencePaneManager implements Service {
  private paneID?: string;

  public async startup({ pluginInfo: { pluginID, rootURI } }: ServiceParams) {
    if (!IS_ZOTERO_7) return;

    this.paneID = await Zotero.PreferencePanes.register({
      pluginID,
      src: rootURI + 'content/prefs/preferences.xhtml',
      scripts: [rootURI + 'content/prefs/preferences.js'],
      stylesheets: [rootURI + 'content/style/preferences.css'],
      helpURL: 'https://github.com/dvanoni/notero#readme',
    });
  }

  public openPreferences(window: Zotero.ZoteroWindow) {
    if (IS_ZOTERO_7) {
      Zotero.Utilities.Internal.openPreferences(this.paneID);
    } else {
      window.openDialog(
        'chrome://notero/content/prefs/preferences.xul',
        'notero-preferences',
      );
    }
  }
}
