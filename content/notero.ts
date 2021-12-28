import { NoteroPref } from './types';
import NoteroItem from './notero-item';
import Notion from './notion';
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
  private globals!: Record<string, any>;

  private stringBundle = Services.strings.createBundle(
    'chrome://notero/locale/notero.properties'
  );

  // eslint-disable-next-line @typescript-eslint/require-await
  public async load(globals: Record<string, any>) {
    this.globals = globals;

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

  private getLocalizedString(name: NoteroPref | string): string {
    const fullName = name in NoteroPref ? `notero.preferences.${name}` : name;
    return this.stringBundle.GetStringFromName(fullName);
  }

  private getPref(pref: NoteroPref) {
    return Zotero.Prefs.get(`extensions.notero.${pref}`, true);
  }

  private onAddItemsToCollection(itemIDs: number[]) {
    const items = Zotero.Items.get(itemIDs).filter((item) =>
      item.isRegularItem()
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

    try {
      const notion = this.getNotion();

      const itemsText = items.length === 1 ? 'item' : 'items';
      Zotero.showZoteroPaneProgressMeter(
        `Saving ${items.length} ${itemsText} to Notion...`
      );

      let step = 0;

      for (const item of items) {
        await this.saveItemToNotion(item, notion);

        Zotero.updateZoteroPaneProgressMeter(
          (++step / items.length) * PERCENTAGE_MULTIPLIER
        );
      }
    } catch (error) {
      const errorMessage = String(error);
      Zotero.log(errorMessage, 'error');
      if (hasErrorStack(error)) {
        Zotero.log(error.stack, 'error');
      }
      Zotero.alert(window, 'Failed to save item(s) to Notion', errorMessage);
    } finally {
      Zotero.hideZoteroPaneOverlays();
    }
  }

  private async saveItemToNotion(item: Zotero.Item, notion: Notion) {
    const noteroItem = new NoteroItem(item);
    const response = await notion.addItemToDatabase(noteroItem);

    item.addTag('notion');
    await item.saveTx();

    await noteroItem.saveNotionLinkAttachment(response.url);
  }
}

(Zotero as any).Notero = new Notero();
