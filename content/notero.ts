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

  private notifierCallback = {
    notify: (
      event: string,
      type: string,
      ids: string[],
      _: Record<string, unknown>
    ) => {
      if (event !== 'add' || type !== 'collection-item') return;

      const collectionName = this.getPref('collectionName');
      if (!collectionName) return;

      ids.forEach((collectionItem: string) => {
        const [collectionID, itemID] = collectionItem.split('-').map(Number);
        const collection = Zotero.Collections.get(collectionID);

        if (collection?.name === collectionName) {
          this.onAddItemToCollection(itemID);
        }
      });
    },
  };

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
  }

  public openPreferences() {
    window.openDialog(
      'chrome://notero/content/preferences.xul',
      'notero-preferences'
    );
  }

  private getPref(pref: string) {
    return Zotero.Prefs.get(`extensions.notero.${pref}`, true);
  }

  private onAddItemToCollection(itemID: number) {
    const item = Zotero.Items.get(itemID);

    if (!item || !item.isRegularItem()) return;

    Zotero.log(JSON.stringify(this.getItemFields(item)));
  }

  private getItemFields(item: Zotero.Item) {
    return {
      doi: item.getField('DOI'),
      itemType: Zotero.ItemTypes.getLocalizedString(item.itemTypeID),
      itemURI: `zotero://select/library/items/${item.key}`,
      title: item.getDisplayTitle(),
      url: item.getField('url'),
      year: item.getField('year'),
    };
  }
}

(Zotero as any).Notero = new Notero();
