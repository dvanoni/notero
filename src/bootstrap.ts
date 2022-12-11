import type { Notero } from './content/notero';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
if (typeof Zotero === 'undefined') {
  // eslint-disable-next-line no-var
  var Zotero: Zotero & { Notero?: Notero };
}

function log(msg: string) {
  Zotero.debug(`Notero: ${msg}`);
  Zotero.log(`Notero: ${msg}`);
}

// In Zotero 6, bootstrap methods are called before Zotero is initialized, and
// using include.js to get the Zotero XPCOM service would risk breaking Zotero
// startup. Instead, wait for the main Zotero window to open and get the Zotero
// object from there.
//
// In Zotero 7, bootstrap methods are not called until Zotero is initialized,
// and the 'Zotero' is automatically made available.
async function waitForZotero() {
  if (typeof Zotero !== 'undefined') {
    return await Zotero.initializationPromise;
  }

  const { Services } = ChromeUtils.import(
    'resource://gre/modules/Services.jsm'
  ) as { Services: Services };

  const windows = Services.wm.getEnumerator('navigator:browser');
  let found = false;

  while (windows.hasMoreElements()) {
    const win = windows.getNext();
    if (win.Zotero) {
      Zotero = win.Zotero as typeof Zotero;
      found = true;
      break;
    }
  }

  if (!found) {
    await new Promise<void>((resolve) => {
      const windowMediatorListener = {
        onOpenWindow(xulWindow: XPCOM.nsIXULWindow) {
          // Wait for the window to finish loading
          const domWindow = xulWindow
            .QueryInterface(Ci.nsIInterfaceRequestor)
            .getInterface(Ci.nsIDOMWindow);
          const windowListener = () => {
            domWindow.removeEventListener('load', windowListener, false);
            if (domWindow.Zotero) {
              Services.wm.removeListener(windowMediatorListener);
              Zotero = domWindow.Zotero as typeof Zotero;
              resolve();
            }
          };
          domWindow.addEventListener('load', windowListener, false);
        },
      };
      Services.wm.addListener(windowMediatorListener);
    });
  }

  await Zotero.initializationPromise;
}

/**
 *
 * Bootstrap entry points
 * @see https://www.zotero.org/support/dev/zotero_7_for_developers#xul_overlays_bootstrapjs
 * @see http://www.devdoc.net/web/developer.mozilla.org/en-US/docs/Mozilla/Add-ons/Bootstrapped_Extensions.html#Bootstrap_entry_points
 *
 */

/**
 * Your bootstrap script must include an `install()` function, which the
 * application calls before the first call to `startup()` after the extension is
 * installed, upgraded, or downgraded.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function install(_data: BootstrapData, _reason: Zotero.Plugins.REASONS) {
  await waitForZotero();

  log('Installed');
}

/**
 * Called when the extension needs to start itself up. This happens at
 * application launch time, when the extension is enabled after being disabled
 * or after it has been shut down in order to install an update. As such, this
 * can be called many times during the lifetime of the application.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function startup(
  { id, resourceURI, rootURI = resourceURI.spec }: BootstrapData,
  _reason: Zotero.Plugins.REASONS
) {
  await waitForZotero();

  log('Starting');

  // 'Services' may not be available in Zotero 6
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (typeof Services === 'undefined') {
    // eslint-disable-next-line no-var
    var { Services } = ChromeUtils.import(
      'resource://gre/modules/Services.jsm'
    ) as { Services: Services };
  }

  Services.scriptloader.loadSubScript(rootURI + 'content/notero.js');

  void Zotero.Notero?.startup(id, rootURI);
}

/**
 * Called when the extension needs to shut itself down, such as when the
 * application is quitting or when the extension is about to be upgraded or
 * disabled. Any user interface that has been injected must be removed, tasks
 * shut down, and objects disposed of.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function shutdown(_data: BootstrapData, _reason: Zotero.Plugins.REASONS) {
  log('Shutting down');

  Zotero.Notero?.shutdown();

  delete Zotero.Notero;
}

/**
 * This function is called after the last call to `shutdown()` before a
 * particular version of an extension is uninstalled.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function uninstall(_data: BootstrapData, _reason: Zotero.Plugins.REASONS) {
  log('Uninstalled');
}
