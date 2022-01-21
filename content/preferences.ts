import {
  CollectionSyncConfig,
  CollectionSyncConfigsRecord,
  parseSyncConfigs,
} from './collection-sync-config';
import { buildCollectionFullName, getXULElementById } from './utils';

const COLUMN_IDS = {
  COLLECTION: 'notero-collectionColumn',
  SYNC_ENABLED: 'notero-syncEnabledColumn',
};

class Preferences {
  private syncConfigsPreference!: XUL.PreferenceElement;
  private syncConfigsTree!: XUL.TreeElement;
  private syncConfigsTreeView?: SyncConfigsTreeView;

  public async onPaneLoad(): Promise<void> {
    this.syncConfigsPreference = getXULElementById(
      'pref-collectionSyncConfigs'
    );
    this.syncConfigsTree = getXULElementById('notero-syncConfigsTree');

    await Zotero.uiReadyPromise;

    this.initTree();
  }

  private initTree(): void {
    this.syncConfigsTreeView = new SyncConfigsTreeView(
      () => this.syncConfigsPreference.value,
      (value) => {
        this.syncConfigsPreference.value = value;
      }
    );
    this.syncConfigsTree.view = this.syncConfigsTreeView;
    this.syncConfigsTree.disabled = false;
  }

  public openReadme(): void {
    Zotero.getActiveZoteroPane()?.loadURI(
      'https://github.com/dvanoni/notero#readme'
    );
  }
}

type SyncConfigsTreeRow = {
  collection: Zotero.Collection;
  collectionFullName: string;
  config: CollectionSyncConfig | undefined;
};

class SyncConfigsTreeView implements XPCOM.nsITreeView {
  private static collator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: 'base',
  });

  private readonly loadSyncConfigsValue: () => unknown;
  private readonly saveSyncConfigsValue: (value: string) => void;

  private _rows?: SyncConfigsTreeRow[];
  private _syncConfigs?: CollectionSyncConfigsRecord;
  private sortDescending = false;
  private treeBox?: XPCOM.nsITreeBoxObject;

  constructor(
    loadSyncConfigsValue: () => unknown,
    saveSyncConfigsValue: (value: string) => void
  ) {
    this.loadSyncConfigsValue = loadSyncConfigsValue;
    this.saveSyncConfigsValue = saveSyncConfigsValue;
  }

  private get rows(): SyncConfigsTreeRow[] {
    if (!this._rows) {
      this._rows = Zotero.Collections.getLoaded()
        .map((collection) => ({
          collection,
          collectionFullName: buildCollectionFullName(collection),
          config: this.syncConfigs[collection.id],
        }))
        .sort((a, b) =>
          SyncConfigsTreeView.collator.compare(
            a.collectionFullName,
            b.collectionFullName
          )
        );
      if (this.sortDescending) {
        this._rows.reverse();
      }
    }
    return this._rows;
  }

  private invalidateRows(): void {
    this._rows = undefined;
  }

  private get syncConfigs(): CollectionSyncConfigsRecord {
    if (!this._syncConfigs) {
      this._syncConfigs = parseSyncConfigs(this.loadSyncConfigsValue());
    }
    return this._syncConfigs;
  }

  private set syncConfigs(updatedSyncConfigs: CollectionSyncConfigsRecord) {
    this._syncConfigs = updatedSyncConfigs;
    this.saveSyncConfigsValue(JSON.stringify(updatedSyncConfigs));
  }

  private getSyncConfig(index: number): CollectionSyncConfig | undefined {
    return this.rows[index].config;
  }

  private updateSyncConfig(
    index: number,
    syncConfig: CollectionSyncConfig
  ): void {
    const collectionID = this.rows[index].collection.id;

    this.syncConfigs = {
      ...this.syncConfigs,
      [collectionID]: {
        ...this.getSyncConfig(index),
        ...syncConfig,
      },
    };

    this.invalidateRows();
    this.treeBox?.invalidateRow(index);
  }

  /* --- XPCOM.nsITreeView interface --- */

  get rowCount() {
    return this.rows.length;
  }

  selection!: XPCOM.nsITreeSelection;

  cycleHeader(col: XPCOM.nsITreeColumn): void {
    if (col.id !== COLUMN_IDS.COLLECTION) return;

    this.sortDescending = !this.sortDescending;
    this.invalidateRows();
  }

  getCellProperties(row: number, col: XPCOM.nsITreeColumn): string {
    const properties = [];
    if (col.id === COLUMN_IDS.SYNC_ENABLED) {
      properties.push('checkable');
    }
    if (!this.getSyncConfig(row)?.syncEnabled) {
      properties.push('syncDisabled');
    }
    return properties.join(' ');
  }

  getCellText(row: number, col: XPCOM.nsITreeColumn): string {
    if (col.id !== COLUMN_IDS.COLLECTION) return '';

    return this.rows[row].collectionFullName;
  }

  getCellValue(row: number, col: XPCOM.nsITreeColumn): string {
    if (col.id !== COLUMN_IDS.SYNC_ENABLED) return '';

    return this.getSyncConfig(row)?.syncEnabled ? 'true' : 'false';
  }

  getLevel(_index: number): number {
    return 0;
  }

  isContainer(_index: number): boolean {
    return false;
  }

  isEditable(row: number, col: XPCOM.nsITreeColumn): boolean {
    return col.id === COLUMN_IDS.SYNC_ENABLED;
  }

  isSeparator(_index: number): boolean {
    return false;
  }

  isSorted(): boolean {
    return false;
  }

  setCellValue(row: number, col: XPCOM.nsITreeColumn, value: string) {
    if (col.id !== COLUMN_IDS.SYNC_ENABLED) return;

    this.updateSyncConfig(row, {
      syncEnabled: value === 'true',
    });
  }

  setTree(treeBox: XPCOM.nsITreeBoxObject): void {
    this.treeBox = treeBox;
  }
}

module.exports = {
  preferences: new Preferences(),
};
