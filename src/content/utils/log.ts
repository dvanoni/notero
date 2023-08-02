const LOG_PREFIX = 'Notero: ';

export function log(message: unknown, type?: Parameters<Zotero['log']>[1]) {
  const messageString = `${LOG_PREFIX}${String(message)}`;
  Zotero.debug(messageString);
  Zotero.log(messageString, type);
}
