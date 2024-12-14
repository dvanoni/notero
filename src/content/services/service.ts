import type { NotionAuthManager } from '../auth';
import type { PluginInfo } from '../plugin-info';

import type { EventManager, PreferencePaneManager } from '.';

type Dependencies = {
  eventManager: EventManager;
  notionAuthManager: NotionAuthManager;
  preferencePaneManager: PreferencePaneManager;
};

export type ServiceParams = {
  dependencies: Dependencies;
  pluginInfo: PluginInfo;
};

export interface Service {
  startup(params: ServiceParams): void | Promise<void>;
  shutdown?(): void;
  addToWindow?(window: Zotero.ZoteroWindow): void;
  removeFromWindow?(window: Zotero.ZoteroWindow): void;
}
