import type { ZoteroWithNotero } from './content/notero';

declare const Zotero: ZoteroWithNotero;

const LOG_PREFIX = '[Notero] ';

function log(msg: string) {
  Zotero.debug(`${LOG_PREFIX}${msg}`);
  Zotero.log(`${LOG_PREFIX}${msg}`, 'info');
}

/**
 *
 * Bootstrap entry points
 * @see https://www.zotero.org/support/dev/zotero_7_for_developers#xul_overlays_bootstrapjs
 * @see https://udn.realityripple.com/docs/Archive/Add-ons/Bootstrapped_extensions#Bootstrap_entry_points
 *
 */

/**
 * Your bootstrap script must include an `install()` function, which the
 * application calls before the first call to `startup()` after the extension is
 * installed, upgraded, or downgraded.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function install({ version }: BootstrapData, _reason: Zotero.Plugins.REASONS) {
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
  log(`Starting v${version}`);

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
  log(`Uninstalled v${version}`);
}
