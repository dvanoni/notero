import { getNoteroPref, NoteroPref, setNoteroPref } from './notero-pref';
import { log } from './utils';

export type CollectionSyncConfig = {
  notionOptionID?: string;
  syncEnabled: boolean;
};

export type CollectionSyncConfigsRecord = Record<
  Zotero.Collection['id'],
  CollectionSyncConfig | undefined
>;

export function loadSyncEnabledCollectionIDs(): Set<Zotero.Collection['id']> {
  const configs = loadSyncConfigs();
  const collectionIDs = Object.entries(configs)
    .filter(([id, config]) => Number(id) > 0 && config?.syncEnabled)
    .map(([id]) => Number(id));
  return new Set(collectionIDs);
}

export function loadSyncConfigs(): CollectionSyncConfigsRecord {
  const json = getNoteroPref(NoteroPref.collectionSyncConfigs);
  return parseSyncConfigs(json);
}

export function saveSyncConfigs(configs: CollectionSyncConfigsRecord): void {
  setNoteroPref(NoteroPref.collectionSyncConfigs, JSON.stringify(configs));
}

export function parseSyncConfigs(json: unknown): CollectionSyncConfigsRecord {
  if (typeof json !== 'string') return {};

  try {
    const parsedValue: unknown = JSON.parse(json);
    if (!isObject(parsedValue)) return {};

    const configs: CollectionSyncConfigsRecord = {};

    Object.entries(parsedValue)
      .map(convertKeyToNumber)
      .filter(isCollectionSyncConfigEntry)
      .forEach(([collectionID, config]) => {
        configs[collectionID] = config;
      });

    return configs;
  } catch (error) {
    log(`Failed to parse Notero sync configs: ${String(error)}`, 'error');
    return {};
  }
}

function convertKeyToNumber([key, value]: [string, unknown]): [
  number,
  unknown
] {
  return [Number(key), value];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isCollectionSyncConfig(value: unknown): value is CollectionSyncConfig {
  return isObject(value) && 'syncEnabled' in value;
}

function isCollectionSyncConfigEntry(
  entry: [number, unknown]
): entry is [Zotero.Collection['id'], CollectionSyncConfig] {
  const [key, value] = entry;
  return key > 0 && isCollectionSyncConfig(value);
}
