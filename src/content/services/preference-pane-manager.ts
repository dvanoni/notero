import type { Service, ServiceParams } from './service';

export class PreferencePaneManager implements Service {
  private paneID?: string;

  public async startup({ pluginInfo: { pluginID } }: ServiceParams) {
    this.paneID = await Zotero.PreferencePanes.register({
      pluginID,
      src: 'content/prefs/preferences.xhtml',
      scripts: ['content/prefs/preferences.js'],
      stylesheets: ['content/style/preferences.css'],
      helpURL: 'https://github.com/dvanoni/notero#readme',
    });
  }

  public openPreferences() {
    Zotero.Utilities.Internal.openPreferences(this.paneID);
  }
}
