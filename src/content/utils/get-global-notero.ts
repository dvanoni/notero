import type { Notero, ZoteroWithNotero } from '../notero';

/**
 * Return the `Notero` object from the global `Zotero` object.
 * This can be used from any script, such as the main bootstrap entrypoint and
 * the preferences window, to access global Notero functionality.
 */
export function getGlobalNotero(): Notero {
  const notero = (Zotero as ZoteroWithNotero).Notero;
  if (notero) return notero;
  throw new Error('Zotero.Notero object not available');
}
