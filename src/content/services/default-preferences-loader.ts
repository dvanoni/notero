import { log } from '../utils';

import type { PluginInfo, Service } from './service';

const branch = Services.prefs.getDefaultBranch('');

const prefsContext = {
  pref(name: string, value: unknown) {
    switch (typeof value) {
      case 'boolean':
        branch.setBoolPref(name, value);
        break;
      case 'number':
        branch.setIntPref(name, value);
        break;
      case 'string':
        branch.setStringPref(name, value);
        break;
      default:
        log(`Invalid type '${typeof value}' for pref '${name}'`);
    }
  },
};

/**
 * Loads default preferences from prefs.js in Zotero 6.
 * @see https://groups.google.com/g/zotero-dev/c/HI7itFdtws4
 * @see https://www.zotero.org/support/dev/zotero_7_for_developers#default_preferences
 */
export class DefaultPreferencesLoader implements Service {
  public startup({ rootURI }: PluginInfo) {
    Services.scriptloader.loadSubScript(rootURI + 'prefs.js', prefsContext);
  }
}
