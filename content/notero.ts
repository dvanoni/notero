import { NoteroItem, NoteroPref } from './types';
import Notion from './notion';

const monkey_patch_marker = 'NoteroMonkeyPatched';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function patch(object, method, patcher) {
  if (object[method][monkey_patch_marker]) return;
  object[method] = patcher(object[method]);
  object[method][monkey_patch_marker] = true;
}

class Notero {
  private initialized = false;
  private globals!: Record<string, any>;
  private strings: any;
  private notion?: Notion;

  // eslint-disable-next-line @typescript-eslint/require-await
  public async load(globals: Record<string, any>) {
    this.globals = globals;

    if (this.initialized) return;
    this.initialized = true;

    this.strings = globals.document.getElementById('notero-strings');

    const notifierID = Zotero.Notifier.registerObserver(
      this.notifierCallback,
      ['collection-item'],
      'notero'
    );

    window.addEventListener(
      'unload',
      () => {
        Zotero.Notifier.unregisterObserver(notifierID);
      },
      false
    );

    const notionToken = this.getPref(NoteroPref.notionToken);
    const databaseID = this.getPref(NoteroPref.notionDatabaseID);

    if (typeof notionToken !== 'string' || typeof databaseID !== 'string') {
      return;
    }

    this.notion = new Notion(notionToken, databaseID);
  }

  private notifierCallback = {
    notify: (
      event: string,
      type: string,
      ids: string[],
      _: Record<string, unknown>
    ) => {
      if (event !== 'add' || type !== 'collection-item') return;

      const collectionName = this.getPref(NoteroPref.collectionName);
      if (!collectionName) return;

      const itemIDs = ids
        .map((collectionItem: string) => {
          const [collectionID, itemID] = collectionItem.split('-').map(Number);
          return { collectionID, itemID };
        })
        .filter(({ collectionID }) => {
          const collection = Zotero.Collections.get(collectionID);
          return collection?.name === collectionName;
        })
        .map(({ itemID }) => itemID);

      this.onAddItemsToCollection(itemIDs);
    },
  };

  public openPreferences() {
    window.openDialog(
      'chrome://notero/content/preferences.xul',
      'notero-preferences'
    );
  }

  private getPref(pref: NoteroPref) {
    return Zotero.Prefs.get(`extensions.notero.${pref}`, true);
  }

  private onAddItemsToCollection(itemIDs: number[]) {
    const items = Zotero.Items.get(itemIDs).filter(item =>
      item.isRegularItem()
    );

    void this.saveItemsToNotion(items);
  }

  private getNoteroItem(item: Zotero.Item): NoteroItem {
    const authors = item
      .getCreators()
      .map(({ firstName, lastName }) => `${lastName}, ${firstName}`);
    const year = Number.parseInt(item.getField('year') || '');

    return {
      authors,
      doi: item.getField('DOI') || null,
      itemType: Zotero.ItemTypes.getLocalizedString(item.itemTypeID),
      title: item.getDisplayTitle(),
      url: item.getField('url') || null,
      year: Number.isNaN(year) ? null : year,
      zoteroURI: Zotero.URI.getItemURI(item),
    };
  }

  private async saveItemsToNotion(items: Zotero.Item[]) {
    try {
      if (!this.notion) {
        throw new Error('Notion client not initialized');
      }
      for (const item of items) {
        await this.notion.addItemToDatabase(this.getNoteroItem(item));
        item.addTag('notero');
        await item.saveTx();
      }
    } catch (error) {
      Zotero.alert(window, 'Failed to save item(s) to Notion', String(error));
    }
  }
}

(Zotero as any).Notero = new Notero();
