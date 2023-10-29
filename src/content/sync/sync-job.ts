import { isFullPage, type Client, APIErrorCode } from '@notionhq/client';
import type {
  CreatePageResponse,
  UpdatePageResponse,
} from '@notionhq/client/build/src/api-endpoints';

import { APA_STYLE } from '../constants';
import { NoteroItem } from '../models/notero-item';
import {
  NoteroPref,
  PageTitleFormat,
  getNoteroPref,
} from '../prefs/notero-pref';
import { getLocalizedString, hasErrorStack, log } from '../utils';

import { getNotionClient } from './notion-client';
import type { DatabaseProperties } from './notion-types';
import { isNotionErrorWithCode } from './notion-utils';
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
  itemsIDs: Set<Zotero.Item['id']>,
  window: Window,
): Promise<void> {
  const items = Zotero.Items.get(Array.from(itemsIDs));
  if (!items.length) return;

  const progressWindow = new ProgressWindow(items.length);

  try {
    const syncJob = await prepareSyncJob({ items, progressWindow, window });

    await syncJob.perform();

    progressWindow.complete();
  } catch (error) {
    const errorMessage = String(error);

    log(errorMessage, 'error');
    if (hasErrorStack(error)) log(error.stack, 'error');

    progressWindow.fail(errorMessage);
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
  const databaseID = getDatabaseID();
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

function getDatabaseID(): string {
  const databaseID = getNoteroPref(NoteroPref.notionDatabaseID);

  if (databaseID) return databaseID;

  throw new Error(`Missing ${getLocalizedString(NoteroPref.notionDatabaseID)}`);
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
      log(`Saving item ${step} of ${this.items.length} with ID ${item.id}`);

      this.progressWindow.updateText(step);

      if (item.isNote()) {
        await this.syncNoteItem(item);
      } else {
        await this.syncRegularItem(item);
      }

      this.progressWindow.updateProgress(step);
    }
  }

  private async syncRegularItem(item: Zotero.Item) {
    const noteroItem = new NoteroItem(item);

    const response = await this.saveItemToDatabase(noteroItem);

    await noteroItem.saveNotionTag();

    if (isFullPage(response)) {
      await noteroItem.saveNotionLinkAttachment(response.url);
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
    noteroItem: NoteroItem,
  ): Promise<CreatePageResponse & UpdatePageResponse> {
    const pageID = noteroItem.getNotionPageID();

    const properties = await buildProperties({
      citationFormat: this.citationFormat,
      databaseProperties: this.databaseProperties,
      item: noteroItem.zoteroItem,
      pageTitleFormat: this.pageTitleFormat,
    });

    if (pageID) {
      try {
        return await this.notion.pages.update({ page_id: pageID, properties });
      } catch (error) {
        if (!isNotionErrorWithCode(error, APIErrorCode.ObjectNotFound)) {
          throw error;
        }
      }
    }

    return await this.notion.pages.create({
      parent: { database_id: this.databaseID },
      properties,
    });
  }

  private async syncNoteItem(item: Zotero.Item) {
    await syncNote(this.notion, item);
  }
}
