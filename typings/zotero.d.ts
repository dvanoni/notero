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
    /**
     * @param ref
     * @param types a list of types of events observer should be triggered on
     * @param id an id of the observer used in debug output
     * @param priority lower numbers correspond to higher priority of observer execution
     * @returns observer id
     */
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

    /**
     * @param id observer id
     */
    unregisterObserver(id: string);
  }

  interface Prefs {
    /** Retrieve a preference */
    get(pref: string, global?: boolean): Prefs.Value;

    /**
     * @param name Preference name; if not global, this is on the extensions.zotero branch
     * @param handler
     * @param [global]
     * @return {Symbol} Symbol to pass to `unregisterObserver()`
     */
    registerObserver(
      name: string,
      handler: (value: Prefs.Value) => void,
      global?: boolean
    ): symbol;

    /**
     * @param symbol Symbol returned from `registerObserver()`
     */
    unregisterObserver(symbol: symbol): void;
  }

  namespace Prefs {
    type Value = boolean | number | string | undefined;
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

  /**
   * Show Zotero pane overlay and progress bar in all windows
   *
   * @param msg
   * @param [determinate=false]
   * @return void
   */
  showZoteroPaneProgressMeter(msg: string, determinate?: boolean): void;

  /**
   * @param	percentage Percentage complete as integer or float
   */
  updateZoteroPaneProgressMeter(percentage: number): void;

  /** Hide Zotero pane overlay in all windows */
  hideZoteroPaneOverlays(): void;
};

declare const Components: any;

declare const Services: {
  strings: {
    createBundle(name: string): {
      GetStringFromName(name: string): string;
    };
  };
};
