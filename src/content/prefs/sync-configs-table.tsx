import VirtualizedTable, {
  makeRowRenderer,
  // eslint-disable-next-line import-x/no-unresolved
} from 'components/virtualized-table';
import React from 'react';

import { buildCollectionFullName } from '../utils';

import {
  CollectionSyncConfig,
  CollectionSyncConfigsRecord,
  loadSyncConfigs,
  saveSyncConfigs,
} from './collection-sync-config';

const COLUMNS = [
  {
    dataKey: 'syncEnabled',
    type: 'checkbox',
    fixedWidth: true,
    width: 100,
  },
  {
    dataKey: 'collectionFullName',
  },
] as const;

export type DataKey = (typeof COLUMNS)[number]['dataKey'];

type SyncConfigsTableRow = CollectionSyncConfig & {
  collection: Zotero.Collection;
  collectionFullName: string;
};

type SortDirection = 1 | -1;

type RowSortCompareFn = (
  a: SyncConfigsTableRow,
  b: SyncConfigsTableRow,
  sortDirection: SortDirection,
) => number;

type Props = {
  columnLabels: Record<DataKey, string>;
  container: Element;
};

const COLLATOR = new Intl.Collator(Zotero.locale, {
  numeric: true,
  sensitivity: 'base',
});

const COMPARATORS: Record<DataKey, RowSortCompareFn> = {
  collectionFullName(a, b, sortDirection) {
    return (
      sortDirection *
      COLLATOR.compare(a.collectionFullName, b.collectionFullName)
    );
  },
  syncEnabled(a, b, sortDirection) {
    const result = Number(a.syncEnabled) - Number(b.syncEnabled);
    if (result !== 0) return result * sortDirection;
    return this.collectionFullName(a, b, 1);
  },
};

// eslint-disable-next-line import-x/no-named-as-default-member
export class SyncConfigsTable extends React.Component<Props> {
  private _rows?: SyncConfigsTableRow[];
  private _syncConfigs?: CollectionSyncConfigsRecord;

  private observer?: IntersectionObserver;
  private sortDirection: SortDirection = 1;
  private sortKey: DataKey = 'collectionFullName';
  private table: VirtualizedTable<DataKey> | null = null;

  private observeFirstView() {
    this.observer = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.refreshUponFirstView();
          }
        });
      },
    );
    this.observer.observe(this.props.container);
  }

  private refreshUponFirstView() {
    this.table?.invalidate();
    this.observer?.disconnect();
  }

  private buildRows(): SyncConfigsTableRow[] {
    return Zotero.Collections.getLoaded()
      .filter((collection) => !collection.deleted)
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
    const enable = !indices.every((index) => this.rows[index]?.syncEnabled);

    this.syncConfigs = indices.reduce((configs, index) => {
      const collection = this.rows[index]?.collection;
      if (!collection) return configs;

      return {
        ...configs,
        [collection.id]: {
          syncEnabled: enable,
        },
      };
    }, this.syncConfigs);
  }

  getRowCount = () => this.rows.length;

  getRowString = (index: number) => this.rows[index]?.collectionFullName || '';

  handleActivate = (_event: KeyboardEvent | MouseEvent, indices: number[]) => {
    this.toggleEnabled(indices);
    this.invalidateRows();
    this.table?.invalidate();
  };

  handleColumnSort = (columnIndex: number, sortDirection: SortDirection) => {
    this.sortDirection = sortDirection;
    this.sortKey = COLUMNS[columnIndex]?.['dataKey'] || 'collectionFullName';
    this.invalidateRows();
    this.table?.invalidate();
  };

  renderItem = makeRowRenderer((index) => this.rows[index] || {});

  setTableRef = (ref: typeof this.table) => {
    this.table = ref;
    this.observeFirstView();
  };

  render() {
    const columns = COLUMNS.map((column) => ({
      ...column,
      label: this.props.columnLabels[column.dataKey],
    }));

    return (
      <VirtualizedTable
        id="notero-syncConfigsTable"
        columns={columns}
        getRowCount={this.getRowCount}
        getRowString={this.getRowString}
        ref={this.setTableRef}
        renderItem={this.renderItem}
        multiSelect
        showHeader
        onActivate={this.handleActivate}
        onColumnSort={this.handleColumnSort}
      />
    );
  }
}
