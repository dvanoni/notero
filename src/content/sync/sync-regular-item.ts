import { APIErrorCode, isFullPage } from '@notionhq/client';
import type {
  CreatePageResponse,
  UpdatePageResponse,
} from '@notionhq/client/build/src/api-endpoints';

import {
  getNotionPageID,
  saveNotionLinkAttachment,
  saveNotionTag,
} from '../data/item-data';
import { LocalizableError } from '../errors';
import { logger } from '../utils';

import { convertWebURLToAppURL, isNotionErrorWithCode } from './notion-utils';
import { buildProperties } from './property-builder';
import type { SyncJobParams } from './sync-job';

export async function syncRegularItem(
  item: Zotero.Item,
  params: SyncJobParams,
): Promise<void> {
  const response = await saveItemToDatabase(item, params);

  await saveNotionTag(item);

  if (isFullPage(response)) {
    const appURL = convertWebURLToAppURL(response.url);
    await saveNotionLinkAttachment(item, appURL);
  } else {
    throw new LocalizableError(
      'Failed to create Notion link attachment',
      'notero-error-notion-link-attachment',
    );
  }
}

async function saveItemToDatabase(
  item: Zotero.Item,
  { databaseID, notion, ...params }: SyncJobParams,
): Promise<CreatePageResponse & UpdatePageResponse> {
  const pageID = getNotionPageID(item);

  const properties = await buildProperties({ item, ...params });

  if (pageID) {
    try {
      logger.debug('Update page', pageID, properties);
      return await notion.pages.update({ page_id: pageID, properties });
    } catch (error) {
      if (!isNotionErrorWithCode(error, APIErrorCode.ObjectNotFound)) {
        throw error;
      }
    }
  }

  logger.debug('Create page', properties);
  return await notion.pages.create({
    parent: { database_id: databaseID },
    properties,
  });
}
