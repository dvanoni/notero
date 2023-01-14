import type { PluginInfo, Service } from './service';

export default class PreferencePaneManager implements Service {
  public startup({ pluginID, rootURI }: PluginInfo) {
    void Zotero.PreferencePanes.register({
      pluginID,
      src: rootURI + 'content/prefs.xhtml',
      scripts: [rootURI + 'content/preferences.js'],
      helpURL: 'https://github.com/dvanoni/notero#readme',
    });
  }
}
