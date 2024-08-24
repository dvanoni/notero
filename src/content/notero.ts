import type { Client } from '@notionhq/client';

import type { PluginInfo } from './plugin-info';
import {
  ChromeManager,
  EventManager,
  PreferencePaneManager,
  Service,
  SyncManager,
  UIManager,
  WindowManager,
} from './services';
import { findDuplicates } from './sync/find-duplicates';
import { getNotionClient } from './sync/notion-client';
import { hasErrorStack, log } from './utils';

class Notero {
  private readonly eventManager: EventManager;
  private readonly preferencePaneManager: PreferencePaneManager;
  private readonly windowManager: WindowManager;
  private readonly services: Service[];

  public constructor() {
    this.eventManager = new EventManager();
    this.preferencePaneManager = new PreferencePaneManager();
    this.windowManager = new WindowManager();

    this.services = [
      new ChromeManager(),
      this.eventManager,
      this.preferencePaneManager,
      this.windowManager,
      new SyncManager(),
      new UIManager(),
    ];
  }

  public async startup(pluginInfo: PluginInfo) {
    await Zotero.uiReadyPromise;

    await this.startServices(pluginInfo);
    this.addToAllWindows();
  }

  public shutdown() {
    this.removeFromAllWindows();
    this.shutDownServices();
  }

  private async startServices(pluginInfo: PluginInfo) {
    const dependencies = {
      eventManager: this.eventManager,
      preferencePaneManager: this.preferencePaneManager,
      windowManager: this.windowManager,
    };

    for (const service of this.services) {
      const serviceName = service.constructor.name;
      try {
        log(`Starting ${serviceName}`);
        await service.startup({ dependencies, pluginInfo });
      } catch (error) {
        log(`Failed to start ${serviceName}: ${String(error)}`, 'error');
        if (hasErrorStack(error)) log(error.stack, 'error');
      }
    }
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

  public findDuplicates(propertyName: string = 'title'): Promise<Set<string>> {
    return findDuplicates(this.getNotionClient(), propertyName);
  }
}

export type ZoteroWithNotero = Zotero & { Notero?: Notero };

(Zotero as ZoteroWithNotero).Notero = new Notero();
