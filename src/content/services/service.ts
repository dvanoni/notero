import type { PluginInfo } from '../plugin-info';

import type { EventManager, PreferencePaneManager, WindowManager } from '.';

type Dependencies = {
  eventManager: EventManager;
  preferencePaneManager: PreferencePaneManager;
  windowManager: WindowManager;
};

export type ServiceParams<D extends keyof Dependencies = never> = {
  dependencies: Pick<Dependencies, D>;
  pluginInfo: PluginInfo;
};

export interface Service {
  startup(params: ServiceParams): void | Promise<void>;
  shutdown?(): void;
  addToWindow?(window: Zotero.ZoteroWindow): void;
  removeFromWindow?(window: Zotero.ZoteroWindow): void;
}
