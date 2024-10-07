import { type Client } from '@notionhq/client';

import { APA_STYLE } from '../constants';
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

type SyncJobParams = {
  citationFormat: string;
  databaseID: string;
  databaseProperties: DatabaseProperties;
  items: Zotero.Item[];
  notion: Client;
  pageTitleFormat: PageTitleFormat;
  progressWindow: ProgressWindow;
};

export async function performSyncJob(
  itemIDs: Set<Zotero.Item['id']>,
  window: Window,
): Promise<void> {
  const items = Zotero.Items.get(Array.from(itemIDs));
  if (!items.length) return;

  const progressWindow = new ProgressWindow(items.length, window);
  await progressWindow.show();

  try {
    const syncJob = await prepareSyncJob({ items, progressWindow, window });

    await syncJob.perform();

    progressWindow.complete();
  } catch (error) {
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
}

async function prepareSyncJob({
  items,
  progressWindow,
  window,
}: Pick<SyncJobParams, 'items' | 'progressWindow'> & {
  window: Window;
}): Promise<SyncJob> {
  const notion = getNotionClient(window);
  const databaseID = getRequiredNoteroPref(NoteroPref.notionDatabaseID);
  const databaseProperties = await retrieveDatabaseProperties(
    notion,
    databaseID,
  );
  const citationFormat = getCitationFormat();
  const pageTitleFormat = getPageTitleFormat();

  return new SyncJob({
    citationFormat,
    databaseID,
    databaseProperties,
    items,
    notion,
    pageTitleFormat,
    progressWindow,
  });
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

class ItemSyncError extends Error {
  public readonly item: Zotero.Item;
  public readonly name = 'ItemSyncError';

  public constructor(cause: unknown, item: Zotero.Item) {
    super(`Failed to sync item with ID ${item.id} due to ${String(cause)}`, {
      cause,
    });
    this.item = item;
  }
}

class SyncJob {
  public readonly citationFormat: string;
  public readonly databaseID: string;
  public readonly databaseProperties: DatabaseProperties;
  public readonly items: Zotero.Item[];
  public readonly notion: Client;
  public readonly pageTitleFormat: PageTitleFormat;
  public readonly progressWindow: ProgressWindow;

  public constructor(params: SyncJobParams) {
    this.citationFormat = params.citationFormat;
    this.databaseID = params.databaseID;
    this.databaseProperties = params.databaseProperties;
    this.items = params.items;
    this.notion = params.notion;
    this.pageTitleFormat = params.pageTitleFormat;
    this.progressWindow = params.progressWindow;
  }

  public async perform() {
    for (const [index, item] of this.items.entries()) {
      const step = index + 1;
      logger.groupCollapsed(
        `Syncing item ${step} of ${this.items.length} with ID`,
        item.id,
      );
      logger.debug(item.getDisplayTitle());

      await this.progressWindow.updateText(step);

      try {
        if (item.isNote()) {
          await syncNoteItem(this.notion, item);
        } else {
          await syncRegularItem({ ...this, item });
        }
      } catch (error) {
        throw new ItemSyncError(error, item);
      } finally {
        logger.groupEnd();
      }

      this.progressWindow.updateProgress(step);
    }
  }
}
