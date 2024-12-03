import type { OauthTokenResponse } from '@notionhq/client/build/src/api-endpoints';

import {
  clearNoteroPref,
  getNoteroPref,
  NoteroPref,
} from '../prefs/notero-pref';
import {
  isObject,
  logger,
  urlSafeBase64Decode,
  urlSafeBase64Encode,
} from '../utils';

import { decrypt, exportKey, generateKeyPair, unwrapKey } from './crypto';
import {
  getAllConnections,
  removeConnection,
  saveConnection,
  NotionConnection,
} from './storage';

type EncryptedTokenResponse = {
  key: string;
  iv: string;
  tokenResponse: string;
};

type OauthSession = {
  keyPair: CryptoKeyPair;
};

const OAUTH_LOGIN_URL = 'https://localhost:8787/login';

export class NotionAuthManager {
  private currentSession: OauthSession | null = null;

  public async openLogin(): Promise<void> {
    if (this.currentSession) {
      logger.warn('Cancelling existing Notion OAuth session');
    }
    this.currentSession = { keyPair: await generateKeyPair() };

    const publicKey = await exportKey(this.currentSession.keyPair.publicKey);
    const base64Key = urlSafeBase64Encode(publicKey);
    Zotero.launchURL(`${OAUTH_LOGIN_URL}?state=${base64Key}`);
  }

  public async handleTokenResponse(
    encryptedTokenResponse: EncryptedTokenResponse,
  ): Promise<void> {
    if (!this.currentSession) {
      throw new Error('Notion OAuth session not started');
    }

    const tokenResponse = await this.decryptTokenResponse(
      this.currentSession.keyPair.privateKey,
      encryptedTokenResponse,
    );
    logger.debug(tokenResponse);

    await saveConnection(tokenResponse);

    this.currentSession = null;
  }

  public getAllConnections(): Promise<NotionConnection[]> {
    return getAllConnections();
  }

  public async getFirstConnection(): Promise<NotionConnection | undefined> {
    return (await this.getAllConnections())[0];
  }

  public getLegacyAuthToken(): string | undefined {
    return getNoteroPref(NoteroPref.notionToken);
  }

  public async removeAllConnections(): Promise<void> {
    clearNoteroPref(NoteroPref.notionToken);

    for (const connection of await this.getAllConnections()) {
      await this.removeConnection(connection);
    }
  }

  public removeConnection(connection: NotionConnection): Promise<void> {
    return removeConnection(connection.bot_id);
  }

  private async decryptTokenResponse(
    unwrappingKey: CryptoKey,
    { key, iv, tokenResponse }: EncryptedTokenResponse,
  ): Promise<OauthTokenResponse> {
    const symmetricKey = await unwrapKey(
      urlSafeBase64Decode(key),
      unwrappingKey,
    );
    const jsonResponseBuffer = await decrypt(
      symmetricKey,
      urlSafeBase64Decode(iv),
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
