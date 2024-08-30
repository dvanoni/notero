import {
  createWindowMock,
  createZoteroCollectionMock,
  createZoteroItemMock,
  mockZoteroPrefs,
  zoteroMock,
} from '../../../../test/utils';
import { getSyncedNotes } from '../../data/item-data';
import { saveSyncConfigs } from '../../prefs/collection-sync-config';
import { NoteroPref, setNoteroPref } from '../../prefs/notero-pref';
import { performSyncJob } from '../../sync/sync-job';
import { parseItemDate } from '../../utils';
import { EventManager, SyncManager } from '../index';

jest.mock('../../data/item-data');
jest.mock('../../sync/sync-job');
jest.mock('../../utils/parse-item-date');

jest.mocked(parseItemDate).mockImplementation((date) => new Date(date));

const mockedGetSyncedNotes = jest.mocked(getSyncedNotes);
const mockedPerformSyncJob = jest.mocked(performSyncJob);

const pluginInfo = {
  pluginID: 'test',
  rootURI: 'test',
  version: 'test',
};

const collection = createZoteroCollectionMock();

const regularItem = createZoteroItemMock({
  deleted: false,
  isRegularItem: () => true,
});

const syncedNoteItem = createZoteroItemMock({
  dateModified: '2023-10-09T15:00:00Z',
  deleted: false,
  getNote: () => 'Synced note item',
  isRegularItem: () => false,
  isNote: () => true,
  topLevelItem: regularItem,
});

const outOfSyncNoteItem = createZoteroItemMock({
  dateModified: '2023-07-12T09:00:00Z',
  deleted: false,
  getNote: () => 'Out-of-sync note item',
  isRegularItem: () => false,
  isNote: () => true,
  topLevelItem: regularItem,
});

const unsyncedNoteItem = createZoteroItemMock({
  dateModified: '2023-03-02T13:00:00Z',
  deleted: false,
  getNote: () => 'Unsynced note item',
  isRegularItem: () => false,
  isNote: () => true,
  topLevelItem: regularItem,
});

const emptyNoteItem = createZoteroItemMock({
  dateModified: '2023-12-05T10:00:00Z',
  deleted: false,
  getNote: () => '',
  isRegularItem: () => false,
  isNote: () => true,
  topLevelItem: regularItem,
});

const deletedItem = createZoteroItemMock({
  deleted: true,
  isRegularItem: () => true,
});

const regularItemNotInCollection = createZoteroItemMock({
  deleted: false,
  isRegularItem: () => true,
});

const noteItemNotInCollection = createZoteroItemMock({
  dateModified: '2023-04-10T17:00:00Z',
  deleted: false,
  getNote: () => 'Note item not in collection',
  isRegularItem: () => false,
  isNote: () => true,
  topLevelItem: regularItemNotInCollection,
});

regularItem.addToCollection(collection.id);
deletedItem.addToCollection(collection.id);

regularItem.getNotes.mockReturnValue([
  syncedNoteItem.id,
  outOfSyncNoteItem.id,
  unsyncedNoteItem.id,
  emptyNoteItem.id,
]);

deletedItem.getNotes.mockReturnValue([]);

regularItemNotInCollection.getNotes.mockReturnValue([
  noteItemNotInCollection.id,
]);

mockedGetSyncedNotes.mockReturnValue({
  notes: {
    [syncedNoteItem.key]: {
      blockID: 'block1',
      syncedAt: new Date(syncedNoteItem.dateModified),
    },
    [outOfSyncNoteItem.key]: {
      blockID: 'block2',
      syncedAt: new Date(
        new Date(outOfSyncNoteItem.dateModified).getTime() - 10_000,
      ),
    },
  },
});

const fakeTagID = 1234;

function setup({
  collectionSyncEnabled = true,
  syncNotes = true,
  syncOnModifyItems = true,
}: {
  collectionSyncEnabled?: boolean;
  syncNotes?: boolean;
  syncOnModifyItems?: boolean;
} = {}) {
  mockZoteroPrefs();

  const eventManager = new EventManager();
  const syncManager = new SyncManager();

  const dependencies = { eventManager };

  syncManager.startup({ dependencies, pluginInfo });

  zoteroMock.getMainWindow.mockReturnValue(createWindowMock());

  saveSyncConfigs({ [collection.id]: { syncEnabled: collectionSyncEnabled } });

  setNoteroPref(NoteroPref.syncNotes, syncNotes);
  setNoteroPref(NoteroPref.syncOnModifyItems, syncOnModifyItems);

  return { eventManager };
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('SyncManager', () => {
  it('does not perform sync when window is not available', () => {
    const { eventManager } = setup();

    zoteroMock.getMainWindow.mockReturnValue(null);

    eventManager.emit('request-sync-items', [regularItem]);

    jest.runAllTimers();

    expect(performSyncJob).toHaveBeenCalledTimes(0);
  });

  it('performs sync using the latest available window', async () => {
    const { eventManager } = setup();

    const firstWindow = zoteroMock.getMainWindow();

    eventManager.emit('request-sync-items', [regularItem]);
    await jest.runAllTimersAsync();

    expect(mockedPerformSyncJob.mock.lastCall?.[1]).toBe(firstWindow);

    const secondWindow = createWindowMock();
    zoteroMock.getMainWindow.mockReturnValue(secondWindow);

    eventManager.emit('request-sync-items', [regularItem]);
    await jest.runAllTimersAsync();

    expect(mockedPerformSyncJob).toHaveBeenCalledTimes(2);
    expect(mockedPerformSyncJob.mock.lastCall?.[1]).toBe(secondWindow);
  });

  describe('receiving `request-sync-collection` event', () => {
    it('does not sync deleted items in collection', () => {
      const { eventManager } = setup();

      eventManager.emit('request-sync-collection', collection);

      jest.runAllTimers();

      expect(mockedPerformSyncJob.mock.lastCall?.[0]).not.toContain(
        deletedItem.id,
      );
    });

    it('syncs only regular items in collection when `syncNotes` is disabled', () => {
      const { eventManager } = setup({ syncNotes: false });

      eventManager.emit('request-sync-collection', collection);

      jest.runAllTimers();

      expect(mockedPerformSyncJob.mock.lastCall?.[0]).toStrictEqual(
        new Set([regularItem.id]),
      );
    });

    it('syncs non-empty note items in collection that have not synced or have been modified since last sync when `syncNotes` is enabled', () => {
      const { eventManager } = setup({ syncNotes: true });

      eventManager.emit('request-sync-collection', collection);

      jest.runAllTimers();

      expect(mockedPerformSyncJob.mock.lastCall?.[0]).toStrictEqual(
        new Set([regularItem.id, outOfSyncNoteItem.id, unsyncedNoteItem.id]),
      );
    });
  });

  describe('receiving `request-sync-items` event', () => {
    it('syncs both regular and non-empty note items when requested even if `syncNotes` is disabled', () => {
      const { eventManager } = setup({ syncNotes: false });

      eventManager.emit('request-sync-items', [
        regularItem,
        syncedNoteItem,
        emptyNoteItem,
        regularItemNotInCollection,
        noteItemNotInCollection,
      ]);

      jest.runAllTimers();

      expect(mockedPerformSyncJob.mock.lastCall?.[0]).toStrictEqual(
        new Set([
          regularItem.id,
          syncedNoteItem.id,
          regularItemNotInCollection.id,
          noteItemNotInCollection.id,
        ]),
      );
    });

    it('syncs non-empty note items that have not synced or have been modified since last sync when `syncNotes` is enabled', () => {
      const { eventManager } = setup({ syncNotes: true });

      eventManager.emit('request-sync-items', [
        regularItem,
        regularItemNotInCollection,
      ]);

      jest.runAllTimers();

      expect(mockedPerformSyncJob.mock.lastCall?.[0]).toStrictEqual(
        new Set([
          regularItem.id,
          regularItemNotInCollection.id,
          outOfSyncNoteItem.id,
          unsyncedNoteItem.id,
          noteItemNotInCollection.id,
        ]),
      );
    });
  });

  describe('receiving `collection.delete` notifier event', () => {
    it('does not perform sync when `syncOnModifyItems` is disabled', () => {
      const { eventManager } = setup({ syncOnModifyItems: false });

      eventManager.emit('notifier-event', 'collection.delete', [collection.id]);

      jest.runAllTimers();

      expect(performSyncJob).toHaveBeenCalledTimes(0);
    });

    it('does not perform sync when collection is not sync-enabled', () => {
      const { eventManager } = setup({ collectionSyncEnabled: false });

      eventManager.emit('notifier-event', 'collection.delete', [collection.id]);

      jest.runAllTimers();

      expect(performSyncJob).toHaveBeenCalledTimes(0);
    });

    it('syncs regular items in collection when `syncOnModifyItems` is enabled and collection is sync-enabled', () => {
      const { eventManager } = setup();

      eventManager.emit('notifier-event', 'collection.delete', [collection.id]);

      jest.runAllTimers();

      expect(mockedPerformSyncJob.mock.lastCall?.[0]).toStrictEqual(
        new Set([regularItem.id]),
      );
    });
  });

  describe('receiving `collection.modify` notifier event', () => {
    it('does not perform sync when `syncOnModifyItems` is disabled', () => {
      const { eventManager } = setup({ syncOnModifyItems: false });

      eventManager.emit('notifier-event', 'collection.modify', [collection.id]);

      jest.runAllTimers();

      expect(performSyncJob).toHaveBeenCalledTimes(0);
    });

    it('does not perform sync when collection is not sync-enabled', () => {
      const { eventManager } = setup({ collectionSyncEnabled: false });

      eventManager.emit('notifier-event', 'collection.modify', [collection.id]);

      jest.runAllTimers();

      expect(performSyncJob).toHaveBeenCalledTimes(0);
    });

    it('syncs regular items in collection when `syncOnModifyItems` is enabled and collection is sync-enabled', () => {
      const { eventManager } = setup();

      eventManager.emit('notifier-event', 'collection.modify', [collection.id]);

      jest.runAllTimers();

      expect(mockedPerformSyncJob.mock.lastCall?.[0]).toStrictEqual(
        new Set([regularItem.id]),
      );
    });
  });

  describe('receiving `collection-item.add` notifier event', () => {
    it('does not perform sync when item is not in sync-enabled collection', () => {
      const { eventManager } = setup();

      eventManager.emit('notifier-event', 'collection-item.add', [
        [1234, regularItemNotInCollection.id],
      ]);

      jest.runAllTimers();

      expect(performSyncJob).toHaveBeenCalledTimes(0);
    });

    it('syncs item and notes when `syncOnModifyItems` is disabled and item is in sync-enabled collection', () => {
      const { eventManager } = setup({ syncOnModifyItems: false });

      eventManager.emit('notifier-event', 'collection-item.add', [
        [collection.id, regularItem.id],
      ]);

      jest.runAllTimers();

      expect(mockedPerformSyncJob.mock.lastCall?.[0]).toStrictEqual(
        new Set([regularItem.id, outOfSyncNoteItem.id, unsyncedNoteItem.id]),
      );
    });

    it('syncs item when `syncOnModifyItems` is enabled and item is in sync-enabled collection', () => {
      const { eventManager } = setup({ syncOnModifyItems: true });

      eventManager.emit('notifier-event', 'collection-item.add', [
        [collection.id, regularItem.id],
      ]);

      jest.runAllTimers();

      expect(mockedPerformSyncJob.mock.lastCall?.[0]).toStrictEqual(
        new Set([regularItem.id, outOfSyncNoteItem.id, unsyncedNoteItem.id]),
      );
    });
  });

  describe('receiving `item.modify` notifier event', () => {
    it('does not perform sync when `syncOnModifyItems` is disabled', () => {
      const { eventManager } = setup({ syncOnModifyItems: false });

      eventManager.emit('notifier-event', 'item.modify', [regularItem.id]);

      jest.runAllTimers();

      expect(performSyncJob).toHaveBeenCalledTimes(0);
    });

    it('does not perform sync when regular item is not in sync-enabled collection', () => {
      const { eventManager } = setup();

      eventManager.emit('notifier-event', 'item.modify', [
        regularItemNotInCollection.id,
      ]);

      jest.runAllTimers();

      expect(performSyncJob).toHaveBeenCalledTimes(0);
    });

    it('does not perform sync when note item is not in sync-enabled collection', () => {
      const { eventManager } = setup();

      eventManager.emit('notifier-event', 'item.modify', [
        noteItemNotInCollection.id,
      ]);

      jest.runAllTimers();

      expect(performSyncJob).toHaveBeenCalledTimes(0);
    });

    it('does not perform sync when item is deleted', () => {
      const { eventManager } = setup();

      eventManager.emit('notifier-event', 'item.modify', [deletedItem.id]);

      jest.runAllTimers();

      expect(performSyncJob).toHaveBeenCalledTimes(0);
    });

    it('syncs item when `syncOnModifyItems` is enabled and item is in sync-enabled collection', () => {
      const { eventManager } = setup({ syncNotes: false });

      eventManager.emit('notifier-event', 'item.modify', [regularItem.id]);

      jest.runAllTimers();

      expect(mockedPerformSyncJob.mock.lastCall?.[0]).toStrictEqual(
        new Set([regularItem.id]),
      );
    });

    it('syncs note items when `syncNotes` is enabled and item is in sync-enabled collection', () => {
      const { eventManager } = setup({ syncNotes: true });

      eventManager.emit('notifier-event', 'item.modify', [regularItem.id]);

      jest.runAllTimers();

      expect(mockedPerformSyncJob.mock.lastCall?.[0]).toStrictEqual(
        new Set([regularItem.id, outOfSyncNoteItem.id, unsyncedNoteItem.id]),
      );
    });

    it('syncs note item when `syncNotes` is enabled and item is a note in sync-enabled collection', () => {
      const { eventManager } = setup({ syncNotes: true });

      eventManager.emit('notifier-event', 'item.modify', [syncedNoteItem.id]);

      jest.runAllTimers();

      expect(mockedPerformSyncJob.mock.lastCall?.[0]).toStrictEqual(
        new Set([syncedNoteItem.id]),
      );
    });
  });

  describe('receiving `item-tag.modify` notifier event', () => {
    it('does not perform sync when `syncOnModifyItems` is disabled', () => {
      const { eventManager } = setup({ syncOnModifyItems: false });

      eventManager.emit('notifier-event', 'item-tag.modify', [
        [regularItem.id, fakeTagID],
      ]);

      jest.runAllTimers();

      expect(performSyncJob).toHaveBeenCalledTimes(0);
    });

    it('does not perform sync when item is not in sync-enabled collection', () => {
      const { eventManager } = setup();

      eventManager.emit('notifier-event', 'item-tag.modify', [
        [regularItemNotInCollection.id, fakeTagID],
      ]);

      jest.runAllTimers();

      expect(performSyncJob).toHaveBeenCalledTimes(0);
    });

    it('does not perform sync when item is deleted', () => {
      const { eventManager } = setup();

      eventManager.emit('notifier-event', 'item-tag.modify', [
        [deletedItem.id, fakeTagID],
      ]);

      jest.runAllTimers();

      expect(performSyncJob).toHaveBeenCalledTimes(0);
    });

    it('syncs item when `syncOnModifyItems` is enabled and item is in sync-enabled collection', () => {
      const { eventManager } = setup();

      eventManager.emit('notifier-event', 'item-tag.modify', [
        [regularItem.id, fakeTagID],
      ]);

      jest.runAllTimers();

      expect(mockedPerformSyncJob.mock.lastCall?.[0]).toStrictEqual(
        new Set([regularItem.id]),
      );
    });
  });

  describe('receiving `item-tag.remove` notifier event', () => {
    it('does not perform sync when `syncOnModifyItems` is disabled', () => {
      const { eventManager } = setup({ syncOnModifyItems: false });

      eventManager.emit('notifier-event', 'item-tag.remove', [
        [regularItem.id, fakeTagID],
      ]);

      jest.runAllTimers();

      expect(performSyncJob).toHaveBeenCalledTimes(0);
    });

    it('does not perform sync when item is not in sync-enabled collection', () => {
      const { eventManager } = setup();

      eventManager.emit('notifier-event', 'item-tag.remove', [
        [regularItemNotInCollection.id, fakeTagID],
      ]);

      jest.runAllTimers();

      expect(performSyncJob).toHaveBeenCalledTimes(0);
    });

    it('does not perform sync when item is deleted', () => {
      const { eventManager } = setup();

      eventManager.emit('notifier-event', 'item-tag.remove', [
        [deletedItem.id, fakeTagID],
      ]);

      jest.runAllTimers();

      expect(performSyncJob).toHaveBeenCalledTimes(0);
    });

    it('syncs item when `syncOnModifyItems` is enabled and item is in sync-enabled collection', () => {
      const { eventManager } = setup();

      eventManager.emit('notifier-event', 'item-tag.remove', [
        [regularItem.id, fakeTagID],
      ]);

      jest.runAllTimers();

      expect(mockedPerformSyncJob.mock.lastCall?.[0]).toStrictEqual(
        new Set([regularItem.id]),
      );
    });
  });
});
