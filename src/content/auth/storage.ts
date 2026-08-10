import { z } from 'zod';

import { logger } from '../utils';

const CAPACITIES_API_ORIGIN = 'https://api.capacities.io';
const HTTP_REALM = 'captero/api-token';

const capacitiesConnectionSchema = z.object({
  apiToken: z.string(),
  spaceId: z.string(),
  spaceTitle: z.string(),
});

export type CapacitiesConnection = z.infer<typeof capacitiesConnectionSchema>;

function buildLoginInfo(connection: CapacitiesConnection): XPCOM.nsILoginInfo {
  const nsLoginInfo = Components.Constructor(
    '@mozilla.org/login-manager/loginInfo;1',
    Components.interfaces.nsILoginInfo,
    'init',
  );
  return new nsLoginInfo(
    CAPACITIES_API_ORIGIN,
    null,
    HTTP_REALM,
    connection.spaceId,
    JSON.stringify(connection),
  );
}

async function findLogin(): Promise<XPCOM.nsILoginInfo | undefined> {
  const logins = await Services.logins.searchLoginsAsync({
    origin: CAPACITIES_API_ORIGIN,
    httpRealm: HTTP_REALM,
  });
  return logins[0];
}

export async function getConnection(): Promise<
  CapacitiesConnection | undefined
> {
  const login = await findLogin();
  if (!login) return undefined;

  try {
    return capacitiesConnectionSchema.parse(JSON.parse(login.password));
  } catch (error) {
    logger.warn('Encountered invalid Capacities connection:', error);
    return undefined;
  }
}

export async function saveConnection(
  connection: CapacitiesConnection,
): Promise<void> {
  const loginInfo = buildLoginInfo(connection);
  const existingLogin = await findLogin();

  if (existingLogin) {
    logger.debug('Updating existing Capacities connection');
    Services.logins.modifyLogin(existingLogin, loginInfo);
  } else {
    logger.debug('Adding new Capacities connection');
    await Services.logins.addLoginAsync(loginInfo);
  }
}

export async function removeConnection(): Promise<void> {
  const login = await findLogin();

  if (login) {
    logger.debug('Removing Capacities connection');
    Services.logins.removeLogin(login);
  } else {
    logger.warn('No Capacities connection found to remove');
  }
}
