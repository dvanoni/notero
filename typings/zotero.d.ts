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
      parentItemID: number;
      contentType?: string;
      title?: string;
      collections?: (number | string)[];
      saveOptions?: DataObject.SaveOptions;
    }): Promise<Zotero.Item>;
  }

  interface Collection extends DataObject {
    name: string;
  }

  type Collections = DataObjects<Collection>;

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
