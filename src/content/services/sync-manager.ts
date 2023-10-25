import { loadSyncEnabledCollectionIDs } from '../prefs/collection-sync-config';
import { getNoteroPref, NoteroPref } from '../prefs/notero-pref';
import { performSyncJob } from '../sync/sync-job';
import { getAllCollectionItems, log } from '../utils';

import type { EventManager, NotifierEventParams } from './event-manager';
import type { Service, ServiceParams } from './service';

const SYNC_DEBOUNCE_MS = 2000;

type QueuedSync = {
  readonly itemIDs: Set<Zotero.Item['id']>;
  timeoutID?: ReturnType<typeof setTimeout>;
};

export class SyncManager implements Service {
  private eventManager!: EventManager;

  private queuedSync?: QueuedSync;

  private syncInProgress = false;

  private readonly windows: Zotero.ZoteroWindow[] = [];

  public startup({ dependencies: { eventManager } }: ServiceParams) {
    this.eventManager = eventManager;

    const { addListener } = eventManager;

    addListener('notifier-event', this.handleNotifierEvent);
    addListener('request-sync-collection', this.handleSyncCollection);
    addListener('request-sync-items', this.handleSyncItems);
  }

  public shutdown() {
    const { removeListener } = this.eventManager;

    removeListener('notifier-event', this.handleNotifierEvent);
    removeListener('request-sync-collection', this.handleSyncCollection);
    removeListener('request-sync-items', this.handleSyncItems);
  }

  public addToWindow(window: Zotero.ZoteroWindow) {
    if (!this.windows.includes(window)) {
      this.windows.unshift(window);
    }
  }

  public removeFromWindow(window: Zotero.ZoteroWindow) {
    const index = this.windows.indexOf(window);
    if (index >= 0) {
      this.windows.splice(index, 1);
    }
  }

  private get latestWindow(): Zotero.ZoteroWindow | undefined {
    return this.windows[0];
  }

  private handleNotifierEvent = (...params: NotifierEventParams) => {
    const items = this.getItemsForNotifierEvent(...params);
    if (!items.length) return;

    const collectionIDs = loadSyncEnabledCollectionIDs();
    if (!collectionIDs.size) return;

    const validItems = items.filter(
      (item) =>
        !item.deleted &&
        item.isRegularItem() &&
        item
          .getCollections()
          .some((collectionID) => collectionIDs.has(collectionID)),
    );

    this.enqueueItemsToSync(validItems);
  };

  private handleSyncCollection = (collection: Zotero.Collection) => {
    const validItems = collection
      .getChildItems(false)
      .filter((item) => !item.deleted && item.isRegularItem());

    this.enqueueItemsToSync(validItems);
  };

  private handleSyncItems = (items: Zotero.Item[]) => {
    if (!items.length) return;

    const syncNotes = getNoteroPref(NoteroPref.syncNotes);

    const validItems = items.filter(
      (item) =>
        !item.deleted && (item.isRegularItem() || (syncNotes && item.isNote())),
    );

    this.enqueueItemsToSync(validItems);
  };

  /**
   * Return the Zotero items (if any) that should be synced for the given
   * notifier event.
   * @returns An array of Zotero items.
   */
  private getItemsForNotifierEvent(
    ...[event, ids]: NotifierEventParams
  ): Zotero.Item[] {
    const syncOnModifyItems = getNoteroPref(NoteroPref.syncOnModifyItems);

    if (!syncOnModifyItems) {
      if (event === 'collection-item.add') {
        return Zotero.Items.get(this.getIndexedIDs(1, ids));
      }
      return [];
    }

    switch (event) {
      case 'collection.delete':
      case 'collection.modify':
        return this.getItemsFromCollectionIDs(ids);
      case 'item.modify':
        return Zotero.Items.get(ids);
      case 'item-tag.modify':
      case 'item-tag.remove':
        return Zotero.Items.get(this.getIndexedIDs(0, ids));
      default:
        return [];
    }
  }

  /**
   * Extract IDs from compound IDs (e.g. `'${id0}-${id1}'`) at the given index.
   * @param index The index of the IDs to extract from compound IDs.
   * @param ids An array of compound IDs.
   * @returns An array of extracted IDs.
   */
  private getIndexedIDs(this: void, index: 0 | 1, ids: [number, number][]) {
    return ids.map((compoundID) => compoundID[index]);
  }

  private getItemsFromCollectionIDs(this: void, ids: number[]) {
    const items = Zotero.Collections.get(ids).reduce(
      (items: Zotero.Item[], collection) =>
        items.concat(getAllCollectionItems(collection)),
      [],
    );

    // Deduplicate items in multiple collections
    return Array.from(new Set(items));
  }

  /**
   * Enqueue Zotero items to sync to Notion.
   *
   * Because Zotero items can be updated multiple times in short succession,
   * any subsequent updates after the first can sometimes occur before the
   * initial sync has finished and added the Notion link attachment. This has
   * the potential to end up creating duplicate Notion pages.
   *
   * To address this, we use two strategies:
   * - Debounce syncs so that they occur, at most, every `SYNC_DEBOUNCE_MS` ms
   * - Prevent another sync from starting until the previous one has finished
   *
   * The algorithm works as follows:
   * 1. When enqueueing items, check if there is an existing sync queued
   *    - If not, create one with a set of the item IDs to sync and a timeout
   *      of `SYNC_DEBOUNCE_MS`
   *    - If so, add the item IDs to the existing set and restart the timeout
   * 2. When a timeout ends, check if there is a sync in progress
   *    - If not, perform the sync
   *    - If so, delete the timeout ID (to indicate it has expired)
   * 3. When a sync ends, check if there is another sync queued
   *    - If there is one with an expired timeout, perform the sync
   *    - If there is one with a remaining timeout, let it run when it times out
   *    - Otherwise, do nothing
   *
   * @param items the Zotero items to sync to Notion
   */
  private enqueueItemsToSync(items: readonly Zotero.Item[]) {
    if (!items.length) return;

    const idsToSync = items.map(({ id }) => id);

    log(
      `Enqueue ${idsToSync.length} item(s) to sync with IDs ${JSON.stringify(
        idsToSync,
      )}`,
    );

    if (this.queuedSync?.timeoutID) {
      clearTimeout(this.queuedSync.timeoutID);
    }

    const itemIDs = new Set([
      ...(this.queuedSync?.itemIDs.values() ?? []),
      ...idsToSync,
    ]);

    const timeoutID = setTimeout(() => {
      if (!this.queuedSync) return;

      this.queuedSync.timeoutID = undefined;
      if (!this.syncInProgress) {
        void this.performSync();
      }
    }, SYNC_DEBOUNCE_MS);

    this.queuedSync = { itemIDs, timeoutID };
  }

  private async performSync() {
    if (!this.queuedSync || !this.latestWindow) return;

    const { itemIDs } = this.queuedSync;
    this.queuedSync = undefined as QueuedSync | undefined;
    this.syncInProgress = true;

    await performSyncJob(itemIDs, this.latestWindow);

    if (this.queuedSync && !this.queuedSync.timeoutID) {
      await this.performSync();
    }

    this.syncInProgress = false;
  }
}
