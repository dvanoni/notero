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
    nsILoginInfo: nsILoginInfo;
    nsILoginManager: nsILoginManager;
  };

  interface amIAddonManagerStartup {
    registerChrome(manifestURI: nsIURI, entries: string[][]): nsIJSRAIIHelper;
  }

  interface mozIJSSubScriptLoader {
    loadSubScript(url: string, targetObj?: unknown, charset?: string): void;
  }

  interface nsIDOMParser extends nsISupports, DOMParser {}

  interface nsIDOMWindow extends nsISupports, Window {
    console: Console;
  }

  interface nsIInterfaceRequestor {
    getInterface<I extends Interfaces[keyof Interfaces]>(uuid: I): I;
  }

  interface nsIIOService {
    newURI(spec: string, originCharset?: string, baseURI?: nsIURI): nsIURI;
    getProtocolHandler(scheme: string): nsIProtocolHandler;
  }

  interface nsIJSCID {
    createInstance<I extends Interfaces[keyof Interfaces]>(uuid: I): I;
    getService<I extends Interfaces[keyof Interfaces]>(uuid: I): I;
  }

  interface nsIJSRAIIHelper {
    destruct(): void;
  }

  interface nsILoginInfo {
    readonly displayOrigin: string;
    origin: string;
    formActionOrigin: string | null;
    httpRealm: string | null;
    username: string;
    password: string;
    init(
      origin: string,
      formActionOrigin: string | null,
      httpRealm: string | null,
      username: string,
      password: string,
      usernameField?: string,
      passwordField?: string,
    ): void;
    matches(loginInfo: nsILoginInfo, ignorePassword: boolean): boolean;
  }

  interface nsILoginManager {
    addLoginAsync(
      login: nsILoginInfo | Partial<nsILoginMetaInfo>,
    ): Promise<nsILoginInfo | nsILoginMetaInfo>;
    modifyLogin(
      oldLogin: nsILoginInfo,
      newLoginData: nsILoginInfo | Partial<nsILoginInfo | nsILoginMetaInfo>,
    ): void;
    removeLogin(login: nsILoginInfo): void;
    searchLoginsAsync(
      matchData: Pick<nsILoginInfo, 'origin'> &
        Partial<Omit<nsILoginInfo, 'username' | 'password'> | nsILoginMetaInfo>,
    ): Promise<nsILoginInfo[]>;
  }

  interface nsILoginMetaInfo {
    guid: string;
    timeCreated: number;
    timeLastUsed: number;
    timePasswordChanged: number;
    timesUsed: number;
  }

  interface nsIPrefBranch {
    setBoolPref(prefName: string, value: boolean): void;
    setIntPref(prefName: string, value: number): void;
    setStringPref(prefName: string, value: string): void;
  }

  interface nsIPrefService {
    getDefaultBranch(prefRoot: string): nsIPrefBranch;
  }

  interface nsIPromptService {
    confirm(
      parent: nsIDOMWindow | null,
      dialogTitle: string,
      text: string,
    ): boolean;
  }

  type nsIProtocolHandler = nsISupports;

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
    wrappedJSObject?: object;
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
    filePath: string;
    hasRef: boolean;
    pathQueryRef: string;
    query: string;
    ref: string;
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
  Constructor<
    I extends XPCOM.Interfaces[keyof XPCOM.Interfaces],
    K extends FunctionProperties<I>,
  >(
    contractID: string,
    interfaceName?: I,
    initializer?: K,
  ): {
    new (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...args: Parameters<I[K] extends (...args: any) => any ? I[K] : never>
    ): I;
  };
};

declare const Cc: typeof Components.classes;
declare const Ci: typeof Components.interfaces;
declare const Cu: typeof Components.utils;
