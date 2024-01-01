export enum NoteroPref {
  collectionSyncConfigs = 'collectionSyncConfigs',
  notionDatabaseID = 'notionDatabaseID',
  notionToken = 'notionToken',
  pageTitleFormat = 'pageTitleFormat',
  syncNotes = 'syncNotes',
  syncOnModifyItems = 'syncOnModifyItems',
}

export enum PageTitleFormat {
  itemAuthorDateCitation = 'itemAuthorDateCitation',
  itemCitationKey = 'itemCitationKey',
  itemFullCitation = 'itemFullCitation',
  itemInTextCitation = 'itemInTextCitation',
  itemShortTitle = 'itemShortTitle',
  itemTitle = 'itemTitle',
}

type NoteroPrefValue = Partial<{
  [NoteroPref.collectionSyncConfigs]: string;
  [NoteroPref.notionDatabaseID]: string;
  [NoteroPref.notionToken]: string;
  [NoteroPref.pageTitleFormat]: PageTitleFormat;
  [NoteroPref.syncNotes]: boolean;
  [NoteroPref.syncOnModifyItems]: boolean;
}>;

function buildFullPrefName(pref: NoteroPref): string {
  return `extensions.notero.${pref}`;
}

function getBooleanPref(value: Zotero.Prefs.Value): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function getStringPref(value: Zotero.Prefs.Value): string | undefined {
  return typeof value === 'string' && value ? value : undefined;
}

function isPageTitleFormat(
  value: Zotero.Prefs.Value,
): value is PageTitleFormat {
  return (
    typeof value === 'string' &&
    Object.values<string>(PageTitleFormat).includes(value)
  );
}

function getPageTitleFormatPref(
  value: Zotero.Prefs.Value,
): PageTitleFormat | undefined {
  return isPageTitleFormat(value) ? value : undefined;
}

function convertRawPrefValue<P extends NoteroPref>(
  pref: P,
  value: Zotero.Prefs.Value,
): NoteroPrefValue[P] {
  const booleanPref = getBooleanPref(value);
  const stringPref = getStringPref(value);

  const pageTitleFormatPref =
    (pref === NoteroPref.pageTitleFormat && getPageTitleFormatPref(value)) ||
    undefined;

  return {
    [NoteroPref.collectionSyncConfigs]: stringPref,
    [NoteroPref.notionDatabaseID]: stringPref,
    [NoteroPref.notionToken]: stringPref,
    [NoteroPref.pageTitleFormat]: pageTitleFormatPref,
    [NoteroPref.syncNotes]: booleanPref,
    [NoteroPref.syncOnModifyItems]: booleanPref,
  }[pref];
}

export function clearNoteroPref(pref: NoteroPref): void {
  Zotero.Prefs.clear(buildFullPrefName(pref), true);
}

export function getNoteroPref<P extends NoteroPref>(
  pref: P,
): NoteroPrefValue[P] {
  const value = Zotero.Prefs.get(buildFullPrefName(pref), true);
  return convertRawPrefValue(pref, value);
}

export function setNoteroPref<P extends NoteroPref>(
  pref: P,
  value: NoteroPrefValue[P],
): void {
  Zotero.Prefs.set(buildFullPrefName(pref), value, true);
}

export function registerNoteroPrefObserver<P extends NoteroPref>(
  pref: P,
  handler: (value: NoteroPrefValue[P]) => void,
): symbol {
  return Zotero.Prefs.registerObserver(
    buildFullPrefName(pref),
    (value: Zotero.Prefs.Value) => {
      handler(convertRawPrefValue(pref, value));
    },
    true,
  );
}

export function unregisterNoteroPrefObserver(symbol: symbol): void {
  Zotero.Prefs.unregisterObserver(symbol);
}
