/**
 * Convert an item date string property (e.g. `dateAdded`, `dateModified`) into
 * a JavaScript Date object.
 *
 * Zotero stores these date values in an SQL format using UTC timestamp.
 */
export function parseItemDate(date: string): Date | false {
  return Zotero.Date.sqlToDate(date, true);
}
