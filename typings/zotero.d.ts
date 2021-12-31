/* eslint-disable id-blacklist */

declare namespace Zotero {
  interface Attachments {
    /**
     * Create a link attachment from a URL.
     *
     * @param options.saveOptions Options to pass to Zotero.Item::save()
     * @return A promise for the created attachment item
     */
    linkFromURL(options: {
      url: string;
      parentItemID: DataObjectID;
      contentType?: string;
      title?: string;
      collections?: (DataObjectID | DataObjectKey)[];
      saveOptions?: DataObject.SaveOptions;
    }): Promise<Zotero.Item>;
  }

  interface Creator {
    firstName: string;
    lastName: string;
    fieldMode: number;
    creatorTypeID: number;
  }

  interface Collection extends DataObject {
    name: string;
  }

  type Collections = DataObjects<Collection>;

  type DataObjectID = number;
  type DataObjectKey = string;

  interface DataObject {
    id: DataObjectID;
    key: DataObjectKey;

    /**
     * Delete object from database.
     */
    eraseTx(options?: DataObject.EraseOptions): Promise<void>;

    /**
     * Save changes to database.
     * @return Promise for itemID of new item, TRUE on item update, or FALSE if item was unchanged
     */
    saveTx(options?: DataObject.SaveOptions): Promise<boolean | DataObjectID>;
  }

  namespace DataObject {
    type EraseOptions = {
      /** Move descendant items to trash (Collection only) */
      deleteItems?: boolean;
      /** Don't add to sync delete log */
      skipDeleteLog?: boolean;
    };

    type SaveOptions = {
      /** Don't save add new object to the cache; if set, object is disabled after save */
      skipCache?: boolean;
      skipDateModifiedUpdate?: boolean;
      skipClientDateModifiedUpdate?: boolean;
      /** Don't trigger Zotero.Notifier events */
      skipNotifier?: boolean;
      /** Don't select object automatically in trees */
      skipSelect?: boolean;
      /** Don't automatically set 'synced' to false */
      skipSyncedUpdate?: boolean;
    };
  }

  interface DataObjects<T extends DataObject> {
    /**
     * Delete one or more objects from the database and caches.
     */
    erase(
      ids: DataObjectID | DataObjectID[],
      options?: DataObject.EraseOptions
    ): Promise<void>;

    /**
     * Retrieves one or more already-loaded items.
     * If an item hasn't been loaded, an error is thrown.
     *
     * @return A Zotero.DataObject, if a scalar id was passed;
     *         otherwise, an array of Zotero.DataObject
     */
    get<I extends DataObjectID | DataObjectID[]>(
      ids: I
    ): I extends DataObjectID ? T | false : T[];
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

    getAttachments(includeTrashed: boolean): DataObjectID[];

    getCollections(): DataObjectID[];

    getCreators(): Creator[];

    getDisplayTitle(includeAuthorAndDate?: boolean): string;

    getField(
      field: number | string,
      unformatted?: boolean,
      includeBaseMapped?: boolean
    ): string | undefined;

    getTags(): { tag: string; type: number }[];

    isRegularItem(): boolean;

    setField(field: number | string, value: any, loadIn?: boolean): boolean;
  }

  type Items = DataObjects<Item>;

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
        ): void;
      },
      types?: string[],
      id?: string,
      priority?: number
    ): string;

    /**
     * @param id observer id
     */
    unregisterObserver(id: string): void;
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

  interface QuickCopy {
    /**
     * Get text and (when applicable) HTML content from items
     *
     * @param items an array of Zotero.Item objects
     *
     * @param format may be a Quick Copy format string
     * (e.g. "bibliography=http://www.zotero.org/styles/apa")
     * or a Quick Copy format object
     *
     * @param callback is only necessary if using an export format and should be
     * a function suitable for Zotero.Translate.setHandler, taking parameters
     * `obj` and `worked`. The generated content should be placed in `obj.string`
     * and `worked` should be true if the operation is successful.
     *
     * @param modified if true, copy citations instead of bibliographies
     *
     * @return If bibliography format, the process is synchronous and an object
     * containing properties `text` and `html` is returned.
     * If export format, the process is asynchronous and `true` is returned.
     * If length of `items` exceeds `export.quickCopy.dragLimit` preference,
     * `false` is returned.
     */
    getContentFromItems(
      items: [Item],
      format: string | QuickCopy.Format,
      callback?: (obj: { string: string }, worked: boolean) => void,
      modified?: boolean
    ): boolean | { html: string; text: string };
  }

  namespace QuickCopy {
    type Format = {
      /** "bibliography" (for styles) or "export" (for export translators) */
      mode: string;
      /** "" (plain text output) or "html" (HTML output; for styles only) */
      contentType: string;
      /** style ID or export translator ID */
      id: string;
      /** locale code (for styles only) */
      locale: string;
    };
  }

  interface URI {
    getItemURI(item: Item): string;
  }

  interface ZoteroPane {
    loadURI(uris: string | string[]): void;
  }
}

// eslint-disable-next-line no-redeclare
declare const Zotero: {
  Attachments: Zotero.Attachments;
  Collections: Zotero.Collections;
  Items: Zotero.Items;
  ItemTypes: Zotero.ItemTypes;
  Notifier: Zotero.Notifier;
  Prefs: Zotero.Prefs;
  QuickCopy: Zotero.QuickCopy;
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

  getActiveZoteroPane(): Zotero.ZoteroPane | null;

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
