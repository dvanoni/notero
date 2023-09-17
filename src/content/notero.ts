import { IS_ZOTERO_7 } from './constants';
import type { PluginInfo } from './plugin-info';
import {
  ChromeManager,
  DefaultPreferencesLoader,
  EventManager,
  PreferencePaneManager,
  Service,
  SyncManager,
  UIManager,
} from './services';
import { log } from './utils';

if (!IS_ZOTERO_7) {
  Cu.importGlobalProperties(['URL']);
}

export class Notero {
  private readonly eventManager: EventManager;
  private readonly services: Service[];

  public constructor() {
    this.eventManager = new EventManager();

    this.services = [
      ...(IS_ZOTERO_7
        ? [new ChromeManager(), new PreferencePaneManager()]
        : [new DefaultPreferencesLoader()]),
      this.eventManager,
      new SyncManager(),
      new UIManager(),
    ];
  }

  public async startup(pluginInfo: PluginInfo) {
    await Zotero.uiReadyPromise;

    const dependencies = {
      eventManager: this.eventManager,
      window: Zotero.getMainWindow(),
    };

    this.services.forEach((service) => {
      log(`Starting ${service.constructor.name}`);
      service.startup({ dependencies, pluginInfo });
    });
  }

  public shutdown() {
    [...this.services].reverse().forEach((service) => {
      if (service.shutdown) {
        log(`Shutting down ${service.constructor.name}`);
        service.shutdown();
      }
    });
  }
}

(Zotero as Zotero & { Notero: Notero }).Notero = new Notero();
