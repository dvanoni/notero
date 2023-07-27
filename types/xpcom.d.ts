/**
 * @see https://udn.realityripple.com/docs/Mozilla/Tech/XPCOM/Reference/Interface
 */
declare namespace XPCOM {
  type Interfaces = {
    amIAddonManagerStartup: amIAddonManagerStartup;
    nsIDOMParser: nsIDOMParser;
    nsIDOMWindow: nsIDOMWindow;
    nsIDOMWindowInternal: nsIDOMWindow;
    nsIInterfaceRequestor: nsIInterfaceRequestor;
  };

  interface amIAddonManagerStartup {
    registerChrome(manifestURI: nsIURI, entries: string[][]): nsIJSRAIIHelper;
  }

  interface mozIJSSubScriptLoader {
    loadSubScript(url: string, targetObj?: unknown, charset?: string): void;
  }

  interface nsIDOMParser extends nsISupports, DOMParser {}

  interface nsIDOMWindow extends nsISupports, Window {}

  interface nsIInterfaceRequestor {
    getInterface<I extends Interfaces[keyof Interfaces]>(uuid: I): I;
  }

  interface nsIIOService {
    newURI(spec: string, originCharset?: string, baseURI?: nsIURI): nsIURI;
  }

  interface nsIJSCID {
    createInstance<I extends Interfaces[keyof Interfaces]>(uuid: I): I;
    getService<I extends Interfaces[keyof Interfaces]>(uuid: I): I;
  }

  interface nsIJSRAIIHelper {
    destruct(): void;
  }

  interface nsIPrefBranch {
    setBoolPref(prefName: string, value: boolean): void;
    setIntPref(prefName: string, value: number): void;
    setStringPref(prefName: string, value: string): void;
  }

  interface nsIPrefService {
    getDefaultBranch(prefRoot: string): nsIPrefBranch;
  }

  interface nsISimpleEnumerator {
    getNext(): nsISupports;
    hasMoreElements(): boolean;
  }

  interface nsIStringBundle {
    GetStringFromName(name: string): string;
  }

  interface nsIStringBundleService {
    createBundle(url: string): nsIStringBundle;
  }

  interface nsISupports extends Record<string, unknown> {
    QueryInterface<I extends Interfaces[keyof Interfaces]>(uuid: I): I;
  }

  interface nsITreeBoxObject {
    invalidate(): void;
    invalidateRow(index: number): void;
    rowCountChanged(index: number, count: number): void;
    beginUpdateBatch(): void;
    endUpdateBatch(): void;
  }

  interface nsITreeColumn {
    readonly cycler: boolean;
    readonly editable: boolean;
    readonly element: Element;
    readonly id: string;
    readonly index: number;
    readonly primary: boolean;
    readonly type: number;
    readonly width: number;
    readonly x: number;
  }

  interface nsITreeSelection {
    readonly count: number;
    currentColumn: nsITreeColumn;
    currentIndex: number;
    single: boolean;
    clearSelection(): void;
  }

  interface nsITreeView {
    readonly rowCount: number;
    selection: nsITreeSelection;
    canDrop?(index: number, orientation: number): boolean;
    cycleCell?(row: number, col: nsITreeColumn): void;
    cycleHeader(col: nsITreeColumn): void;
    drop?(row: number, orientation: number): void;
    getCellProperties?(row: number, col: nsITreeColumn): string;
    getCellText(row: number, col: nsITreeColumn): string;
    getCellValue?(row: number, col: nsITreeColumn): string;
    getColumnProperties?(col: nsITreeColumn): string;
    getImageSrc?(row: number, col: nsITreeColumn): string;
    getLevel(index: number): number;
    getParentIndex?(rowIndex: number): number;
    getProgressMode?(row: number, col: nsITreeColumn): number;
    getRowProperties?(index: number): string;
    hasNextSibling?(rowIndex: number, afterIndex: number): boolean;
    isContainer(index: number): boolean;
    isContainerEmpty?(index: number): boolean;
    isContainerOpen?(index: number): boolean;
    isEditable(row: number, col: nsITreeColumn): boolean;
    isSeparator(index: number): boolean;
    isSorted(): boolean;
    performAction?(action: string): void;
    performActionOnCell?(action: string, row: number, col: nsITreeColumn): void;
    performActionOnRow?(action: string, row: number): void;
    selectionChanged?(): void;
    setCellText?(row: number, col: nsITreeColumn, value: string): void;
    setCellValue?(row: number, col: nsITreeColumn, value: string): void;
    setTree?(tree: nsITreeBoxObject): void;
    toggleOpenState?(index: number): void;
  }

  interface nsIURI {
    spec: string;
  }

  interface nsIWindowMediator {
    addListener(listener: nsIWindowMediatorListener): void;
    getEnumerator(windowType: string): nsISimpleEnumerator;
    getMostRecentWindow(windowType: string): nsIDOMWindow;
    removeListener(listener: nsIWindowMediatorListener): void;
  }

  interface nsIWindowMediatorListener {
    onOpenWindow?(xulWindow: nsIXULWindow): void;
    onCloseWindow?(xulWindow: nsIXULWindow): void;
  }

  type nsIXULWindow = nsISupports;
}

/**
 * @see https://udn.realityripple.com/docs/Mozilla/Tech/XPCOM/Language_Bindings
 */
declare const Components: {
  classes: Record<string, XPCOM.nsIJSCID>;
  interfaces: XPCOM.Interfaces;
  utils: {
    import(url: string, scope?: object): unknown;
    importGlobalProperties(properties: string[]): void;
  };
};

declare const Cc: typeof Components.classes;
declare const Ci: typeof Components.interfaces;
declare const Cu: typeof Components.utils;

declare const ChromeUtils: typeof Components.utils;

/**
 * @see https://udn.realityripple.com/docs/Mozilla/JavaScript_code_modules/Services.jsm
 */
declare interface Services {
  io: XPCOM.nsIIOService;
  prefs: XPCOM.nsIPrefService;
  scriptloader: XPCOM.mozIJSSubScriptLoader;
  strings: XPCOM.nsIStringBundleService;
  wm: XPCOM.nsIWindowMediator;
}

declare const Services: Services;
