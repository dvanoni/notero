import { Client, Logger, LogLevel } from '@notionhq/client';

import { getNoteroPref, NoteroPref } from '../prefs/notero-pref';
import { getLocalizedString, log } from '../utils';

const logger: Logger = (level, message, extraInfo) => {
  log(
    `${message} - ${JSON.stringify(extraInfo)}`,
    level === LogLevel.ERROR ? 'error' : 'warning'
  );
};

export function getNotionClient() {
  const authToken = getNoteroPref(NoteroPref.notionToken);

  if (!authToken) {
    throw new Error(`Missing ${getLocalizedString(NoteroPref.notionToken)}`);
  }

  return new Client({ auth: authToken, logger });
}
