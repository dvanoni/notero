import { APIErrorCode, APIResponseError, type Client } from '@notionhq/client';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { describe, expect, it, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';

import { createZoteroItemMock } from '../../../../test/utils';
import { getNotionPageID } from '../../data/item-data';
import { PageTitleFormat } from '../../prefs/notero-pref';
import type { DatabaseRequestProperties } from '../notion-types';
import { buildProperties } from '../property-builder';
import type { SyncJobParams } from '../sync-job';
import { syncRegularItem } from '../sync-regular-item';

vi.mock('../../data/item-data');
vi.mock('../property-builder');

const objectNotFoundError = new APIResponseError({
  code: APIErrorCode.ObjectNotFound,
  status: 404,
  message: 'Not found',
  headers: {},
  rawBodyText: 'Not found',
});

const validationError = new APIResponseError({
  code: APIErrorCode.ValidationError,
  status: 400,
  message: 'Validation error',
  headers: {},
  rawBodyText: 'Validation error',
});

const fakeCitationFormat = 'fake-style';
const fakeDatabaseID = 'fake-database-id';
const fakeDatabaseProperties = {};
const fakePageID = 'fake-page-id';
const fakePageProperties: DatabaseRequestProperties = { title: { title: [] } };
const fakePageTitleFormat = PageTitleFormat.itemAuthorDateCitation;
const fakePageResponse: PageObjectResponse = {
  archived: false,
  cover: null,
  created_by: { id: '', object: 'user' },
  created_time: '',
  icon: null,
  id: fakePageID,
  in_trash: false,
  last_edited_by: { id: '', object: 'user' },
  last_edited_time: '',
  object: 'page',
  parent: { database_id: fakeDatabaseID, type: 'database_id' },
  properties: {},
  public_url: null,
  url: 'fake-url',
};

function setup({ pageID }: { pageID?: string }) {
  const regularItem = createZoteroItemMock();
  const notion = mockDeep<Client>({
    fallbackMockImplementation: () => {
      throw new Error('NOT MOCKED');
    },
  });

  vi.mocked(getNotionPageID).mockReturnValue(pageID);
  vi.mocked(buildProperties).mockResolvedValue(fakePageProperties);

  notion.pages.create.mockResolvedValue(fakePageResponse);
  notion.pages.update.mockResolvedValue(fakePageResponse);
  notion.pages.retrieve.mockResolvedValue(fakePageResponse);

  const params: SyncJobParams = {
    collectionRelationMap: {},
    citationFormat: fakeCitationFormat,
    databaseID: fakeDatabaseID,
    databaseProperties: fakeDatabaseProperties,
    notion,
    pageTitleFormat: fakePageTitleFormat,
  };

  return { notion, params, regularItem };
}

describe('syncRegularItem', () => {
  it('creates new page when page ID is not set', async () => {
    const { notion, params, regularItem } = setup({ pageID: undefined });

    await syncRegularItem(regularItem, params);

    expect(notion.pages.create).toHaveBeenCalledWith({
      parent: { database_id: fakeDatabaseID },
      properties: fakePageProperties,
    });
    expect(notion.pages.update).not.toHaveBeenCalled();
  });

  it('updates existing page when page ID is set', async () => {
    const { notion, params, regularItem } = setup({ pageID: fakePageID });

    await syncRegularItem(regularItem, params);

    expect(notion.pages.update).toHaveBeenCalledWith({
      page_id: fakePageID,
      properties: fakePageProperties,
    });
    expect(notion.pages.create).not.toHaveBeenCalled();
  });

  it('creates new page when existing page is not found', async () => {
    const { notion, params, regularItem } = setup({ pageID: fakePageID });
    notion.pages.update.mockRejectedValue(objectNotFoundError);

    await syncRegularItem(regularItem, params);

    expect(notion.pages.update).toHaveBeenCalledWith({
      page_id: fakePageID,
      properties: fakePageProperties,
    });
    expect(notion.pages.create).toHaveBeenCalledWith({
      parent: { database_id: fakeDatabaseID },
      properties: fakePageProperties,
    });
  });

  it('creates new page when existing page belongs to different database', async () => {
    const { notion, params, regularItem } = setup({ pageID: fakePageID });
    notion.pages.update.mockResolvedValue({
      ...fakePageResponse,
      parent: { database_id: 'different-database-id', type: 'database_id' },
    });

    await syncRegularItem(regularItem, params);

    expect(notion.pages.update).toHaveBeenCalledWith({
      page_id: fakePageID,
      properties: fakePageProperties,
    });
    expect(notion.pages.create).toHaveBeenCalledWith({
      parent: { database_id: fakeDatabaseID },
      properties: fakePageProperties,
    });
  });

  it('creates new page when validation error is caused by differing database', async () => {
    const { notion, params, regularItem } = setup({ pageID: fakePageID });
    notion.pages.update.mockRejectedValue(validationError);
    notion.pages.retrieve.mockResolvedValue({
      ...fakePageResponse,
      parent: { database_id: 'different-database-id', type: 'database_id' },
    });

    await syncRegularItem(regularItem, params);

    expect(notion.pages.update).toHaveBeenCalledWith({
      page_id: fakePageID,
      properties: fakePageProperties,
    });
    expect(notion.pages.create).toHaveBeenCalledWith({
      parent: { database_id: fakeDatabaseID },
      properties: fakePageProperties,
    });
  });

  it('throws error when validation error is not caused by differing database', async () => {
    const { notion, params, regularItem } = setup({ pageID: fakePageID });
    notion.pages.update.mockRejectedValue(validationError);

    await expect(() => syncRegularItem(regularItem, params)).rejects.toThrow(
      validationError,
    );
  });

  it('throws error when error is unexpected type', async () => {
    const { notion, params, regularItem } = setup({ pageID: fakePageID });
    const unexpectedError = new APIResponseError({
      code: APIErrorCode.InternalServerError,
      status: 500,
      message: 'Internal server error',
      headers: {},
      rawBodyText: 'Internal server error',
    });
    notion.pages.update.mockRejectedValue(unexpectedError);

    await expect(() => syncRegularItem(regularItem, params)).rejects.toThrow(
      unexpectedError,
    );
  });
});
