import VirtualizedTable, {
  makeRowRenderer,
  // eslint-disable-next-line import/no-unresolved
} from 'components/virtualized-table';
import React from 'react';

import { buildCollectionFullName, getMainWindow } from '../utils';

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
  {
    dataKey: 'associatedLink',
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
  associatedLink(a, b, sortDirection) {
    return (
      sortDirection *
      COLLATOR.compare(a.associatedLink || '', b.associatedLink || '')
    );
  },
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
      .map((collection) => ({
        collection,
        associatedLink: this.syncConfigs[collection.id]?.associatedLink,
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
          ...configs[collection.id],
          syncEnabled: enable,
        },
      };
    }, this.syncConfigs);
  }

  private openCollectionDialog(
    collection: Zotero.Collection,
    syncEnabled: boolean,
    associatedLink: string | undefined,
  ) {
    const params = {
      associatedLink: associatedLink || '',
      syncEnabled,
      accepted: false,
      dataOut: null,
    };

    // create zotero window to add
    const window = getMainWindow();
    window.openDialog(
      'chrome://notero/content/prefs/dialog.xhtml',
      '',
      'chrome,modal,centerscreen',
      params,
    );
    const data = params.dataOut as unknown as
      | { accepted: boolean; associatedLink: string; syncEnabled: boolean }
      | undefined;

    if (!data || !data.accepted) {
      return null;
    }

    return data;
  }

  getRowCount = () => this.rows.length;

  getRowString = (index: number) => this.rows[index]?.collectionFullName || '';

  handleActivate = (_event: KeyboardEvent | MouseEvent, indices: number[]) => {
    if (indices.length == 1 && indices[0] !== undefined) {
      const index = indices[0];
      const row = this.rows[index];
      if (!row) return;

      const result = this.openCollectionDialog(
        row.collection,
        row.syncEnabled,
        row.associatedLink,
      );

      if (result) {
        this.syncConfigs = {
          ...this.syncConfigs,
          [row.collection.id]: {
            syncEnabled: result.syncEnabled,
            associatedLink: result.associatedLink,
          },
        };
      }
      this.invalidateRows();
      this.table?.invalidate();
    }
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
