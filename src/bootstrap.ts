import type { Notero } from './content/notero';

const LOG_PREFIX = '[Notero] ';

let mainWindowListener: XPCOM.nsIWindowMediatorListener | undefined;

// @ts-expect-error Check if `Zotero` is defined
if (typeof Zotero === 'undefined') {
  // eslint-disable-next-line no-var
  var Zotero: Zotero & { Notero?: Notero };
}

function domWindowFromXulWindow(xulWindow: XPCOM.nsIXULWindow) {
  return xulWindow
    .QueryInterface(Ci.nsIInterfaceRequestor)
    .getInterface(Ci.nsIDOMWindow);
}

function isMainWindow(domWindow: XPCOM.nsIDOMWindow) {
  return (
    domWindow.location.href ===
    'chrome://zotero/content/standalone/standalone.xul'
  );
}

function isZotero6() {
  return Zotero.platformMajorVersion < 102;
}

function log(msg: string) {
  Zotero.debug(`${LOG_PREFIX}${msg}`);
  Zotero.log(`${LOG_PREFIX}${msg}`);
}

// In Zotero 6, bootstrap methods are called before Zotero is initialized, and
// using include.js to get the Zotero XPCOM service would risk breaking Zotero
// startup. Instead, wait for the main Zotero window to open and get the Zotero
// object from there.
//
// In Zotero 7, bootstrap methods are not called until Zotero is initialized,
// and the `Zotero` is automatically made available.
async function waitForZotero() {
  if (typeof Zotero !== 'undefined') {
    await Zotero.initializationPromise;
    return;
  }

  const { Services } = ChromeUtils.import(
    'resource://gre/modules/Services.jsm',
  );

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
          const domWindow = domWindowFromXulWindow(xulWindow);
          const windowListener = () => {
            if (domWindow.Zotero) {
              Services.wm.removeListener(windowMediatorListener);
              Zotero = domWindow.Zotero as typeof Zotero;
              resolve();
            }
          };
          domWindow.addEventListener('load', windowListener, { once: true });
        },
      };
      Services.wm.addListener(windowMediatorListener);
    });
  }

  await Zotero.initializationPromise;
}

/** Add main window open/close listeners in Zotero 6. */
function listenForMainWindowEvents() {
  mainWindowListener = {
    onOpenWindow(xulWindow: XPCOM.nsIXULWindow) {
      const domWindow = domWindowFromXulWindow(xulWindow);
      const onLoad = () => {
        if (isMainWindow(domWindow)) {
          onMainWindowLoad({ window: domWindow });
        }
      };
      domWindow.addEventListener('load', onLoad, { once: true });
    },

    onCloseWindow(xulWindow: XPCOM.nsIXULWindow) {
      const domWindow = domWindowFromXulWindow(xulWindow);
      if (isMainWindow(domWindow)) {
        onMainWindowUnload({ window: domWindow });
      }
    },
  };

  Services.wm.addListener(mainWindowListener);
}

function removeMainWindowListener() {
  if (mainWindowListener) {
    Services.wm.removeListener(mainWindowListener);
  }
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
async function install(
  { version }: BootstrapData,
  _reason: Zotero.Plugins.REASONS,
) {
  await waitForZotero();

  log(`Installed v${version}`);
}

/**
 * Called when the extension needs to start itself up. This happens at
 * application launch time, when the extension is enabled after being disabled
 * or after it has been shut down in order to install an update. As such, this
 * can be called many times during the lifetime of the application.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function startup(
  { id, resourceURI, rootURI = resourceURI.spec, version }: BootstrapData,
  _reason: Zotero.Plugins.REASONS,
) {
  await waitForZotero();

  log(`Starting v${version}`);

  // `Services` may not be available in Zotero 6
  // @ts-expect-error Check if `Services` is defined
  if (typeof Services === 'undefined') {
    // eslint-disable-next-line no-var
    var { Services } = ChromeUtils.import(
      'resource://gre/modules/Services.jsm',
    );
  }

  if (isZotero6()) {
    // Listen for window load/unload events in Zotero 6, since
    // onMainWindowLoad/Unload don't get called.
    listenForMainWindowEvents();
  }

  Services.scriptloader.loadSubScript(rootURI + 'content/notero.js');

  await Zotero.Notero?.startup({ pluginID: id, rootURI, version });
}

/**
 * Called when a main Zotero window is opened.
 * @since Zotero 7
 * @see https://www.zotero.org/support/dev/zotero_7_for_developers#window_hooks
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function onMainWindowLoad({ window }: { window: Zotero.ZoteroWindow }) {
  Zotero.Notero?.addToWindow(window);
}

/**
 * Called when a main Zotero window is closed.
 * @since Zotero 7
 * @see https://www.zotero.org/support/dev/zotero_7_for_developers#window_hooks
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function onMainWindowUnload({ window }: { window: Zotero.ZoteroWindow }) {
  Zotero.Notero?.removeFromWindow(window);
}

/**
 * Called when the extension needs to shut itself down, such as when the
 * application is quitting or when the extension is about to be upgraded or
 * disabled. Any user interface that has been injected must be removed, tasks
 * shut down, and objects disposed of.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function shutdown({ version }: BootstrapData, _reason: Zotero.Plugins.REASONS) {
  log(`Shutting down v${version}`);

  if (isZotero6()) {
    removeMainWindowListener();
  }

  Zotero.Notero?.shutdown();

  delete Zotero.Notero;
}

/**
 * This function is called after the last call to `shutdown()` before a
 * particular version of an extension is uninstalled.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function uninstall(
  { version }: BootstrapData,
  _reason: Zotero.Plugins.REASONS,
) {
  // `Zotero` object isn't available in `uninstall()` in Zotero 6, so log manually
  if (typeof Zotero === 'undefined') {
    dump(`${LOG_PREFIX}Uninstalled v${version}\n\n`);
    return;
  }

  log(`Uninstalled v${version}`);
}
