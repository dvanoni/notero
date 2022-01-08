import NoteroItem from './notero-item';
import Notion from './notion';
import { NoteroPref } from './types';
import { hasErrorStack } from './utils';

const monkey_patch_marker = 'NoteroMonkeyPatched';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function patch(
  object: { [x: string]: { [x: string]: boolean } },
  method: string,
  patcher: (arg0: any) => any
) {
  if (object[method][monkey_patch_marker]) return;
  object[method] = patcher(object[method]);
  object[method][monkey_patch_marker] = true;
}

class Notero {
  private static get tickIcon() {
    return `chrome://zotero/skin/tick${Zotero.hiDPI ? '@2x' : ''}.png`;
  }

  private globals!: Record<string, any>;

  private progressWindow = new Zotero.ProgressWindow();

  private stringBundle = Services.strings.createBundle(
    'chrome://notero/locale/notero.properties'
  );

  // eslint-disable-next-line @typescript-eslint/require-await
  public async load(globals: Record<string, any>) {
    this.globals = globals;

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
      const syncOnModifyItems =
        this.getPref(NoteroPref.syncOnModifyItems) === true;

      if (!syncOnModifyItems && event === 'add' && type === 'collection-item') {
        return this.onAddItemsToCollection(ids);
      }
      if (syncOnModifyItems && event === 'modify' && type === 'item') {
        return this.onModifyItems(ids);
      }
    },
  };

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

  private getPref(pref: NoteroPref) {
    return Zotero.Prefs.get(`extensions.notero.${pref}`, true);
  }

  private onAddItemsToCollection(ids: string[]) {
    const collectionName = this.getPref(NoteroPref.collectionName);
    if (!collectionName) return;

    const items = ids
      .map((collectionItem: string) => {
        const [collectionID, itemID] = collectionItem.split('-').map(Number);
        return {
          collection: Zotero.Collections.get(collectionID),
          item: Zotero.Items.get(itemID),
        };
      })
      .filter(
        (
          record
        ): record is { collection: Zotero.Collection; item: Zotero.Item } =>
          record.collection &&
          record.collection.name === collectionName &&
          record.item &&
          record.item.isRegularItem()
      )
      .map(({ item }) => item);

    void this.saveItemsToNotion(items);
  }

  private onModifyItems(ids: string[]) {
    const collectionName = this.getPref(NoteroPref.collectionName);
    if (typeof collectionName !== 'string' || !collectionName) return;

    const items = Zotero.Items.get(ids.map(Number)).filter(
      (item) =>
        item.isRegularItem() &&
        Zotero.Collections.get(item.getCollections())
          .map(({ name }) => name)
          .includes(collectionName)
    );

    void this.saveItemsToNotion(items);
  }

  private getNotion() {
    const authToken = this.getPref(NoteroPref.notionToken);
    const databaseID = this.getPref(NoteroPref.notionDatabaseID);

    if (typeof authToken !== 'string' || !authToken) {
      throw new Error(
        `Missing ${this.getLocalizedString(NoteroPref.notionToken)}`
      );
    }

    if (typeof databaseID !== 'string' || !databaseID) {
      throw new Error(
        `Missing ${this.getLocalizedString(NoteroPref.notionDatabaseID)}`
      );
    }

    return new Notion(authToken, databaseID);
  }

  private async saveItemsToNotion(items: Zotero.Item[]) {
    const PERCENTAGE_MULTIPLIER = 100;

    if (!items.length) return;

    const itemsText = items.length === 1 ? 'item' : 'items';

    this.progressWindow.changeHeadline(
      `Saving ${items.length} ${itemsText} to Notion...`
    );
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
    } catch (error) {
      itemProgress.setError();
      const errorMessage = String(error);
      Zotero.log(errorMessage, 'error');
      if (hasErrorStack(error)) {
        Zotero.log(error.stack, 'error');
      }
      Zotero.alert(
        window,
        `Failed to save ${itemsText} to Notion`,
        errorMessage
      );
    } finally {
      this.progressWindow.startCloseTimer();
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

(Zotero as any).Notero = new Notero();
