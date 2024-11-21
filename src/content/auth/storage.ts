import type { OauthTokenResponse } from '@notionhq/client/build/src/api-endpoints';
import { z } from 'zod';

import { logger } from '../utils';

const NOTION_API_DOMAIN = 'api.notion.com';
const NOTION_API_ORIGIN = `https://${NOTION_API_DOMAIN}`;

const tokenResponseSchema = z.object({
  access_token: z.string(),
  bot_id: z.string(),
  duplicated_template_id: z.string().nullable(),
  workspace_icon: z.string().nullable(),
  workspace_id: z.string(),
  workspace_name: z.string().nullable(),
}) satisfies z.ZodType<Omit<OauthTokenResponse, 'owner' | 'token_type'>>;

export type TokenResponse = z.infer<typeof tokenResponseSchema>;

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

async function findLogin(
  botId: string,
): Promise<XPCOM.nsILoginInfo | undefined> {
  const logins = await Services.logins.searchLoginsAsync({
    origin: NOTION_API_ORIGIN,
    httpRealm: getHttpRealm(botId),
  });
  return logins[0];
}

export async function getAllTokenResponses(): Promise<TokenResponse[]> {
  const logins = await Services.logins.searchLoginsAsync({
    origin: NOTION_API_ORIGIN,
  });

  return logins
    .map((login) => {
      try {
        return tokenResponseSchema.parse(JSON.parse(login.password));
      } catch (error) {
        logger.warn(
          'Encountered invalid login with HTTP realm:',
          login.httpRealm,
          error,
        );
        return null;
      }
    })
    .filter(Boolean);
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
