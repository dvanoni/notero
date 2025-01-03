import { APIErrorCode, APIResponseError, type Client } from '@notionhq/client';
import type {
  AppendBlockChildrenResponse,
  PartialBlockObjectResponse,
} from '@notionhq/client/build/src/api-endpoints';
import { describe, expect, it, vi } from 'vitest';
import { mockDeep, objectContainsValue } from 'vitest-mock-extended';

import { createZoteroItemMock } from '../../../../test/utils';
import {
  SyncedNotes,
  getNotionPageID,
  getSyncedNotes,
  saveSyncedNote,
} from '../../data/item-data';
import { syncNoteItem } from '../sync-note-item';

vi.mock('../../data/item-data');

const containerHeadingBlock = {
  heading_1: {
    rich_text: [{ text: { content: 'Zotero Notes' } }],
    is_toggleable: true,
  },
};

const objectNotFoundError = new APIResponseError({
  code: APIErrorCode.ObjectNotFound,
  status: 404,
  message: 'Not found',
  headers: {},
  rawBodyText: 'Not found',
});

const fakeNoteTitle = 'Fake Note Title';
const fakePageID = 'fake-page-id';
const fakeContainerID = 'fake-container-id';
const fakeNoteBlockID = 'fake-note-block-id';

function createResponseMock(response: Partial<PartialBlockObjectResponse>) {
  return mockDeep<AppendBlockChildrenResponse>({
    results: [{ object: 'block', id: 'id', ...response }],
  });
}

function setup({ syncedNotes }: { syncedNotes: SyncedNotes }) {
  vi.clearAllMocks();

  const noteItem = createZoteroItemMock({
    getNoteTitle: () => fakeNoteTitle,
  });
  const notion = mockDeep<Client>({
    fallbackMockImplementation: () => {
      throw new Error('NOT MOCKED');
    },
  });
  const regularItem = createZoteroItemMock();
  noteItem.isTopLevelItem.mockReturnValue(false);
  noteItem.topLevelItem = regularItem;

  vi.mocked(getNotionPageID).mockReturnValue(fakePageID);
  vi.mocked(getSyncedNotes).mockReturnValue(syncedNotes);

  notion.blocks.children.append
    .calledWith(objectContainsValue(fakePageID))
    .mockResolvedValue(createResponseMock({ id: fakeContainerID }));
  notion.blocks.children.append
    .calledWith(objectContainsValue(fakeContainerID))
    .mockResolvedValue(createResponseMock({ id: fakeNoteBlockID }));
  notion.blocks.children.append
    .calledWith(objectContainsValue(fakeNoteBlockID))
    .mockResolvedValue(createResponseMock({}));

  return { noteItem, notion, regularItem };
}

describe('syncNoteItem', () => {
  it('throws an error when note has no parent', async () => {
    const { noteItem, notion } = setup({ syncedNotes: {} });
    noteItem.isTopLevelItem.mockReturnValue(true);
    noteItem.topLevelItem = noteItem;

    await expect(() => syncNoteItem(noteItem, notion)).rejects.toThrow(
      'Cannot sync note without a parent item',
    );
  });

  it('throws an error when parent item is not synced', async () => {
    const { noteItem, notion } = setup({ syncedNotes: {} });
    vi.mocked(getNotionPageID).mockReturnValue(undefined);

    await expect(() => syncNoteItem(noteItem, notion)).rejects.toThrow(
      'Cannot sync note because its parent item is not synced',
    );
  });

  it('creates a container block when item does not already have one', async () => {
    const { noteItem, notion } = setup({ syncedNotes: {} });

    await syncNoteItem(noteItem, notion);

    expect(notion.blocks.children.append).toHaveBeenCalledWith({
      block_id: fakePageID,
      children: [containerHeadingBlock],
    });
  });

  it('saves the containerBlockID to the regular item', async () => {
    const { noteItem, notion, regularItem } = setup({ syncedNotes: {} });

    await syncNoteItem(noteItem, notion);

    expect(saveSyncedNote).toHaveBeenCalledWith(
      regularItem,
      fakeContainerID,
      expect.anything(),
      expect.anything(),
    );
  });

  describe('when item has a containerBlockID', () => {
    it('does not create a container block if existing one is found', async () => {
      const { noteItem, notion } = setup({
        syncedNotes: { containerBlockID: fakeContainerID },
      });

      await syncNoteItem(noteItem, notion);

      expect(notion.blocks.children.append).not.toHaveBeenCalledWith({
        block_id: fakePageID,
        children: [containerHeadingBlock],
      });
    });

    it('creates a new container block if existing one is not found', async () => {
      const { noteItem, notion } = setup({
        syncedNotes: { containerBlockID: fakeContainerID },
      });

      notion.blocks.children.append
        .calledWith(objectContainsValue(fakeContainerID))
        .mockRejectedValueOnce(objectNotFoundError)
        .mockResolvedValueOnce(createResponseMock({ id: fakeNoteBlockID }));

      await syncNoteItem(noteItem, notion);

      expect(notion.blocks.children.append).toHaveBeenCalledWith({
        block_id: fakePageID,
        children: [containerHeadingBlock],
      });
    });
  });

  it('saves container block ID even when note block fails to create', async () => {
    const { noteItem, notion, regularItem } = setup({
      syncedNotes: { containerBlockID: fakeContainerID },
    });

    notion.blocks.children.append
      .calledWith(objectContainsValue(fakeContainerID))
      .mockRejectedValue(new Error('Failed to append children'));

    await expect(() => syncNoteItem(noteItem, notion)).rejects.toThrow();

    expect(saveSyncedNote).toHaveBeenCalledWith(
      regularItem,
      fakeContainerID,
      undefined,
      expect.anything(),
    );
  });

  it('saves note block ID even when note content fails to sync', async () => {
    const { noteItem, notion, regularItem } = setup({
      syncedNotes: { containerBlockID: fakeContainerID },
    });

    notion.blocks.children.append
      .calledWith(objectContainsValue(fakeNoteBlockID))
      .mockRejectedValue(new Error('Failed to append children'));

    await expect(() => syncNoteItem(noteItem, notion)).rejects.toThrow();

    expect(saveSyncedNote).toHaveBeenCalledWith(
      regularItem,
      expect.anything(),
      fakeNoteBlockID,
      expect.anything(),
    );
  });
});
