import type { Client } from '@notionhq/client';

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
  WindowManager,
} from './services';
import { findDuplicates } from './sync/find-duplicates';
import { getNotionClient } from './sync/notion-client';
import { log } from './utils';

if (!IS_ZOTERO_7) {
  Cu.importGlobalProperties(['URL']);
}

export class Notero {
  private readonly eventManager: EventManager;
  private readonly windowManager: WindowManager;
  private readonly services: Service[];

  public constructor() {
    this.eventManager = new EventManager();
    this.windowManager = new WindowManager();

    this.services = [
      ...(IS_ZOTERO_7
        ? [new ChromeManager(), new PreferencePaneManager()]
        : [new DefaultPreferencesLoader()]),
      this.eventManager,
      this.windowManager,
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
    const dependencies = {
      eventManager: this.eventManager,
      windowManager: this.windowManager,
    };

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

  public getNotionClient(): Client {
    const latestWindow = this.windowManager.getLatestWindow();
    if (!latestWindow) throw new Error('No window available');

    return getNotionClient(latestWindow);
  }

  public findDuplicates(): Promise<Set<string>> {
    return findDuplicates(this.getNotionClient());
  }
}

(Zotero as Zotero & { Notero: Notero }).Notero = new Notero();
