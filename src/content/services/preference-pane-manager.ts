import type { Service, ServiceParams } from './service';

export class PreferencePaneManager implements Service {
  private paneID?: string;

  public async startup({ pluginInfo: { pluginID, rootURI } }: ServiceParams) {
    this.paneID = await Zotero.PreferencePanes.register({
      pluginID,
      src: rootURI + 'content/prefs/preferences.xhtml',
      scripts: [rootURI + 'content/prefs/preferences.js'],
      stylesheets: [rootURI + 'content/style/preferences.css'],
      helpURL: 'https://github.com/dvanoni/notero#readme',
    });
  }

  public openPreferences() {
    Zotero.Utilities.Internal.openPreferences(this.paneID);
  }
}
