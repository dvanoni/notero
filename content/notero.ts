import {
  loadSyncConfigs,
  loadSyncEnabledCollectionIDs,
  saveSyncConfigs,
} from './collection-sync-config';
import NoteroItem from './notero-item';
import { clearNoteroPref, getNoteroPref, NoteroPref } from './notero-pref';
import Notion from './notion';
import { hasErrorStack } from './utils';

const monkey_patch_marker = 'NoteroMonkeyPatched';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function patch(
  object: { [x: string]: { [x: string]: boolean } },
  method: string,
  patcher: (arg0: unknown) => never
) {
  if (object[method][monkey_patch_marker]) return;
  object[method] = patcher(object[method]);
  object[method][monkey_patch_marker] = true;
}

const SYNC_DEBOUNCE_MS = 2000;

type QueuedSync = {
  readonly itemIDs: Set<Zotero.Item['id']>;
  timeoutID?: ReturnType<typeof setTimeout>;
};

class Notero {
  private static get tickIcon() {
    return `chrome://zotero/skin/tick${Zotero.hiDPI ? '@2x' : ''}.png`;
  }

  private globals!: Record<string, unknown>;

  private readonly progressWindow = new Zotero.ProgressWindow();

  private queuedSync?: QueuedSync;

  private readonly stringBundle = Services.strings.createBundle(
    'chrome://notero/locale/notero.properties'
  );

  private syncInProgress = false;

  public async load(globals: Record<string, unknown>) {
    this.globals = globals;

    await this.migratePreferences();

    const notifierID = Zotero.Notifier.registerObserver(
      this.notifierCallback,
      ['collection-item', 'item'],
      'notero'
    );

    window.addEventListener(
      'unload',
      () => {
        Zotero.Notifier.unregisterObserver(notifierID);
      },
      false
    );
  }

  private notifierCallback = {
    notify: (
      event: string,
      type: string,
      ids: string[],
      _: Record<string, unknown>
    ) => {
      const syncOnModifyItems = getNoteroPref(NoteroPref.syncOnModifyItems);

      if (!syncOnModifyItems && event === 'add' && type === 'collection-item') {
        return this.onAddItemsToCollection(ids);
      }
      if (syncOnModifyItems && event === 'modify' && type === 'item') {
        return this.onModifyItems(ids);
      }
    },
  };

  private async migratePreferences() {
    const syncConfigs = loadSyncConfigs();
    if (Object.keys(syncConfigs).length) return;

    await Zotero.uiReadyPromise;

    const collectionName = getNoteroPref(NoteroPref.collectionName);
    if (!collectionName) return;
    const collection = Zotero.Collections.getLoaded().find(
      ({ name }) => name === collectionName
    );
    if (!collection) return;

    saveSyncConfigs({ [collection.id]: { syncEnabled: true } });
    clearNoteroPref(NoteroPref.collectionName);
    Zotero.log(`Migrated Notero preferences for collection: ${collectionName}`);
  }

  public openPreferences() {
    window.openDialog(
      'chrome://notero/content/preferences.xul',
      'notero-preferences'
    );
  }

  private getLocalizedString(name: NoteroPref | string): string {
    const fullName = name in NoteroPref ? `notero.preferences.${name}` : name;
    return this.stringBundle.GetStringFromName(fullName);
  }

  private onAddItemsToCollection(ids: string[]) {
    const collectionIDs = loadSyncEnabledCollectionIDs();
    if (!collectionIDs.size) return;

    const items = ids
      .map((collectionItem: string) => {
        const [collectionID, itemID] = collectionItem.split('-').map(Number);
        return {
          collectionID,
          item: Zotero.Items.get(itemID),
        };
      })
      .filter(
        (
          record
        ): record is {
          collectionID: Zotero.Collection['id'];
          item: Zotero.Item;
        } =>
          record.item &&
          record.item.isRegularItem() &&
          collectionIDs.has(record.collectionID)
      )
      .map(({ item }) => item);

    this.enqueueItemsToSync(items);
  }

  private onModifyItems(ids: string[]) {
    const collectionIDs = loadSyncEnabledCollectionIDs();
    if (!collectionIDs.size) return;

    const items = Zotero.Items.get(ids.map(Number)).filter(
      (item) =>
        !item.deleted &&
        item.isRegularItem() &&
        item
          .getCollections()
          .some((collectionID) => collectionIDs.has(collectionID))
    );

    this.enqueueItemsToSync(items);
  }

  private getNotion() {
    const authToken = getNoteroPref(NoteroPref.notionToken);
    const databaseID = getNoteroPref(NoteroPref.notionDatabaseID);

    if (!authToken) {
      throw new Error(
        `Missing ${this.getLocalizedString(NoteroPref.notionToken)}`
      );
    }

    if (!databaseID) {
      throw new Error(
        `Missing ${this.getLocalizedString(NoteroPref.notionDatabaseID)}`
      );
    }

    return new Notion(authToken, databaseID);
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
  private enqueueItemsToSync(items: Zotero.Item[]) {
    if (!items.length) return;

    if (this.queuedSync?.timeoutID) {
      clearTimeout(this.queuedSync.timeoutID);
    }

    const itemIDs = new Set([
      ...(this.queuedSync?.itemIDs?.values() ?? []),
      ...items.map(({ id }) => id),
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
    if (!this.queuedSync) return;

    const { itemIDs } = this.queuedSync;
    this.queuedSync = undefined as QueuedSync | undefined;
    this.syncInProgress = true;

    await this.saveItemsToNotion(itemIDs);

    if (this.queuedSync && !this.queuedSync.timeoutID) {
      await this.performSync();
    }

    this.syncInProgress = false;
  }

  private async saveItemsToNotion(itemIDs: Set<Zotero.Item['id']>) {
    const PERCENTAGE_MULTIPLIER = 100;

    const items = Zotero.Items.get(Array.from(itemIDs));
    if (!items.length) return;

    this.progressWindow.changeHeadline('Saving items to Notion...');
    this.progressWindow.show();
    const itemProgress = new this.progressWindow.ItemProgress(
      'chrome://notero/skin/notion-logo-32.png',
      ''
    );

    try {
      const notion = this.getNotion();
      let step = 0;

      for (const item of items) {
        step++;
        itemProgress.setText(`Item ${step} of ${items.length}`);
        await this.saveItemToNotion(item, notion);
        itemProgress.setProgress((step / items.length) * PERCENTAGE_MULTIPLIER);
      }
      itemProgress.setIcon(Notero.tickIcon);
      this.progressWindow.startCloseTimer();
    } catch (error) {
      const errorMessage = String(error);
      Zotero.log(errorMessage, 'error');
      if (hasErrorStack(error)) {
        Zotero.log(error.stack, 'error');
      }
      itemProgress.setError();
      this.progressWindow.addDescription(errorMessage);
    }
  }

  private async saveItemToNotion(item: Zotero.Item, notion: Notion) {
    const noteroItem = new NoteroItem(item);
    const response = await notion.saveItemToDatabase(noteroItem);

    await noteroItem.saveNotionTag();

    if ('url' in response) {
      await noteroItem.saveNotionLinkAttachment(response.url);
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
(Zotero as any).Notero = new Notero();
