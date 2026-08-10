import { describe, expect, it, vi } from 'vite-plus/test';
import { mockDeep } from 'vitest-mock-extended';

import { createZoteroItemMock } from '../../../../test/utils';
import {
  SyncedNotes,
  getCapacitiesObjectID,
  getSyncedNotes,
  saveSyncedNote,
} from '../../data/item-data';
import { PageTitleFormat } from '../../prefs/notero-pref';
import type { CapacitiesClient } from '../capacities-client';
import { CapacitiesApiError } from '../capacities-client';
import type { CapacitiesObject, Structure } from '../capacities-types';
import type { SyncJobParams } from '../sync-job';
import { syncNoteItem } from '../sync-note-item';

vi.mock('../../data/item-data');

const fakeObjectID = 'fake-object-id';
const fakeContainerID = 'fake-container-id';
const fakeNoteBlockID = 'fake-note-block-id';
const fakeNoteTitle = 'Fake Note Title';

const notFoundError = new CapacitiesApiError(404, 'Not found');

const fakeStructure: Structure = {
  id: 'fake-structure-id',
  title: 'Fake Structure',
  pluralName: 'Fake Structures',
  propertyDefinitions: [],
  labelColor: '#000000',
  collections: [],
};

function createObjectResponse(blockID: string | undefined): CapacitiesObject {
  return {
    id: fakeObjectID,
    structureId: fakeStructure.id,
    collections: [],
    properties: {},
    blocks: { content: blockID ? [{ id: blockID }] : [] },
  };
}

function setup({ syncedNotes }: { syncedNotes: SyncedNotes }) {
  vi.clearAllMocks();

  const noteItem = createZoteroItemMock({
    getNoteTitle: () => fakeNoteTitle,
  });
  const capacities = mockDeep<CapacitiesClient>({
    fallbackMockImplementation: () => {
      throw new Error('NOT MOCKED');
    },
  });
  const regularItem = createZoteroItemMock();
  noteItem.isTopLevelItem.mockReturnValue(false);
  noteItem.topLevelItem = regularItem;

  vi.mocked(getCapacitiesObjectID).mockReturnValue(fakeObjectID);
  vi.mocked(getSyncedNotes).mockReturnValue(syncedNotes);

  capacities.appendMarkdown.mockImplementation((_id, _markdown, options) => {
    if (options?.parentBlockId === fakeContainerID) {
      return Promise.resolve(createObjectResponse(fakeNoteBlockID));
    }
    if (options?.parentBlockId === fakeNoteBlockID) {
      return Promise.resolve(createObjectResponse(undefined));
    }
    return Promise.resolve(createObjectResponse(fakeContainerID));
  });

  const params: SyncJobParams = {
    capacities,
    citationFormat: 'fake-style',
    collectionID: undefined,
    pageTitleFormat: PageTitleFormat.itemTitle,
    spaceID: 'fake-space-id',
    structure: fakeStructure,
  };

  return { capacities, noteItem, params, regularItem };
}

/* oxlint-disable typescript/unbound-method */
describe('syncNoteItem', () => {
  it('throws an error when note has no parent', async () => {
    const { noteItem, params } = setup({ syncedNotes: {} });
    noteItem.isTopLevelItem.mockReturnValue(true);
    noteItem.topLevelItem = noteItem;

    await expect(() => syncNoteItem(noteItem, params)).rejects.toThrow(
      'Cannot sync note without a parent item',
    );
  });

  it('throws an error when parent item is not synced', async () => {
    const { noteItem, params } = setup({ syncedNotes: {} });
    vi.mocked(getCapacitiesObjectID).mockReturnValue(undefined);

    await expect(() => syncNoteItem(noteItem, params)).rejects.toThrow(
      'Cannot sync note because its parent item is not synced',
    );
  });

  it('creates a container block when item does not already have one', async () => {
    const { capacities, noteItem, params } = setup({ syncedNotes: {} });

    await syncNoteItem(noteItem, params);

    expect(capacities.appendMarkdown).toHaveBeenNthCalledWith(
      1,
      fakeObjectID,
      '## Zotero Notes',
    );
  });

  it('saves the containerBlockID to the regular item', async () => {
    const { noteItem, params, regularItem } = setup({ syncedNotes: {} });

    await syncNoteItem(noteItem, params);

    expect(saveSyncedNote).toHaveBeenCalledExactlyOnceWith(
      regularItem,
      fakeContainerID,
      expect.anything(),
      expect.anything(),
    );
  });

  describe('when item has a containerBlockID', () => {
    it('does not create a container block if existing one is found', async () => {
      const { capacities, noteItem, params } = setup({
        syncedNotes: { containerBlockID: fakeContainerID },
      });

      await syncNoteItem(noteItem, params);

      expect(capacities.appendMarkdown).not.toHaveBeenCalledWith(
        fakeObjectID,
        '## Zotero Notes',
      );
    });

    it('creates a new container block if existing one is not found', async () => {
      const { capacities, noteItem, params } = setup({
        syncedNotes: { containerBlockID: fakeContainerID },
      });

      capacities.appendMarkdown.mockImplementationOnce(() =>
        Promise.reject(notFoundError),
      );

      await syncNoteItem(noteItem, params);

      expect(capacities.appendMarkdown).toHaveBeenNthCalledWith(
        2,
        fakeObjectID,
        '## Zotero Notes',
      );
    });
  });

  it('saves container block ID even when note block fails to create', async () => {
    const { capacities, noteItem, params, regularItem } = setup({
      syncedNotes: { containerBlockID: fakeContainerID },
    });

    capacities.appendMarkdown.mockImplementation(() =>
      Promise.reject(new Error('Failed to append blocks')),
    );

    await expect(() => syncNoteItem(noteItem, params)).rejects.toThrow(
      'Failed to append blocks',
    );

    expect(saveSyncedNote).toHaveBeenCalledExactlyOnceWith(
      regularItem,
      fakeContainerID,
      undefined,
      expect.anything(),
    );
  });

  it('saves note block ID even when note content fails to sync', async () => {
    const { capacities, noteItem, params, regularItem } = setup({
      syncedNotes: { containerBlockID: fakeContainerID },
    });

    capacities.appendMarkdown.mockImplementation((_id, _markdown, options) => {
      if (options?.parentBlockId === fakeNoteBlockID) {
        return Promise.reject(new Error('Failed to append blocks'));
      }
      return Promise.resolve(createObjectResponse(fakeNoteBlockID));
    });

    await expect(() => syncNoteItem(noteItem, params)).rejects.toThrow(
      'Failed to append blocks',
    );

    expect(saveSyncedNote).toHaveBeenCalledExactlyOnceWith(
      regularItem,
      expect.anything(),
      fakeNoteBlockID,
      expect.anything(),
    );
  });
});
/* oxlint-enable typescript/unbound-method */
