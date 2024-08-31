import { isFullPage, type Client, APIErrorCode } from '@notionhq/client';
import type {
  CreatePageResponse,
  UpdatePageResponse,
} from '@notionhq/client/build/src/api-endpoints';

import { APA_STYLE } from '../constants';
import {
  getNotionPageID,
  saveNotionLinkAttachment,
  saveNotionTag,
} from '../data/item-data';
import {
  NoteroPref,
  PageTitleFormat,
  getNoteroPref,
  getRequiredNoteroPref,
} from '../prefs/notero-pref';
import { logger } from '../utils';

import { getNotionClient } from './notion-client';
import type { DatabaseProperties } from './notion-types';
import { convertWebURLToAppURL, isNotionErrorWithCode } from './notion-utils';
import { ProgressWindow } from './progress-window';
import { buildProperties } from './property-builder';
import { syncNote } from './sync-note';

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

  const progressWindow = new ProgressWindow(items.length);

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

    const errorMessage = String(cause);

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
  private readonly citationFormat: string;
  private readonly databaseID: string;
  private readonly databaseProperties: DatabaseProperties;
  private readonly items: Zotero.Item[];
  private readonly notion: Client;
  private readonly pageTitleFormat: PageTitleFormat;
  private readonly progressWindow: ProgressWindow;

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

      this.progressWindow.updateText(step);

      try {
        if (item.isNote()) {
          await this.syncNoteItem(item);
        } else {
          await this.syncRegularItem(item);
        }
      } catch (error) {
        throw new ItemSyncError(error, item);
      } finally {
        logger.groupEnd();
      }

      this.progressWindow.updateProgress(step);
    }
  }

  private async syncRegularItem(item: Zotero.Item) {
    const response = await this.saveItemToDatabase(item);

    await saveNotionTag(item);

    if (isFullPage(response)) {
      const appURL = convertWebURLToAppURL(response.url);
      await saveNotionLinkAttachment(item, appURL);
    } else {
      throw new Error(
        'Failed to create Notion link attachment. ' +
          'This will result in duplicate Notion pages. ' +
          'Please ensure that the "read content" capability is enabled ' +
          'for the Notero integration at www.notion.so/my-integrations.',
      );
    }
  }

  private async saveItemToDatabase(
    item: Zotero.Item,
  ): Promise<CreatePageResponse & UpdatePageResponse> {
    const pageID = getNotionPageID(item);

    const properties = await buildProperties({
      citationFormat: this.citationFormat,
      databaseProperties: this.databaseProperties,
      item,
      pageTitleFormat: this.pageTitleFormat,
    });

    if (pageID) {
      try {
        logger.debug('Update page', pageID, properties);
        return await this.notion.pages.update({ page_id: pageID, properties });
      } catch (error) {
        if (!isNotionErrorWithCode(error, APIErrorCode.ObjectNotFound)) {
          throw error;
        }
      }
    }

    logger.debug('Create page', properties);
    return await this.notion.pages.create({
      parent: { database_id: this.databaseID },
      properties,
    });
  }

  private async syncNoteItem(item: Zotero.Item) {
    await syncNote(this.notion, item);
  }
}
