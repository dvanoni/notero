import { Client, Logger, LogLevel } from '@notionhq/client';

import { getRequiredNoteroPref, NoteroPref } from '../prefs/notero-pref';
import { logger } from '../utils';

const notionLogger: Logger = (level, message, extraInfo) => {
  level = level === LogLevel.INFO ? LogLevel.DEBUG : level;
  logger[level](message, extraInfo);
};

// TODO: Require auth token
export function getNotionClient(window: Window, authToken?: string) {
  return new Client({
    auth: authToken || getRequiredNoteroPref(NoteroPref.notionToken),
    fetch: window.fetch.bind(window),
    logger: notionLogger,
    logLevel: LogLevel.DEBUG,
  });
}
