import { Service, SyncManager, UIManager } from './services';
import { log } from './utils';

const IS_ZOTERO_7 = Zotero.platformMajorVersion >= 102;

if (!IS_ZOTERO_7) {
  Cu.importGlobalProperties(['URL']);
}

export class Notero {
  private readonly services: Service[] = [new SyncManager(), new UIManager()];

  public async startup(pluginID: string, rootURI: string) {
    await Zotero.uiReadyPromise;

    this.services.forEach((service) => {
      log(`Starting ${service.constructor.name}`);
      service.startup({ pluginID, rootURI });
    });
  }

  public shutdown() {
    this.services.forEach((service) => {
      log(`Shutting down ${service.constructor.name}`);
      service.shutdown?.();
    });
  }
}

(Zotero as Zotero & { Notero: Notero }).Notero = new Notero();
