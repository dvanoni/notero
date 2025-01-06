import { Client, Logger, LogLevel } from '@notionhq/client';

import { logger } from '../utils';

const notionLogger: Logger = (level, message, extraInfo) => {
  level = level === LogLevel.INFO ? LogLevel.DEBUG : level;
  logger[level](message, extraInfo);
};

export function getNotionClient(authToken: string, window: Window) {
  return new Client({
    auth: authToken,
    fetch: window.fetch.bind(window),
    logger: notionLogger,
    logLevel: LogLevel.DEBUG,
  });
}
