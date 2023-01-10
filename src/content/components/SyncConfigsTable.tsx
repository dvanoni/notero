import VirtualizedTable, {
  makeRowRenderer,
  // eslint-disable-next-line import/no-unresolved
} from 'components/virtualized-table';
import React from 'react';
import { IntlProvider } from 'react-intl';

import {
  CollectionSyncConfig,
  loadSyncConfigs,
} from '../collection-sync-config';
import { buildCollectionFullName, getLocalizedString, log } from '../utils';

const columns = [
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
];

const syncConfigs = loadSyncConfigs();

type SyncConfigsTableRow = CollectionSyncConfig & {
  collection: Zotero.Collection;
  collectionFullName: string;
};

const collator = new Intl.Collator(Zotero.locale, {
  numeric: true,
  sensitivity: 'base',
});

export default class SyncConfigsTable extends React.Component {
  private _rows?: SyncConfigsTableRow[];
  private sortDescending = false;

  private get rows(): SyncConfigsTableRow[] {
    if (!this._rows) {
      this._rows = Zotero.Collections.getLoaded()
        .map((collection) => ({
          collection,
          collectionFullName: buildCollectionFullName(collection),
          ...(syncConfigs[collection.id] || { syncEnabled: false }),
        }))
        .sort((a, b) =>
          collator.compare(a.collectionFullName, b.collectionFullName)
        );
      if (this.sortDescending) {
        this._rows.reverse();
      }
    }
    return this._rows;
  }

  render() {
    return (
      <IntlProvider locale={Zotero.locale}>
        <VirtualizedTable
          id="notero-syncConfigsTable"
          columns={columns}
          getRowCount={() => this.rows.length}
          getRowString={(index) => this.rows[index].collectionFullName}
          renderItem={makeRowRenderer((index) => this.rows[index])}
          multiSelect
          showHeader
          onActivate={(event, indices) => {
            log(`activate: ${JSON.stringify(indices)}`);
          }}
          onColumnSort={(columnIndex, sortDirection) => {
            if (columnIndex !== 1) return;
            this.sortDescending = sortDirection === -1;
            this._rows = undefined;
          }}
        />
      </IntlProvider>
    );
  }
}
