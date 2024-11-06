import type { OauthTokenResponse } from '@notionhq/client/build/src/api-endpoints';

import { isObject, logger } from '../utils';

const NOTION_API_DOMAIN = 'api.notion.com';
const NOTION_API_ORIGIN = `https://${NOTION_API_DOMAIN}`;

function getHttpRealm(botId: string): string {
  return `notero/${botId}@${NOTION_API_DOMAIN}`;
}

function buildLoginInfo(tokenResponse: OauthTokenResponse): XPCOM.nsILoginInfo {
  const nsLoginInfo = Components.Constructor(
    '@mozilla.org/login-manager/loginInfo;1',
    Components.interfaces.nsILoginInfo,
    'init',
  );
  return new nsLoginInfo(
    NOTION_API_ORIGIN,
    null,
    getHttpRealm(tokenResponse.bot_id),
    tokenResponse.bot_id,
    JSON.stringify(tokenResponse),
  );
}

async function findLogin(botId: string): Promise<XPCOM.nsILoginInfo | null> {
  const logins = await Services.logins.searchLoginsAsync({
    origin: NOTION_API_ORIGIN,
    httpRealm: getHttpRealm(botId),
  });
  return logins[0] || null;
}

export async function getAllTokenResponses(): Promise<OauthTokenResponse[]> {
  const logins = await Services.logins.searchLoginsAsync({
    origin: NOTION_API_ORIGIN,
  });

  return logins
    .map((login) => JSON.parse(login.password))
    .filter(isTokenResponse);
}

function isTokenResponse(value: unknown): value is OauthTokenResponse {
  return isObject(value) && 'bot_id' in value && Boolean(value.bot_id);
}

export async function saveTokenResponse(tokenResponse: OauthTokenResponse) {
  const loginInfo = buildLoginInfo(tokenResponse);
  const existingLogin = await findLogin(tokenResponse.bot_id);

  if (existingLogin) {
    logger.debug('Updating existing login for bot ID:', tokenResponse.bot_id);
    Services.logins.modifyLogin(existingLogin, loginInfo);
  } else {
    logger.debug('Adding new login for bot ID:', tokenResponse.bot_id);
    await Services.logins.addLoginAsync(loginInfo);
  }
}

export async function removeTokenResponse(botId: string) {
  const login = await findLogin(botId);

  if (login) {
    logger.debug('Removing login for bot ID:', botId);
    Services.logins.removeLogin(login);
  } else {
    logger.warn('No login found for bot ID:', botId);
  }
}
