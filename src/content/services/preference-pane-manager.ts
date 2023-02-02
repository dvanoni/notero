import type { PluginInfo, Service } from './service';

export default class PreferencePaneManager implements Service {
  public startup({ pluginID, rootURI }: PluginInfo) {
    void Zotero.PreferencePanes.register({
      pluginID,
      src: rootURI + 'content/preferences.xhtml',
      scripts: [rootURI + 'content/preferences.js'],
      stylesheets: [rootURI + 'content/style/preferences.css'],
      extraDTD: ['chrome://notero/locale/notero.dtd'],
      helpURL: 'https://github.com/dvanoni/notero#readme',
    });
  }
}
