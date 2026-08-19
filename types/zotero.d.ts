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
    getID(idOrName: number | string): number | false;
    getName(idOrName: number | string): string;
  }

  interface Collection extends DataObject {
    name: string;

    /**
     * Returns sub-collections of this collection
     *
     * @param asIDs Return as collectionIDs
     * @return Array of Zotero.Collection instances or collectionIDs
     */
    getChildCollections<A extends boolean>(
      asIDs: A,
    ): A extends true ? DataObjectID[] : Collection[];

    /**
     * Returns child items of this collection
     *
     * @param	asIDs Return as itemIDs
     * @param	includeDeleted	Include items in Trash (default false)
     * @return Array of Zotero.Item instances or itemIDs
     */
    getChildItems<A extends boolean>(
      asIDs: A,
      includeDeleted?: boolean,
    ): A extends true ? DataObjectID[] : Item[];
  }

  type Collections = DataObjects<Collection>;

  /**
   * Represents a single row in the collection tree (left-hand pane).
   * A row may be a library, collection, saved search, or similar.
   */
  interface CollectionTreeRow<R extends object = object> {
    /** The row type (e.g. `"library"`, `"collection"`, `"search"`). */
    type: string;
    /** The underlying data object for this row. */
    ref: R;

    isLibrary(includeGlobal?: boolean): boolean;
    isCollection(): boolean;
    isSearch(): boolean;
  }

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
    readonly objectType: string;
    readonly id: DataObjectID;
    readonly key: DataObjectKey;
    readonly libraryID: number;
    readonly libraryKey: string;
    parentID: DataObjectID | false | undefined;
    parentKey: DataObjectKey | false | undefined;
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
      options?: DataObject.EraseOptions,
    ): Promise<void>;

    /**
     * Retrieves one or more already-loaded items.
     * If an item hasn't been loaded, an error is thrown.
     *
     * @return A Zotero.DataObject, if a scalar id was passed;
     *         otherwise, an array of Zotero.DataObject
     */
    get<I extends DataObjectID | DataObjectID[]>(
      ids: I,
    ): I extends DataObjectID ? T | false : T[];

    /** Get all loaded objects */
    getLoaded(): T[];
  }

  interface Date {
    /**
     * Convert an SQL date in the form '2006-06-13 11:03:05' into a JS Date object
     *
     * Can also accept just the date part (e.g. '2006-06-13')
     */
    sqlToDate(sqldate: string, isUTC?: boolean): globalThis.Date | false;
  }

  interface Item extends DataObject {
    readonly itemTypeID: number;
    readonly itemType: string;
    parentItemID: DataObject['parentID'];
    parentItemKey: DataObject['parentKey'];
    parentItem: Item | undefined;
    topLevelItem: Item;

    dateAdded: string;
    dateModified: string;
    version: number;
    synced: boolean;
    createdByUserID: number | null;
    lastModifiedByUserID: number | null;

    addToCollection(collectionIDOrKey: DataObjectID | DataObjectKey): void;

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
      includeBaseMapped?: boolean,
    ): string | undefined;

    getFilePathAsync(): Promise<string | false>;

    getNote(): string;

    getNotes(includeTrashed: boolean): DataObjectID[];

    getNoteTitle(): string;

    getTags(): { tag: string; type: number }[];

    isNote(): boolean;

    isRegularItem(): boolean;

    isTopLevelItem(): boolean;

    setField(field: number | string, value: unknown, loadIn?: boolean): boolean;

    setNote(text: string): boolean;
  }

  interface Items extends DataObjects<Item> {
    /** Get the top-level items of all passed items */
    getTopLevel(items: Item[]): Item[];
  }

  interface ItemTypes extends CachedTypes {
    getImageSrc(itemType: string): string;
    getLocalizedString(idOrName: number | string): string;
  }

  interface MenuManager {
    /**
     * Register a custom menu.
     *
     * @param options
     * @returns The menu ID if successfully registered, or false
     */
    registerMenu<T extends MenuManager.Target>(
      options: MenuManager.MenuOptions<T>,
    ): string | false;

    /**
     * Unregister a custom menu.
     *
     * @param paneID The unique ID of the menu
     * @returns True if successfully unregistered
     */
    unregisterMenu(paneID: string): boolean;

    updateMenuPopup(
      popupElem: Element,
      targetType: MenuManager.Target,
      args?: MenuManager.MenuPopupArgs,
    ): void;
  }

  namespace MenuManager {
    /** Valid `menuType` values for a menu item. */
    type MenuType = 'menuitem' | 'separator' | 'submenu';

    /**
     * Valid targets for menu registration.
     */
    type Target =
      // Main window menubar menus
      | 'main/menubar/file'
      | 'main/menubar/edit'
      | 'main/menubar/view'
      | 'main/menubar/go'
      | 'main/menubar/tools'
      | 'main/menubar/help'
      // Main window library context menus
      | 'main/library/item'
      | 'main/library/collection'
      // Main window toolbar & file menu submenu: "Add attachment"
      | 'main/library/addAttachment'
      // Main window toolbar & file menu submenu: "New note"
      | 'main/library/addNote'
      // Main window tab context menus
      | 'main/tab'
      // Reader window menubar menus
      | 'reader/menubar/file'
      | 'reader/menubar/edit'
      | 'reader/menubar/view'
      | 'reader/menubar/go'
      | 'reader/menubar/window'
      // Item pane context menus
      | 'itemPane/info/row'
      // Notes pane add note buttons
      | 'notesPane/addItemNote'
      | 'notesPane/addStandaloneNote'
      // Sidenav buttons
      | 'sidenav/locate';

    /**
     * Base context object present in every menu callback.
     * Provides helpers to imperatively update the menu item at show-time.
     */
    interface MenuBaseContext {
      /** The menu's DOM element, if still alive. */
      readonly menuElem: XUL.XULElement | undefined;
      /** Update the menu item's l10n arguments. */
      setL10nArgs(l10nArgs: string): void;
      /** Enable or disable the menu item. */
      setEnabled(enabled: boolean): void;
      /** Show or hide the menu item. */
      setVisible(visible: boolean): void;
      /**
       * Update the menu item's icon.
       *
       * @param icon URI of the light-mode icon
       * @param darkIcon URI of the dark-mode icon; falls back to `icon` if omitted
       */
      setIcon(icon: string, darkIcon?: string): void;
    }

    /** The type of an open Zotero tab. */
    type TabType = 'library' | 'reader' | 'note' | (string & {});

    /**
     * The subtype of a reader tab, derived from the attachment type.
     * `undefined` for non-reader tabs.
     */
    type ReaderTabSubType = 'pdf' | 'epub' | 'snapshot' | undefined;

    /**
     * Context passed to callbacks registered on `main/menubar/*` targets
     * (file, edit, view, go, tools, help).
     *
     * When the active tab is a library tab, `items` contains the currently
     * selected items from the library pane. When it is a reader tab, `items`
     * contains the single item open in that tab.
     */
    interface MenubarMenuContext extends MenuBaseContext {
      /**
       * Items relevant to the current tab.
       * May be an empty array if nothing is selected / no item is open.
       */
      items: Zotero.Item[];
      /** Type of the currently active tab. */
      tabType: TabType;
      /**
       * Reader subtype of the active tab.
       * `undefined` when the active tab is not a reader tab.
       */
      tabSubType: ReaderTabSubType;
      /** ID of the currently active tab (`Zotero_Tabs.selectedID`). */
      tabID: string;
    }

    /**
     * Context passed to callbacks registered on the `main/library/item` target
     * (the right-click context menu in the items list).
     */
    interface LibraryItemMenuContext extends MenuBaseContext {
      /** The rows selected in the collection tree. */
      collectionTreeRows: Zotero.CollectionTreeRow[];
      /** The items currently selected in the items list. */
      items: Zotero.Item[];
      /** Always `"library"` for this menu. */
      tabType: 'library';
      /** Always `undefined` for this menu. */
      tabSubType: undefined;
      /** Always `"zotero-pane"` for this menu. */
      tabID: 'zotero-pane';
    }

    /**
     * Context passed to callbacks registered on the `main/library/collection`
     * target (the right-click context menu in the collection tree).
     *
     * Note: unlike the item menu, there is no `items` field here.
     */
    interface LibraryCollectionMenuContext extends MenuBaseContext {
      /** The rows that were right-clicked in the collection tree. */
      collectionTreeRows: Zotero.CollectionTreeRow[];
      /** Always `"library"` for this menu. */
      tabType: 'library';
      /** Always `undefined` for this menu. */
      tabSubType: undefined;
      /** Always `"zotero-pane"` for this menu. */
      tabID: 'zotero-pane';
    }

    /**
     * Maps a `Target` value to the context type injected into its callbacks.
     * Falls back to `MenuBaseContext` for targets with no documented extra fields.
     */
    type TargetContext<T extends Target> = T extends `main/menubar/${string}`
      ? MenubarMenuContext
      : T extends 'main/library/item'
        ? LibraryItemMenuContext
        : T extends 'main/library/collection'
          ? LibraryCollectionMenuContext
          : MenuBaseContext;

    /**
     * Data describing a single menu item.
     *
     * The type parameter `C` is the context object injected into callbacks;
     * it is inferred automatically from `MenuOptions<T>` and need not be
     * supplied manually.
     */
    type MenuData<C extends MenuBaseContext = MenuBaseContext> = {
      /** The type of the menu item. */
      menuType: MenuType;
      /** The l10n ID for the menu item. */
      l10nID?: string;
      /** Arguments for the l10n ID. Support for object type is deprecated. */
      l10nArgs?: string;
      /**
       * The icon for the menu item.
       * For menu icons, it is recommended to use an SVG icon with a size of 16x16.
       * Use `fill="context-fill"` in the SVG to use the default icon color
       * for automatic hover and dark mode support.
       */
      icon?: string;
      /**
       * The dark-mode icon for the menu item.
       * If not provided, the light icon will be used for both light and dark mode.
       */
      darkIcon?: string;
      /**
       * Tab types for which the menu item should be enabled.
       * Common values: `"library"`, `"reader/*"`, `"reader/pdf"`,
       * `"reader/epub"`, `"reader/snapshot"`; custom tab types are also allowed.
       * By default the menu item is always enabled.
       * Only applies to main window and reader window menubar menus.
       */
      enableForTabTypes?: string[];
      /** Called when the menu is about to be shown. */
      onShowing?: (event: Event, context: C) => void;
      /** Called when the menu is shown. */
      onShown?: (event: Event, context: C) => void;
      /** Called when the menu is about to be hidden. */
      onHiding?: (event: Event, context: C) => void;
      /** Called when the menu is hidden. */
      onHidden?: (event: Event, context: C) => void;
      /** Called when the menu item is clicked. */
      onCommand?: (event: Event, context: C) => void;
      /**
       * Child menu items. Required when `menuType` is `"submenu"`;
       * ignored for `"menuitem"` and `"separator"`.
       */
      menus?: MenuData<C>[];
    };

    /**
     * Options for registering a menu.
     *
     * The type parameter `T` is inferred from the `target` field and
     * determines the context type passed to all menu item callbacks.
     */
    type MenuOptions<T extends Target = Target> = {
      /** The unique ID of the menu. */
      menuID: string;
      /** The ID of the plugin registering the menu. */
      pluginID: string;
      /** The target location for the menu. */
      target: T;
      /** The menu items to add. Must be non-empty. */
      menus: MenuData<TargetContext<T>>[];
    };

    /**
     * Optional arguments passed to `updateMenuPopup`.
     */
    type MenuPopupArgs = {
      /**
       * The event that triggered the menu.
       * Because the `popupshowing` event has already fired by the time menus
       * are updated, it is passed manually so plugins can access it in their
       * `onShowing` callbacks.
       */
      event?: Event;
      /** Returns additional properties to merge into the `MenuContext`. */
      getContext?: () => Record<string, unknown>;
      /** The active tab type; only relevant for main window menubar menus. */
      tabType?: string;
      /**
       * The active tab subtype / reader type.
       * Only relevant for main window and reader window menubar menus.
       */
      tabSubType?: string;
      /** When true, skip automatic grouping of menu items. */
      skipGrouping?: boolean;
    };
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
          extraData: Record<string, unknown>,
        ): void;
      },
      types?: readonly Notifier.Type[],
      id?: string,
      priority?: number,
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

  interface PreferencePanes {
    /**
     * Register a pane to be displayed in the preferences. The pane XHTML
     * (`src`) is loaded as a fragment, not a full document, with XUL as the
     * default namespace and (X)HTML tags available under `html:`.
     *
     * The pane will be unregistered automatically when the registering plugin
     * shuts down.
     *
     * @return Resolves to the ID of the pane if successfully added
     */
    register(options: {
      /** ID of the plugin registering the pane */
      pluginID: string;
      /** URI of an XHTML fragment */
      src: string;
      /** Represents the pane and must be unique. Automatically generated if not provided */
      id?: string;
      /** ID of parent pane (if provided, pane is hidden from the sidebar) */
      parent?: string;
      /** Displayed as the pane's label in the sidebar. If not provided, the plugin's name is used */
      label?: string;
      /** URI of an icon to be displayed in the navigation sidebar. If not provided, the plugin's icon (from manifest.json) is used */
      image?: string;
      /** Array of URIs of DTD files to use for parsing the XHTML fragment */
      extraDTD?: string[];
      /** Array of URIs of scripts to load along with the pane */
      scripts?: string[];
      /** Array of URIs of CSS stylesheets to load along with the pane */
      stylesheets?: string[];
      /** If provided, a help button will be displayed under the pane and the provided URL will open when it is clicked */
      helpURL?: string;
    }): Promise<string>;
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
      global?: boolean,
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
      icons: string | Record<string, string>,
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
        parentItemProgress?: ItemProgress,
      ): ItemProgress;

      setError(): void;

      setItemTypeAndIcon(itemType: string, cssIcon?: string): void;

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
      items: Item[],
      format: string | QuickCopy.Format,
      callback?: (obj: { string: string }, worked: boolean) => void,
      modified?: boolean,
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

  interface Users {
    getCurrentUsername(): string | undefined;
  }

  interface UtilitiesInternal {
    openPreferences(
      paneID?: string,
      options?: {
        action?: string;
        tab?: string;
        tabIndex?: number;
      },
    ): XPCOM.nsIDOMWindow | null;
  }

  interface ZoteroPane {
    document: Document;

    getSelectedCollections<A extends boolean>(
      asID: A,
    ): A extends true ? DataObjectID[] : Collection[];

    getSelectedItems<A extends boolean>(
      asIDs: A,
    ): A extends true ? DataObjectID[] : Item[];

    loadURI(uris: string | string[]): void;
  }

  interface ZoteroProtocolHandler {
    _extensions: Record<`zotero://${string}`, ZoteroProtocolHandlerExtension>;
  }

  type ZoteroProtocolHandlerExtension = {
    doAction(uri: XPCOM.nsIURI): void | Promise<void>;
    newChannel(uri: XPCOM.nsIURI, loadInfo: unknown): unknown;
    noContent: boolean;
  };

  interface ZoteroWindow extends XPCOM.nsIDOMWindow {
    ZoteroPane?: ZoteroPane;
  }
}

declare interface Zotero {
  Attachments: Zotero.Attachments;
  Collections: Zotero.Collections;
  CreatorTypes: Zotero.CreatorTypes;
  Date: Zotero.Date;
  Items: Zotero.Items;
  ItemTypes: Zotero.ItemTypes;
  MenuManager: Zotero.MenuManager;
  Notifier: Zotero.Notifier;
  PreferencePanes: Zotero.PreferencePanes;
  Prefs: Zotero.Prefs;
  ProgressWindow: Zotero.ProgressWindow;
  QuickCopy: Zotero.QuickCopy;
  URI: Zotero.URI;
  Users: Zotero.Users;
  Utilities: { Internal: Zotero.UtilitiesInternal };

  /** Display an alert in a given window */
  alert(window: Window, title: string, msg: string): void;

  /** Debug logging function */
  debug(message: string): void;

  /**
   * Log a message to the Mozilla JS error console
   * @param type One of the flag types in `nsIScriptError`
   * @see https://udn.realityripple.com/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIScriptError#Flag_constants
   */
  log(
    message: string,
    type?: 'error' | 'warning' | 'exception' | 'strict' | 'info',
  ): void;

  getActiveZoteroPane(): Zotero.ZoteroPane | null;

  getMainWindow(): Zotero.ZoteroWindow | null;
  getMainWindows(): Zotero.ZoteroWindow[];

  hiDPI: boolean;
  hiDPISuffix: '@2x' | '';

  initializationPromise: Promise<void>;

  launchURL(url: string): void;

  locale: string;

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
}

declare const Zotero: Zotero;

/**
 * Bootstrap data provided by Zotero
 * @see https://www.zotero.org/support/dev/zotero_7_for_developers#xul_overlays_bootstrapjs
 * @see https://udn.realityripple.com/docs/Archive/Add-ons/Bootstrapped_extensions#Bootstrap_data
 */
declare type BootstrapData = {
  id: string;
  version: string;
  resourceURI: XPCOM.nsIURI;
  rootURI?: string;
};
