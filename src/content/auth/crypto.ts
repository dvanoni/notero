import { getMainWindow } from '../utils';

/**
 * Decrypt the provided data using the provided AES-GCM key and IV.
 * @param key The AES-GCM key to use for decryption
 * @param iv The initialization vector to use for decryption
 * @param encryptedData The data to decrypt
 * @returns A promise that resolves to the decrypted data
 */
export function decrypt(
  key: CryptoKey,
  iv: BufferSource,
  encryptedData: BufferSource,
): Promise<ArrayBuffer> {
  return getMainWindow().crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encryptedData,
  );
}

/**
 * Export the provided key in `SubjectPublicKeyInfo` format.
 * @param key The key to export
 * @returns A promise that resolves to the exported key
 */
export function exportKey(key: CryptoKey): Promise<ArrayBuffer> {
  return getMainWindow().crypto.subtle.exportKey('spki', key);
}

/**
 * Generate a new RSA key pair to use for wrapping and unwrapping keys.
 * @returns A promise that resolves to the generated key pair
 */
export function generateKeyPair(): Promise<CryptoKeyPair> {
  return getMainWindow().crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['wrapKey', 'unwrapKey'],
  );
}

/**
 * Unwrap an AES-GCM key using the provided RSA private unwrapping key.
 * @param wrappedKey The AES-GCM key (in raw format) to unwrap
 * @param unwrappingKey The RSA private key to use for unwrapping
 * @returns A promise that resolves to the unwrapped key
 */
export function unwrapKey(
  wrappedKey: BufferSource,
  unwrappingKey: CryptoKey,
): Promise<CryptoKey> {
  return getMainWindow().crypto.subtle.unwrapKey(
    'raw',
    wrappedKey,
    unwrappingKey,
    { name: 'RSA-OAEP' },
    { name: 'AES-GCM' },
    false,
    ['decrypt'],
  );
}
