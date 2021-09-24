declare const Zotero: any;

// declare const Components: any
// declare const Services: any
// Components.utils.import('resource://gre/modules/Services.jsm')

enum Reason {
  APP_STARTUP = 1, // The application is starting up.
  APP_SHUTDOWN = 2, // The application is shutting down.
  ADDON_ENABLE = 3, // The add-on is being enabled.
  ADDON_DISABLE = 4, // The add-on is being disabled. (Also sent during uninstallation)
  ADDON_INSTALL = 5, // The add-on is being installed.
  ADDON_UNINSTALL = 6, // The add-on is being uninstalled.
  ADDON_UPGRADE = 7, // The add-on is being upgraded.
  ADDON_DOWNGRADE = 8, // The add-on is being downgraded.
}

type BootstrapData = {
  id: string; // The ID of the add-on being bootstrapped.
  version: string; // The version of the add-on being bootstrapped.
  installPath: any; // nsIFile; The installation location of the add-on being bootstrapped. This may be a directory or an XPI file depending on whether the add-on is installed unpacked or not.
  resourceURI: any; // nsIURI; A URI pointing at the root of the add-ons files, this may be a jar: or file: URI depending on whether the add-on is installed unpacked or not.
  oldVersion: string; // The previously installed version, if the reason is ADDON_UPGRADE or ADDON_DOWNGRADE, and the method is install or startup.
  newVersion: string; // The version to be installed, if the reason is ADDON_UPGRADE or ADDON_DOWNGRADE, and the method is shutdown or uninstall.
};

const patch_marker = 'UnpatchedNotero';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function patch(object, method, patcher) {
  if (object[method][patch_marker]) return;
  object[method][patch_marker] = object[method];
  object[method] = patcher(object[method]);
}

class Notero {
  public async install(_data: BootstrapData, _reason: Reason) {
    await Zotero.Schema.schemaUpdatePromise;
  }

  public async uninstall(_data: BootstrapData, _reason: Reason) {
    await Zotero.Schema.schemaUpdatePromise;
  }

  public async startup(_data: BootstrapData, _reason: Reason) {
    await Zotero.Schema.schemaUpdatePromise;
  }

  public async shutdown(_data: BootstrapData, _reason: Reason) {
    await Zotero.Schema.schemaUpdatePromise;
  }
}

Zotero.Notero = new Notero();

export const install = Zotero.Notero.install.bind(Zotero.Notero);
export const uninstall = Zotero.Notero.uninstall.bind(Zotero.Notero);
export const startup = Zotero.Notero.startup.bind(Zotero.Notero);
export const shutdown = Zotero.Notero.shutdown.bind(Zotero.Notero);
