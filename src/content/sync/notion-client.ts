import { Client, Logger } from '@notionhq/client';

import { getRequiredNoteroPref, NoteroPref } from '../prefs/notero-pref';
import { logger } from '../utils';

const notionLogger: Logger = (level, message, extraInfo) => {
  logger[level](message, extraInfo);
};

export function getNotionClient(window: Window) {
  const authToken = getRequiredNoteroPref(NoteroPref.notionToken);

  return new Client({
    auth: authToken,
    fetch: window.fetch.bind(window),
    logger: notionLogger,
  });
}
