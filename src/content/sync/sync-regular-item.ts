import { APIErrorCode, type Client, isFullPage } from '@notionhq/client';
import type { CreatePageResponse } from '@notionhq/client/build/src/api-endpoints';

import {
  getNotionPageID,
  saveNotionLinkAttachment,
  saveNotionTag,
} from '../data/item-data';
import { LocalizableError } from '../errors';
import { getNoteroPref, NoteroPref, UrlSchema } from '../prefs/notero-pref';
import { logger } from '../utils';

import type { DatabaseRequestProperties } from './notion-types';
import {
  convertWebURLToAppURL,
  isArchivedOrNotFoundError,
  isNotionErrorWithCode,
  normalizeID,
} from './notion-utils';
import { buildProperties } from './property-builder';
import type { SyncJobParams } from './sync-job';

export async function syncRegularItem(
  item: Zotero.Item,
  params: SyncJobParams,
): Promise<void> {
  const response = await saveItemToDatabase(item, params);

  await saveNotionTag(item);

  if (isFullPage(response)) {
    // Decide link schema based on user preference
    const notionURL =
      getNoteroPref(NoteroPref.urlSchema) === UrlSchema.notion
        ? convertWebURLToAppURL(response.url)
        : response.url;
    await saveNotionLinkAttachment(item, notionURL);
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
): Promise<CreatePageResponse> {
  const pageID = getNotionPageID(item);

  const properties = await buildProperties({ item, ...params });

  if (pageID) {
    return updatePage(notion, databaseID, pageID, properties);
  }

  return createPage(notion, databaseID, properties);
}

function createPage(
  notion: Client,
  databaseID: string,
  properties: DatabaseRequestProperties,
): Promise<CreatePageResponse> {
  logger.debug('Creating page in database', databaseID, properties);
  return notion.pages.create({
    parent: { database_id: databaseID },
    properties,
  });
}

async function updatePage(
  notion: Client,
  databaseID: string,
  pageID: string,
  properties: DatabaseRequestProperties,
): Promise<CreatePageResponse> {
  logger.debug('Updating page', pageID, 'in database', databaseID, properties);
  try {
    const response = await notion.pages.update({ page_id: pageID, properties });
    return await recreatePageIfDatabaseDiffers(
      notion,
      databaseID,
      properties,
      response,
    );
  } catch (error) {
    if (isArchivedOrNotFoundError(error)) {
      logger.debug('Recreating page that was not found');
      return createPage(notion, databaseID, properties);
    }
    if (!isNotionErrorWithCode(error, APIErrorCode.ValidationError)) {
      throw error;
    }
    const retrieveResponse = await notion.pages.retrieve({ page_id: pageID });
    const createResponse = await recreatePageIfDatabaseDiffers(
      notion,
      databaseID,
      properties,
      retrieveResponse,
    );
    // Throw the original error if the page was not recreated
    if (createResponse === retrieveResponse) {
      throw error;
    }
    return createResponse;
  }
}

async function recreatePageIfDatabaseDiffers(
  notion: Client,
  desiredDatabaseID: string,
  properties: DatabaseRequestProperties,
  response: CreatePageResponse,
): Promise<CreatePageResponse> {
  if (!isFullPage(response) || response.parent.type !== 'database_id') {
    return response;
  }

  const currentDatabaseID = normalizeID(response.parent.database_id);
  if (currentDatabaseID === normalizeID(desiredDatabaseID)) {
    return response;
  }

  logger.debug(
    'Recreating page found in different database',
    currentDatabaseID,
  );
  return createPage(notion, desiredDatabaseID, properties);
}
