import type { PluginInfo } from '../plugin-info';

import type { EventManager } from './event-manager';
import type { WindowManager } from './window-manager';

type Dependencies = {
  eventManager: EventManager;
  windowManager: WindowManager;
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
