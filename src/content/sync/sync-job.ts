import { type Client } from '@notionhq/client';

import { APA_STYLE } from '../constants';
import { ItemSyncError } from '../errors';
import {
  NoteroPref,
  PageTitleFormat,
  getNoteroPref,
  getRequiredNoteroPref,
} from '../prefs/notero-pref';
import { getLocalizedErrorMessage, logger } from '../utils';

import { getNotionClient } from './notion-client';
import type { DatabaseProperties } from './notion-types';
import { ProgressWindow } from './progress-window';
import { syncNoteItem } from './sync-note-item';
import { syncRegularItem } from './sync-regular-item';

export type SyncJobParams = {
  citationFormat: string;
  databaseID: string;
  databaseProperties: DatabaseProperties;
  notion: Client;
  pageTitleFormat: PageTitleFormat;
};

export async function performSyncJob(
  itemIDs: Set<Zotero.Item['id']>,
  getNotionAuthToken: () => Promise<string>,
  window: Window,
): Promise<void> {
  const items = Zotero.Items.get(Array.from(itemIDs));
  if (!items.length) return;

  const progressWindow = new ProgressWindow(items.length, window);
  await progressWindow.show();

  try {
    const params = await prepareSyncJob(getNotionAuthToken, window);
    await syncItems(items, progressWindow, params);
  } catch (error) {
    await handleError(error, progressWindow, window);
  }
}

async function prepareSyncJob(
  getNotionAuthToken: () => Promise<string>,
  window: Window,
): Promise<SyncJobParams> {
  const authToken = await getNotionAuthToken();
  const notion = getNotionClient(authToken, window);
  const databaseID = getRequiredNoteroPref(NoteroPref.notionDatabaseID);
  const databaseProperties = await retrieveDatabaseProperties(
    notion,
    databaseID,
  );
  const citationFormat = getCitationFormat();
  const pageTitleFormat = getPageTitleFormat();

  return {
    citationFormat,
    databaseID,
    databaseProperties,
    notion,
    pageTitleFormat,
  };
}

function getCitationFormat(): string {
  const format = Zotero.Prefs.get('export.quickCopy.setting');

  if (typeof format === 'string' && format) return format;

  return APA_STYLE;
}

function getPageTitleFormat(): PageTitleFormat {
  return getNoteroPref(NoteroPref.pageTitleFormat) || PageTitleFormat.itemTitle;
}

async function retrieveDatabaseProperties(
  notion: Client,
  databaseID: string,
): Promise<DatabaseProperties> {
  const database = await notion.databases.retrieve({
    database_id: databaseID,
  });

  return database.properties;
}

async function syncItems(
  items: Zotero.Item[],
  progressWindow: ProgressWindow,
  params: SyncJobParams,
) {
  for (const [index, item] of items.entries()) {
    const step = index + 1;
    logger.groupCollapsed(
      `Syncing item ${step} of ${items.length} with ID`,
      item.id,
    );
    logger.debug(item.getDisplayTitle());

    await progressWindow.updateText(step);

    try {
      if (item.isNote()) {
        await syncNoteItem(item, params.notion);
      } else {
        await syncRegularItem(item, params);
      }
    } catch (error) {
      throw new ItemSyncError(error, item);
    } finally {
      logger.groupEnd();
    }

    progressWindow.updateProgress(step);
  }

  progressWindow.complete();
}

async function handleError(
  error: unknown,
  progressWindow: ProgressWindow,
  window: Window,
) {
  let cause = error;
  let failedItem: Zotero.Item | undefined;

  if (error instanceof ItemSyncError) {
    cause = error.cause;
    failedItem = error.item;
  }

  const errorMessage = await getLocalizedErrorMessage(
    cause,
    window.document.l10n,
  );

  logger.error(error, failedItem?.getDisplayTitle());

  progressWindow.fail(errorMessage, failedItem);
}
