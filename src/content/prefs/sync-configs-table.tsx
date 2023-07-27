import VirtualizedTable, {
  makeRowRenderer,
  // eslint-disable-next-line import/no-unresolved
} from 'components/virtualized-table';
import React from 'react';
import { IntlProvider } from 'react-intl';

import { buildCollectionFullName, getLocalizedString } from '../utils';

import {
  CollectionSyncConfig,
  CollectionSyncConfigsRecord,
  loadSyncConfigs,
  saveSyncConfigs,
} from './collection-sync-config';

const COLUMNS = [
  {
    dataKey: 'syncEnabled',
    label: getLocalizedString('notero.preferences.syncEnabledColumn'),
    type: 'checkbox',
    fixedWidth: true,
    width: 100,
  },
  {
    dataKey: 'collectionFullName',
    label: getLocalizedString('notero.preferences.collectionColumn'),
  },
] as const;

type DataKey = (typeof COLUMNS)[number]['dataKey'];

type SyncConfigsTableRow = CollectionSyncConfig & {
  collection: Zotero.Collection;
  collectionFullName: string;
};

type RowSortCompareFn = (
  a: SyncConfigsTableRow,
  b: SyncConfigsTableRow,
  sortDirection: number
) => number;

const COLLATOR = new Intl.Collator(Zotero.locale, {
  numeric: true,
  sensitivity: 'base',
});

const COMPARATORS: Record<DataKey, RowSortCompareFn> = {
  collectionFullName: (a, b, sortDirection) =>
    sortDirection *
    COLLATOR.compare(a.collectionFullName, b.collectionFullName),
  syncEnabled: (a, b, sortDirection) => {
    const result = Number(a.syncEnabled) - Number(b.syncEnabled);
    if (result !== 0) return result * sortDirection;
    return COLLATOR.compare(a.collectionFullName, b.collectionFullName);
  },
};

export class SyncConfigsTable extends React.Component {
  private _rows?: SyncConfigsTableRow[];
  private _syncConfigs?: CollectionSyncConfigsRecord;

  private sortDirection = 1;
  private sortKey: DataKey = 'collectionFullName';
  private table: VirtualizedTable<DataKey> | null = null;

  private buildRows(): SyncConfigsTableRow[] {
    return Zotero.Collections.getLoaded()
      .map((collection) => ({
        collection,
        collectionFullName: buildCollectionFullName(collection),
        ...(this.syncConfigs[collection.id] || { syncEnabled: false }),
      }))
      .sort((a, b) => COMPARATORS[this.sortKey](a, b, this.sortDirection));
  }

  private get rows(): SyncConfigsTableRow[] {
    if (!this._rows) {
      this._rows = this.buildRows();
    }
    return this._rows;
  }

  private invalidateRows(): void {
    this._rows = undefined;
  }

  private get syncConfigs(): CollectionSyncConfigsRecord {
    if (!this._syncConfigs) {
      this._syncConfigs = loadSyncConfigs();
    }
    return this._syncConfigs;
  }

  private set syncConfigs(updatedSyncConfigs: CollectionSyncConfigsRecord) {
    this._syncConfigs = updatedSyncConfigs;
    saveSyncConfigs(updatedSyncConfigs);
  }

  private toggleEnabled(indices: number[]) {
    const enable = !indices.every((index) => this.rows[index].syncEnabled);

    this.syncConfigs = indices.reduce((configs, index) => {
      const { collection } = this.rows[index];
      return {
        ...configs,
        [collection.id]: {
          syncEnabled: enable,
        },
      };
    }, this.syncConfigs);
  }

  getRowCount = () => this.rows.length;

  getRowString = (index: number) => this.rows[index].collectionFullName;

  handleActivate = (_event: KeyboardEvent | MouseEvent, indices: number[]) => {
    this.toggleEnabled(indices);
    this.invalidateRows();
    this.table?.invalidate();
  };

  handleColumnSort = (columnIndex: number, sortDirection: number) => {
    this.sortDirection = sortDirection;
    this.sortKey = COLUMNS[columnIndex]['dataKey'];
    this.invalidateRows();
    this.table?.invalidate();
  };

  renderItem = makeRowRenderer((index) => this.rows[index]);

  render() {
    return (
      <IntlProvider locale={Zotero.locale}>
        <VirtualizedTable
          id="notero-syncConfigsTable"
          columns={COLUMNS}
          getRowCount={this.getRowCount}
          getRowString={this.getRowString}
          ref={(ref) => (this.table = ref)}
          renderItem={this.renderItem}
          multiSelect
          showHeader
          onActivate={this.handleActivate}
          onColumnSort={this.handleColumnSort}
        />
      </IntlProvider>
    );
  }
}
