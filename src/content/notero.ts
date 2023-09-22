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

    this.startServices(pluginInfo);
    this.addToAllWindows();
  }

  public shutdown() {
    this.removeFromAllWindows();
    this.shutDownServices();
  }

  private startServices(pluginInfo: PluginInfo) {
    const dependencies = { eventManager: this.eventManager };

    this.services.forEach((service) => {
      log(`Starting ${service.constructor.name}`);
      service.startup({ dependencies, pluginInfo });
    });
  }

  private shutDownServices() {
    [...this.services].reverse().forEach((service) => {
      if (!service.shutdown) return;
      log(`Shutting down ${service.constructor.name}`);
      service.shutdown();
    });
  }

  private addToAllWindows() {
    Zotero.getMainWindows().forEach((window) => {
      if (!window.ZoteroPane) return;
      this.addToWindow(window);
    });
  }

  public addToWindow(window: Zotero.ZoteroWindow) {
    this.services.forEach((service) => {
      if (!service.addToWindow) return;
      log(`Adding ${service.constructor.name} to window`);
      service.addToWindow(window);
    });
  }

  private removeFromAllWindows() {
    Zotero.getMainWindows().forEach((window) => {
      if (!window.ZoteroPane) return;
      this.removeFromWindow(window);
    });
  }

  public removeFromWindow(window: Zotero.ZoteroWindow) {
    this.services.forEach((service) => {
      if (!service.removeFromWindow) return;
      log(`Removing ${service.constructor.name} from window`);
      service.removeFromWindow(window);
    });
  }
}

(Zotero as Zotero & { Notero: Notero }).Notero = new Notero();
