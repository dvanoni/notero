import { getMainWindow } from './get-main-window';

export function urlSafeBase64Decode(urlSafeBase64: string): ArrayBuffer {
  // TODO: If dropping support for Zotero 7, replace with
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array/fromBase64
  let base64 = urlSafeBase64.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const dataString = getMainWindow().atob(base64);
  const data = Uint8Array.from(dataString, (c) => c.charCodeAt(0));
  return data.buffer;
}

export function urlSafeBase64Encode(data: string | ArrayBuffer): string {
  // TODO: If dropping support for Zotero 7, replace with
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array/toBase64
  const dataString =
    typeof data === 'string'
      ? data
      : String.fromCharCode(...new Uint8Array(data));
  const base64 = getMainWindow().btoa(dataString);
  const urlSafeBase64 = base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return urlSafeBase64;
}
