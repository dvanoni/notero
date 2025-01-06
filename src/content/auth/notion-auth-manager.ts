import type { OauthTokenResponse } from '@notionhq/client/build/src/api-endpoints';

import { LocalizableError } from '../errors';
import {
  clearNoteroPref,
  getNoteroPref,
  NoteroPref,
} from '../prefs/notero-pref';
import type {
  EventManager,
  PreferencePaneManager,
  Service,
  ServiceParams,
} from '../services';
import {
  isObject,
  logger,
  urlSafeBase64Decode,
  urlSafeBase64Encode,
} from '../utils';

import {
  decrypt,
  exportPublicKey,
  generateKeyPair,
  generateNonce,
  unwrapKey,
} from './crypto';
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
  nonce: string;
};

const OAUTH_LOGIN_URL = 'https://auth.notero.vanoni.dev/login';

export class NotionAuthManager implements Service {
  private currentSession: OauthSession | null = null;
  private eventManager!: EventManager;
  private preferencePaneManager!: PreferencePaneManager;

  public startup({
    dependencies,
  }: ServiceParams<'eventManager' | 'preferencePaneManager'>) {
    this.eventManager = dependencies.eventManager;
    this.preferencePaneManager = dependencies.preferencePaneManager;
  }

  public async openLogin(): Promise<void> {
    if (this.currentSession) {
      logger.warn('Cancelling existing Notion OAuth session');
    }

    const keyPair = await generateKeyPair();
    const nonce = urlSafeBase64Encode(generateNonce());

    this.currentSession = { keyPair, nonce };

    const publicKey = await exportPublicKey(keyPair.publicKey);

    const state = `${urlSafeBase64Encode(publicKey)}.${nonce}`;
    Zotero.launchURL(`${OAUTH_LOGIN_URL}?state=${state}`);
  }

  public async handleTokenResponse(params: URLSearchParams): Promise<void> {
    if (!this.currentSession) {
      throw new Error('Notion OAuth session not started');
    }
    if (params.get('nonce') !== this.currentSession.nonce) {
      throw new Error('Invalid Notion OAuth nonce');
    }

    const encryptedTokenResponse = this.getEncryptedTokenResponse(params);
    const tokenResponse = await this.decryptTokenResponse(
      this.currentSession.keyPair.privateKey,
      encryptedTokenResponse,
    );

    await saveConnection(tokenResponse);

    clearNoteroPref(NoteroPref.notionToken);

    this.currentSession = null;
    this.preferencePaneManager.openPreferences();
    this.eventManager.emit('notion-connection.add', tokenResponse);
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

  public async getOptionalAuthToken(): Promise<string | undefined> {
    const tokenResponses = await this.getAllConnections();
    return tokenResponses[0]?.access_token || this.getLegacyAuthToken();
  }

  public async getRequiredAuthToken(): Promise<string> {
    const authToken = await this.getOptionalAuthToken();
    if (authToken) return authToken;

    throw new LocalizableError(
      'Notion auth token not available',
      'notero-error-missing-notion-token',
    );
  }

  public async removeAllConnections(): Promise<void> {
    clearNoteroPref(NoteroPref.notionToken);

    for (const connection of await this.getAllConnections()) {
      await this.removeConnection(connection);
    }
  }

  public async removeConnection(connection: NotionConnection): Promise<void> {
    await removeConnection(connection.bot_id);
    this.eventManager.emit('notion-connection.remove', connection);
  }

  private getEncryptedTokenResponse(
    params: URLSearchParams,
  ): EncryptedTokenResponse {
    const key = params.get('key');
    const iv = params.get('iv');
    const tokenResponse = params.get('tokenResponse');
    if (!key || !iv || !tokenResponse) {
      throw new Error('Invalid access token parameters');
    }
    return { key, iv, tokenResponse };
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
