import type { OauthTokenResponse } from '@notionhq/client/build/src/api-endpoints';
import { z } from 'zod';

import { logger } from '../utils';

const NOTION_API_DOMAIN = 'api.notion.com';
const NOTION_API_ORIGIN = `https://${NOTION_API_DOMAIN}`;

const notionConnectionSchema = z.object({
  access_token: z.string(),
  bot_id: z.string(),
  duplicated_template_id: z.string().nullable(),
  workspace_icon: z.string().nullable(),
  workspace_id: z.string(),
  workspace_name: z.string().nullable(),
}) satisfies z.ZodType<Partial<OauthTokenResponse>>;

export type NotionConnection = z.infer<typeof notionConnectionSchema>;

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

export async function getAllConnections(): Promise<NotionConnection[]> {
  const logins = await Services.logins.searchLoginsAsync({
    origin: NOTION_API_ORIGIN,
  });

  return logins
    .map((login) => {
      try {
        return notionConnectionSchema.parse(JSON.parse(login.password));
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

export async function saveConnection(
  tokenResponse: OauthTokenResponse,
): Promise<void> {
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

export async function removeConnection(botId: string): Promise<void> {
  const login = await findLogin(botId);

  if (login) {
    logger.debug('Removing login for bot ID:', botId);
    Services.logins.removeLogin(login);
  } else {
    logger.warn('No login found for bot ID:', botId);
  }
}
