export enum NoteroPref {
  collectionName = 'collectionName',
  collectionSyncConfigs = 'collectionSyncConfigs',
  notionDatabaseID = 'notionDatabaseID',
  notionToken = 'notionToken',
  pageTitleFormat = 'pageTitleFormat',
  syncOnModifyItems = 'syncOnModifyItems',
}

export enum PageTitleFormat {
  itemFullCitation = 'itemFullCitation',
  itemInTextCitation = 'itemInTextCitation',
  itemShortTitle = 'itemShortTitle',
  itemTitle = 'itemTitle',
}

type NoteroPrefValue = Partial<{
  [NoteroPref.collectionName]: string;
  [NoteroPref.collectionSyncConfigs]: string;
  [NoteroPref.notionDatabaseID]: string;
  [NoteroPref.notionToken]: string;
  [NoteroPref.pageTitleFormat]: PageTitleFormat;
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
  value: Zotero.Prefs.Value
): value is PageTitleFormat {
  return (
    typeof value === 'string' &&
    Object.values<string>(PageTitleFormat).includes(value)
  );
}

function getPageTitleFormatPref(
  value: Zotero.Prefs.Value
): PageTitleFormat | undefined {
  return isPageTitleFormat(value) ? value : undefined;
}

export function clearNoteroPref(pref: NoteroPref): void {
  Zotero.Prefs.clear(buildFullPrefName(pref), true);
}

export function getNoteroPref<P extends NoteroPref>(
  pref: P
): NoteroPrefValue[P] {
  const value = Zotero.Prefs.get(buildFullPrefName(pref), true);

  const booleanPref = getBooleanPref(value);
  const stringPref = getStringPref(value);

  const pageTitleFormatPref =
    (pref === NoteroPref.pageTitleFormat && getPageTitleFormatPref(value)) ||
    undefined;

  return {
    [NoteroPref.collectionName]: stringPref,
    [NoteroPref.collectionSyncConfigs]: stringPref,
    [NoteroPref.notionDatabaseID]: stringPref,
    [NoteroPref.notionToken]: stringPref,
    [NoteroPref.pageTitleFormat]: pageTitleFormatPref,
    [NoteroPref.syncOnModifyItems]: booleanPref,
  }[pref];
}

export function setNoteroPref<P extends NoteroPref>(
  pref: P,
  value: NoteroPrefValue[P]
): void {
  Zotero.Prefs.set(buildFullPrefName(pref), value, true);
}
