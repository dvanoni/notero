import { APIErrorCode, type Client, isFullPage } from '@notionhq/client';
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
import { buildProperties, PropertyBuilderParams } from './property-builder';

type SyncRegularItemParams = PropertyBuilderParams & {
  databaseID: string;
  notion: Client;
};

export async function syncRegularItem(
  params: SyncRegularItemParams,
): Promise<void> {
  const response = await saveItemToDatabase(params);

  await saveNotionTag(params.item);

  if (isFullPage(response)) {
    const appURL = convertWebURLToAppURL(response.url);
    await saveNotionLinkAttachment(params.item, appURL);
  } else {
    throw new LocalizableError(
      'Failed to create Notion link attachment',
      'notero-error-notion-link-attachment',
    );
  }
}

async function saveItemToDatabase(
  params: SyncRegularItemParams,
): Promise<CreatePageResponse & UpdatePageResponse> {
  const { databaseID, item, notion } = params;
  const pageID = getNotionPageID(item);

  const properties = await buildProperties(params);

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
