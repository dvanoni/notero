import { IS_ZOTERO_7 } from './constants';
import {
  ChromeManager,
  DefaultPreferencesLoader,
  EventManager,
  PreferencePaneManager,
  Service,
  SyncManager,
  UIManager,
} from './services';
import { NotesService } from './sync/notes-service';
import { log } from './utils';

if (!IS_ZOTERO_7) {
  Cu.importGlobalProperties(['URL']);
}

export class Notero {
  private readonly services: Service[] = [
    ...(IS_ZOTERO_7
      ? [new ChromeManager(), new PreferencePaneManager()]
      : [new DefaultPreferencesLoader()]),
    new EventManager(),
    new SyncManager(),
    new UIManager(),
    new NotesService(),
  ];

  public async startup(pluginID: string, rootURI: string) {
    await Zotero.uiReadyPromise;

    this.services.forEach((service) => {
      log(`Starting ${service.constructor.name}`);
      service.startup({ pluginID, rootURI });
    });
  }

  public shutdown() {
    this.services.forEach((service) => {
      if (service.shutdown) {
        log(`Shutting down ${service.constructor.name}`);
        service.shutdown();
      }
    });
  }
}

(Zotero as Zotero & { Notero: Notero }).Notero = new Notero();
