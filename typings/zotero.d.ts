declare namespace Zotero {
  interface Collection extends DataObject {
    name: string;
  }

  interface Collections extends DataObjects<Collection> {}

  interface DataObject {
    id: number;
    key: string;
    /**
     * Save changes to database.
     * @return Promise for itemID of new item, TRUE on item update, or FALSE if item was unchanged
     */
    saveTx(options?: DataObject.SaveOptions): Promise<boolean | number>;
  }

  namespace DataObject {
    type SaveOptions = {
      /** Don't save add new object to the cache; if set, object is disabled after save */
      skipCache: boolean;
      skipDateModifiedUpdate: boolean;
      skipClientDateModifiedUpdate: boolean;
      /** Don't trigger Zotero.Notifier events */
      skipNotifier: boolean;
      /** Don't select object automatically in trees */
      skipSelect: boolean;
      /** Don't automatically set 'synced' to false */
      skipSyncedUpdate: boolean;
    };
  }

  interface DataObjects<T extends DataObject> {
    get<I = number | number[]>(ids: I): I extends number ? T | undefined : T[];
  }

  interface Item extends DataObject {
    itemTypeID: number;
    itemType: string;
    /**
     * Add a single tag to the item. If type is 1 and an automatic tag with the
     * same name already exists, replace it with a manual one.
     *
     * A separate save() is required to update the database.
     *
     * @return True if the tag was added; false if the item already had the tag
     */
    addTag(name: string, type?: number): boolean;
    getCreators(): { firstName: string; lastName: string }[];
    getDisplayTitle(includeAuthorAndDate?: boolean): string;
    getField(
      field: number | string,
      unformatted?: boolean,
      includeBaseMapped?: boolean
    ): string | undefined;
    isRegularItem(): boolean;
  }

  interface Items extends DataObjects<Item> {}

  interface ItemTypes {
    getLocalizedString(idOrName: number | string): string;
  }

  interface Notifier {
    registerObserver(
      ref: {
        notify(
          event: string,
          type: string,
          ids: (number | string)[],
          extraData: Record<string, unknown>
        );
      },
      types?: string[],
      id?: string,
      priority?: number
    ): string;
    unregisterObserver(id: string);
  }

  interface Prefs {
    get(pref: string, global: boolean): boolean | number | string | undefined;
  }

  interface URI {
    getItemURI(item: Item): string;
  }
}

declare const Zotero: {
  Collections: Zotero.Collections;
  Items: Zotero.Items;
  ItemTypes: Zotero.ItemTypes;
  Notifier: Zotero.Notifier;
  Prefs: Zotero.Prefs;
  URI: Zotero.URI;
  /** Display an alert in a given window */
  alert(window: Window, title: string, msg: string): void;
  /** Debug logging function */
  debug(message: string): void;
  /** Log a message to the Mozilla JS error console */
  log(
    message: string,
    type: 'error' | 'warning' | 'exception' | 'strict'
  ): void;
};

// declare const Components: any
