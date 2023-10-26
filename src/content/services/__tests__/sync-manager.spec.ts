import { JSDOM } from 'jsdom';

import {
  createZoteroCollectionMock,
  createZoteroItemMock,
  mockZoteroPrefs,
} from '../../../../test/utils/zotero-mock';
import { saveSyncConfigs } from '../../prefs/collection-sync-config';
import { NoteroPref, setNoteroPref } from '../../prefs/notero-pref';
import { performSyncJob } from '../../sync/sync-job';
import { EventManager, SyncManager } from '../index';

jest.mock('../../sync/sync-job');

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

const noteItem = createZoteroItemMock({
  deleted: false,
  isRegularItem: () => false,
  isNote: () => true,
});

const deletedItem = createZoteroItemMock({
  deleted: true,
  isRegularItem: () => true,
});

const regularItemNotInCollection = createZoteroItemMock({
  deleted: false,
  isRegularItem: () => true,
});

regularItem.addToCollection(collection.id);
deletedItem.addToCollection(collection.id);

const fakeTagID = 1234;

function createWindowMock(): Zotero.ZoteroWindow {
  const dom = new JSDOM();
  return dom.window as unknown as Zotero.ZoteroWindow;
}

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
  const window = createWindowMock();

  const dependencies = { eventManager };

  syncManager.startup({ dependencies, pluginInfo });

  syncManager.addToWindow(window);

  saveSyncConfigs({ [collection.id]: { syncEnabled: collectionSyncEnabled } });

  setNoteroPref(NoteroPref.syncNotes, syncNotes);
  setNoteroPref(NoteroPref.syncOnModifyItems, syncOnModifyItems);

  return { eventManager, syncManager, window };
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
    const { eventManager, syncManager, window } = setup();

    syncManager.removeFromWindow(window);

    eventManager.emit('request-sync-items', [regularItem]);

    jest.runAllTimers();

    expect(performSyncJob).toHaveBeenCalledTimes(0);
  });

  it('performs sync using the latest available window', async () => {
    const { eventManager, syncManager, window: window1 } = setup();

    const window2 = createWindowMock();
    const window3 = createWindowMock();
    const window4 = createWindowMock();

    syncManager.removeFromWindow(window1);
    syncManager.addToWindow(window2);
    syncManager.addToWindow(window3);
    syncManager.addToWindow(window4);
    syncManager.removeFromWindow(window3);

    eventManager.emit('request-sync-items', [regularItem]);
    await jest.runAllTimersAsync();

    expect(mockedPerformSyncJob.mock.lastCall?.[1]).toBe(window4);

    syncManager.removeFromWindow(window4);

    eventManager.emit('request-sync-items', [regularItem]);
    await jest.runAllTimersAsync();

    expect(mockedPerformSyncJob).toHaveBeenCalledTimes(2);
    expect(mockedPerformSyncJob.mock.lastCall?.[1]).toBe(window2);
  });

  describe('receiving `request-sync-collection` event', () => {
    it('syncs regular items in collection', () => {
      const { eventManager } = setup();

      eventManager.emit('request-sync-collection', collection);

      jest.runAllTimers();

      expect(mockedPerformSyncJob.mock.lastCall?.[0]).toStrictEqual(
        new Set([regularItem.id]),
      );
    });

    it('does not sync deleted items in collection', () => {
      const { eventManager } = setup();

      eventManager.emit('request-sync-collection', collection);

      jest.runAllTimers();

      expect(mockedPerformSyncJob.mock.lastCall?.[0]).not.toContain(
        deletedItem.id,
      );
    });
  });

  describe('receiving `request-sync-items` event', () => {
    it('syncs only regular items when `syncNotes` is disabled', () => {
      const { eventManager } = setup({ syncNotes: false });

      eventManager.emit('request-sync-items', [regularItem, noteItem]);

      jest.runAllTimers();

      expect(mockedPerformSyncJob.mock.lastCall?.[0]).toStrictEqual(
        new Set([regularItem.id]),
      );
    });

    it('syncs both regular and note items when `syncNotes` is enabled', () => {
      const { eventManager } = setup({ syncNotes: true });

      eventManager.emit('request-sync-items', [regularItem, noteItem]);

      jest.runAllTimers();

      expect(mockedPerformSyncJob.mock.lastCall?.[0]).toStrictEqual(
        new Set([regularItem.id, noteItem.id]),
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

  describe('receiving `item.modify` notifier event', () => {
    it('does not perform sync when `syncOnModifyItems` is disabled', () => {
      const { eventManager } = setup({ syncOnModifyItems: false });

      eventManager.emit('notifier-event', 'item.modify', [regularItem.id]);

      jest.runAllTimers();

      expect(performSyncJob).toHaveBeenCalledTimes(0);
    });

    it('does not perform sync when item is not in sync-enabled collection', () => {
      const { eventManager } = setup();

      eventManager.emit('notifier-event', 'item.modify', [
        regularItemNotInCollection.id,
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
      const { eventManager } = setup();

      eventManager.emit('notifier-event', 'item.modify', [regularItem.id]);

      jest.runAllTimers();

      expect(mockedPerformSyncJob.mock.lastCall?.[0]).toStrictEqual(
        new Set([regularItem.id]),
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
