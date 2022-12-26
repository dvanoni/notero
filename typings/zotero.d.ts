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
    }): Promise<Item>;
  }

  interface CachedTypes {
    getName(idOrName: number | string): string;
  }

  interface Collection extends DataObject {
    name: string;
    parentID: DataObjectID;
    parentKey: DataObjectKey;
  }

  type Collections = DataObjects<Collection>;

  interface Creator {
    firstName: string;
    lastName: string;
    fieldMode: number;
    creatorTypeID: number;
  }

  interface CreatorTypes extends CachedTypes {
    getPrimaryIDForType(itemTypeID: number): number | false;
  }

  type DataObjectID = number;
  type DataObjectKey = string;

  interface DataObject {
    id: DataObjectID;
    key: DataObjectKey;
    deleted: boolean;

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

    /** Get all loaded objects */
    getLoaded(): T[];
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

    getBestAttachment(): Promise<Item | false>;

    getCollections(): DataObjectID[];

    getCreators(): Creator[];

    getDisplayTitle(includeAuthorAndDate?: boolean): string;

    getField(
      field: number | string,
      unformatted?: boolean,
      includeBaseMapped?: boolean
    ): string | undefined;

    getFilePathAsync(): Promise<string | false>;

    getTags(): { tag: string; type: number }[];

    isRegularItem(): boolean;

    setField(field: number | string, value: unknown, loadIn?: boolean): boolean;

    setNote(text: string): boolean;
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
          type: Notifier.Type,
          ids: (number | string)[],
          extraData: Record<string, unknown>
        ): void;
      },
      types?: Notifier.Type[],
      id?: string,
      priority?: number
    ): string;

    /**
     * @param id observer id
     */
    unregisterObserver(id: string): void;
  }

  namespace Notifier {
    type Type =
      | 'api-key'
      | 'bucket'
      | 'collection'
      | 'collection-item'
      | 'feed'
      | 'feedItem'
      | 'file'
      | 'group'
      | 'item'
      | 'item-tag'
      | 'relation'
      | 'search'
      | 'setting'
      | 'share'
      | 'share-items'
      | 'sync'
      | 'tab'
      | 'tag'
      | 'trash';
  }

  namespace Plugins {
    type REASONS = {
      APP_STARTUP: 1;
      APP_SHUTDOWN: 2;
      ADDON_ENABLE: 3;
      ADDON_DISABLE: 4;
      ADDON_INSTALL: 5;
      ADDON_UNINSTALL: 6;
      ADDON_UPGRADE: 7;
      ADDON_DOWNGRADE: 8;
    };
  }

  interface Prefs {
    /** Clear a preference */
    clear(pref: string, global?: boolean): void;

    /** Retrieve a preference */
    get(pref: string, global?: boolean): Prefs.Value;

    /** Set a preference */
    set(pref: string, value: Prefs.Value, global?: boolean): void;

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

  type ProgressWindow = {
    new (options?: { closeOnClick?: boolean; window?: Window }): ProgressWindow;

    addDescription(text: string): void;

    addLines(
      labels: string | Record<string, string>,
      icons: string | Record<string, string>
    ): void;

    changeHeadline(text: string, icon?: string, postText?: string): void;

    show(): boolean;

    startCloseTimer(ms?: number, requireMouseOver?: boolean): void;

    ItemProgress: ProgressWindow.ItemProgress;
  };

  namespace ProgressWindow {
    type ItemProgress = {
      new (
        iconSrc: string,
        text: string,
        parentItemProgress?: ItemProgress
      ): ItemProgress;

      setError(): void;

      setIcon(iconSrc: string): void;

      setProgress(percent: number): void;

      setText(text: string): void;
    };
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
    document: Document;
    loadURI(uris: string | string[]): void;
  }
}

declare interface Zotero {
  Attachments: Zotero.Attachments;
  CreatorTypes: Zotero.CreatorTypes;
  Collections: Zotero.Collections;
  Items: Zotero.Items;
  ItemTypes: Zotero.ItemTypes;
  Notifier: Zotero.Notifier;
  Prefs: Zotero.Prefs;
  ProgressWindow: Zotero.ProgressWindow;
  QuickCopy: Zotero.QuickCopy;
  URI: Zotero.URI;

  /** Display an alert in a given window */
  alert(window: Window, title: string, msg: string): void;

  /** Debug logging function */
  debug(message: string): void;

  /** Log a message to the Mozilla JS error console */
  log(
    message: string,
    type?: 'error' | 'warning' | 'exception' | 'strict'
  ): void;

  getActiveZoteroPane(): Zotero.ZoteroPane | null;

  getMainWindow(): ReturnType<XPCOM.nsIWindowMediator['getMostRecentWindow']>;

  hiDPI: boolean;
  hiDPISuffix: '@2x' | '';

  initializationPromise: Promise<void>;

  launchURL(url: string): void;

  platformMajorVersion: number;

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

  uiReadyPromise: Promise<void>;

  /**
   * @see https://groups.google.com/g/zotero-dev/c/O1TGIpfAdT0/m/Z7S8ONANAgAJ
   */
  setTimeout(func: () => unknown, ms: number): number;
  clearTimeout(id: ReturnType<this['setTimeout']>): void;
}

declare const Zotero: Zotero;

/**
 * Bootstrap data provided by Zotero
 * @see https://www.zotero.org/support/dev/zotero_7_for_developers#xul_overlays_bootstrapjs
 * @see http://www.devdoc.net/web/developer.mozilla.org/en-US/docs/Mozilla/Add-ons/Bootstrapped_Extensions.html#Bootstrap_data
 */
declare type BootstrapData = {
  id: string;
  version: string;
  resourceURI: XPCOM.nsIURI;
  rootURI?: string;
};
