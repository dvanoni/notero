import type { OauthTokenResponse } from '@notionhq/client/build/src/api-endpoints';

import type { ZoteroWithNotero } from '../notero';
import {
  getMainWindow,
  isObject,
  logger,
  urlSafeBase64Decode,
  urlSafeBase64Encode,
} from '../utils';

type EncryptedTokenResponse = {
  key: string;
  iv: string;
  tokenResponse: string;
};

const noteroGlobals = new Proxy(
  {},
  {
    get(_target, prop) {
      return (Zotero as ZoteroWithNotero).Notero![prop];
    },
    set(_target, prop, value) {
      (Zotero as ZoteroWithNotero).Notero![prop] = value;
      return true;
    },
  },
) as Record<string, unknown>;

export async function startNotionOauthSession(): Promise<NotionOauthSession> {
  if (noteroGlobals.notionOauthSession) {
    logger.warn('Cancelling existing Notion OAuth session');
    noteroGlobals.notionOauthSession = null;
  }
  const session = new NotionOauthSession();
  await session.init();
  noteroGlobals.notionOauthSession = session;
  return session;
}

export function getNotionOauthSession(): NotionOauthSession {
  const session = noteroGlobals.notionOauthSession;
  if (session) return session as NotionOauthSession;
  throw new Error('Notion OAuth session not started');
}

class NotionOauthSession {
  private keyPair!: CryptoKeyPair;

  public async init(): Promise<void> {
    this.keyPair = await this.generateKeyPair();
  }

  private generateKeyPair(): Promise<CryptoKeyPair> {
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

  public async openLogin(): Promise<void> {
    const publicKey = await getMainWindow().crypto.subtle.exportKey(
      'spki',
      this.keyPair.publicKey,
    );
    const base64Key = urlSafeBase64Encode(publicKey);
    Zotero.launchURL(`https://localhost:8787/login?state=${base64Key}`);
  }

  public async handleTokenResponse(
    encryptedTokenResponse: EncryptedTokenResponse,
  ): Promise<void> {
    const tokenResponse = await this.decryptTokenResponse(
      encryptedTokenResponse,
    );
    getMainWindow().alert(
      `Connected to Notion workspace: ${tokenResponse.workspace_name}`,
    );
  }

  private async decryptTokenResponse({
    key,
    iv,
    tokenResponse,
  }: EncryptedTokenResponse): Promise<OauthTokenResponse> {
    const symmetricKey = await getMainWindow().crypto.subtle.unwrapKey(
      'raw',
      urlSafeBase64Decode(key),
      this.keyPair.privateKey,
      { name: 'RSA-OAEP' },
      { name: 'AES-GCM' },
      false,
      ['decrypt'],
    );
    const jsonResponseBuffer = await getMainWindow().crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: urlSafeBase64Decode(iv) },
      symmetricKey,
      urlSafeBase64Decode(tokenResponse),
    );
    const decoder = new TextDecoder();
    const jsonResponse = decoder.decode(jsonResponseBuffer);
    const parsedResponse = JSON.parse(jsonResponse);
    if (isObject(parsedResponse) && parsedResponse.access_token) {
      return parsedResponse as OauthTokenResponse;
    }
    throw new Error('Invalid access token response');
  }
}
