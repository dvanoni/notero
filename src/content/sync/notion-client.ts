import { Client, Logger, LogLevel } from '@notionhq/client';

import { getRequiredNoteroPref, NoteroPref } from '../prefs/notero-pref';
import { log } from '../utils';

const logger: Logger = (level, message, extraInfo) => {
  log(
    `${message} - ${JSON.stringify(extraInfo)}`,
    level === LogLevel.ERROR ? 'error' : 'warning',
  );
};

export function getNotionClient(window: Window) {
  const authToken = getRequiredNoteroPref(NoteroPref.notionToken);

  return new Client({
    auth: authToken,
    fetch: window.fetch.bind(window),
    logger,
    logLevel: LogLevel.DEBUG,
  });
}
