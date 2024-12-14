import type { Client } from '@notionhq/client';

import { NotionAuthManager } from './auth';
import type { PluginInfo } from './plugin-info';
import {
  EventManager,
  PreferencePaneManager,
  ProtocolHandlerExtension,
  Service,
  ServiceParams,
  SyncManager,
  UIManager,
} from './services';
import { findDuplicates } from './sync/find-duplicates';
import { getNotionClient } from './sync/notion-client';
import { logger } from './utils';

export class Notero {
  public readonly eventManager: EventManager;
  public readonly notionAuthManager: NotionAuthManager;

  private readonly preferencePaneManager: PreferencePaneManager;
  private readonly services: Service[];

  public constructor() {
    this.eventManager = new EventManager();
    this.notionAuthManager = new NotionAuthManager();
    this.preferencePaneManager = new PreferencePaneManager();

    this.services = [
      this.eventManager,
      this.notionAuthManager,
      this.preferencePaneManager,
      new ProtocolHandlerExtension(),
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
    const dependencies: ServiceParams['dependencies'] = {
      eventManager: this.eventManager,
      notionAuthManager: this.notionAuthManager,
      preferencePaneManager: this.preferencePaneManager,
    };

    logger.groupCollapsed('Starting services');
    for (const service of this.services) {
      const serviceName = service.constructor.name;
      try {
        logger.log(`Starting ${serviceName}`);
        await service.startup({ dependencies, pluginInfo });
      } catch (error) {
        logger.error(`Failed to start ${serviceName}:`, error);
      }
    }
    logger.groupEnd();
  }

  private shutDownServices() {
    logger.groupCollapsed('Shutting down services');
    [...this.services].reverse().forEach((service) => {
      if (!service.shutdown) return;
      logger.log(`Shutting down ${service.constructor.name}`);
      service.shutdown();
    });
    logger.groupEnd();
  }

  private addToAllWindows() {
    Zotero.getMainWindows().forEach((window) => {
      if (!window.ZoteroPane) return;
      this.addToWindow(window);
    });
  }

  public addToWindow(window: Zotero.ZoteroWindow) {
    logger.groupCollapsed('Adding services to window');
    this.services.forEach((service) => {
      if (!service.addToWindow) return;
      logger.log(`Adding ${service.constructor.name} to window`);
      service.addToWindow(window);
    });
    logger.groupEnd();
  }

  private removeFromAllWindows() {
    Zotero.getMainWindows().forEach((window) => {
      if (!window.ZoteroPane) return;
      this.removeFromWindow(window);
    });
  }

  public removeFromWindow(window: Zotero.ZoteroWindow) {
    logger.groupCollapsed('Removing services from window');
    this.services.forEach((service) => {
      if (!service.removeFromWindow) return;
      logger.log(`Removing ${service.constructor.name} from window`);
      service.removeFromWindow(window);
    });
    logger.groupEnd();
  }

  public getNotionClient(): Client {
    const mainWindow = Zotero.getMainWindow();
    if (!mainWindow) throw new Error('No window available');

    return getNotionClient(mainWindow);
  }

  public findDuplicates(propertyName: string = 'title'): Promise<Set<string>> {
    return findDuplicates(this.getNotionClient(), propertyName);
  }
}

export type ZoteroWithNotero = Zotero & { Notero?: Notero };

(Zotero as ZoteroWithNotero).Notero = new Notero();
