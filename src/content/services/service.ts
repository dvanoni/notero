import type { PluginInfo } from '../plugin-info';

import type { EventManager } from './event-manager';

type Dependencies = {
  eventManager: EventManager;
};

export type ServiceParams = {
  dependencies: Dependencies;
  pluginInfo: PluginInfo;
};

export interface Service {
  startup(params: ServiceParams): void;
  shutdown?(): void;
}
