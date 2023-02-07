import { log } from '../utils';

import { getNoteroPref, NoteroPref, setNoteroPref } from './notero-pref';

export type CollectionSyncConfig = {
  notionOptionID?: string;
  syncEnabled: boolean;
};

export type CollectionSyncConfigsRecord = Record<
  Zotero.Collection['id'],
  CollectionSyncConfig | undefined
>;

/**
 * Load collection sync configs from preferences.
 * @returns An object of sync configs keyed by collection ID.
 */
export function loadSyncConfigs(): CollectionSyncConfigsRecord {
  const json = getNoteroPref(NoteroPref.collectionSyncConfigs);
  return parseSyncConfigs(json);
}

/**
 * Load collection sync configs from preferences and return those that have sync
 * enabled.
 * @returns An object of sync configs that have sync enabled, keyed by
 * collection ID.
 */
export function loadSyncEnabledConfigs(): CollectionSyncConfigsRecord {
  const allConfigs = loadSyncConfigs();

  return Object.entries(allConfigs).reduce(
    (syncEnabledConfigs: CollectionSyncConfigsRecord, [key, config]) => {
      const collectionID = Number(key);
      if (collectionID > 0 && config?.syncEnabled) {
        syncEnabledConfigs[collectionID] = config;
      }
      return syncEnabledConfigs;
    },
    {}
  );
}

/**
 * Load collection sync configs from preferences and return the collection IDs
 * that have sync enabled.
 * @returns A set of collection IDs that have sync enabled.
 */
export function loadSyncEnabledCollectionIDs(): Set<Zotero.Collection['id']> {
  const syncEnabledConfigs = loadSyncEnabledConfigs();
  const collectionIDs = Object.keys(syncEnabledConfigs).map(Number);
  return new Set(collectionIDs);
}

/**
 * Save collection sync configs to preferences as a JSON string.
 * @param configs An object of sync configs.
 */
export function saveSyncConfigs(configs: CollectionSyncConfigsRecord): void {
  setNoteroPref(NoteroPref.collectionSyncConfigs, JSON.stringify(configs));
}

/**
 * Parse collection sync configs from a JSON string.
 * @param json A JSON string representing sync configs.
 * @returns An object of sync configs, or an empty object if parsing fails.
 */
export function parseSyncConfigs(json: unknown): CollectionSyncConfigsRecord {
  if (typeof json !== 'string') return {};

  try {
    const parsedValue: unknown = JSON.parse(json);
    if (!isObject(parsedValue)) return {};

    return Object.entries(parsedValue)
      .map(convertKeyToNumber)
      .filter(isCollectionSyncConfigEntry)
      .reduce(
        (configs: CollectionSyncConfigsRecord, [collectionID, config]) => {
          configs[collectionID] = config;
          return configs;
        },
        {}
      );
  } catch (error) {
    log(`Failed to parse sync configs: ${String(error)}`, 'error');
    return {};
  }
}

// Helper functions

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
