import type { Service, ServiceParams } from './service';

export class PreferencePaneManager implements Service {
  public startup({ pluginInfo: { pluginID, rootURI } }: ServiceParams) {
    void Zotero.PreferencePanes.register({
      pluginID,
      src: rootURI + 'content/prefs/preferences.xhtml',
      scripts: [rootURI + 'content/prefs/preferences.js'],
      stylesheets: [rootURI + 'content/style/preferences.css'],
      helpURL: 'https://github.com/dvanoni/notero#readme',
    });
  }
}
