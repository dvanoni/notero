/* eslint-disable @typescript-eslint/unbound-method */

// Use esbuild `inject` to make timer functions globally available in Zotero 6

const setTimeoutShim =
  typeof setTimeout !== 'undefined' ? setTimeout : Zotero.setTimeout;

const clearTimeoutShim =
  typeof clearTimeout !== 'undefined' ? clearTimeout : Zotero.clearTimeout;

export { setTimeoutShim as setTimeout, clearTimeoutShim as clearTimeout };
