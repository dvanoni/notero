export enum NoteroPref {
  collectionName = 'collectionName',
  collectionSyncConfigs = 'collectionSyncConfigs',
  notionDatabaseID = 'notionDatabaseID',
  notionToken = 'notionToken',
  syncOnModifyItems = 'syncOnModifyItems',
  zoteroAPIKey = 'zoteroAPIKey',
}

type NoteroPrefValue = Partial<{
  [NoteroPref.collectionName]: string;
  [NoteroPref.collectionSyncConfigs]: string;
  [NoteroPref.notionDatabaseID]: string;
  [NoteroPref.notionToken]: string;
  [NoteroPref.syncOnModifyItems]: boolean;
  [NoteroPref.zoteroAPIKey]: string;
}>;

function buildFullPrefName(pref: NoteroPref): string {
  return `extensions.notero.${pref}`;
}

export function clearNoteroPref(pref: NoteroPref): void {
  Zotero.Prefs.clear(buildFullPrefName(pref), true);
}

export function getNoteroPref<P extends NoteroPref>(
  pref: P
): NoteroPrefValue[P] {
  const value = Zotero.Prefs.get(buildFullPrefName(pref), true);

  const booleanPref = typeof value === 'boolean' ? value : undefined;
  const stringPref = typeof value === 'string' && value ? value : undefined;

  return {
    [NoteroPref.collectionName]: stringPref,
    [NoteroPref.collectionSyncConfigs]: stringPref,
    [NoteroPref.notionDatabaseID]: stringPref,
    [NoteroPref.notionToken]: stringPref,
    [NoteroPref.syncOnModifyItems]: booleanPref,
    [NoteroPref.zoteroAPIKey]: stringPref,
  }[pref];
}

export function setNoteroPref<P extends NoteroPref>(
  pref: P,
  value: NoteroPrefValue[P]
): void {
  Zotero.Prefs.set(buildFullPrefName(pref), value, true);
}
