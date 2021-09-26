const monkey_patch_marker = 'NoteroMonkeyPatched';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function patch(object, method, patcher) {
  if (object[method][monkey_patch_marker]) return;
  object[method] = patcher(object[method]);
  object[method][monkey_patch_marker] = true;
}

class Notero {
  // tslint:disable-line:variable-name
  private initialized = false;
  private globals: Record<string, any>;
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

      ids.forEach((collectionItem: string) => {
        const [collectionID, itemID] = collectionItem.split('-');
        const collection = Zotero.Collections.get(collectionID);

        if (collection.name === collectionName) {
          this.onItemAddedToCollection(itemID);
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

    // Unregister callback when the window closes
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

  private getPref(pref): unknown {
    return Zotero.Prefs.get(`extensions.notero.${pref}`, true);
  }

  private onItemAddedToCollection(itemID: string) {
    window.alert(`added ${itemID}`);

    const item = Zotero.Items.get(itemID);

    Zotero.debug(`Item URI: zotero://select/library/items/${item.key}`);
  }
}

Zotero.Notero = new Notero();
