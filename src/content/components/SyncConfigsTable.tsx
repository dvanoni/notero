import VirtualizedTable, {
  renderCell,
  renderCheckboxCell,
  VirtualizedTableProps,
  // eslint-disable-next-line import/no-unresolved
} from 'components/virtualized-table';
import React from 'react';
import { IntlProvider } from 'react-intl';

import {
  CollectionSyncConfig,
  loadSyncConfigs,
} from '../collection-sync-config';
import {
  buildCollectionFullName,
  createHTMLElement,
  getLocalizedString,
  log,
} from '../utils';

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
] as const;

type DataKey = typeof columns[number]['dataKey'];

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

  renderItem: VirtualizedTableProps<DataKey>['renderItem'] = (
    index,
    selection,
    oldDiv,
    columns
  ) => {
    let div;
    if (oldDiv) {
      div = oldDiv;
      div.innerHTML = '';
    } else {
      div = createHTMLElement(document, 'div');
      div.className = 'row';
    }

    div.classList.toggle('selected', selection.isSelected(index));
    div.classList.toggle('focused', selection.focused == index);
    const rowData = this.rows[index];

    for (const column of columns) {
      if (column.hidden) continue;

      if (column.type === 'checkbox') {
        div.appendChild(
          renderCheckboxCell(index, rowData[column.dataKey], column)
        );
      } else {
        div.appendChild(renderCell(index, rowData[column.dataKey], column));
      }
    }

    return div;
  };

  render() {
    return (
      <IntlProvider locale={Zotero.locale}>
        <VirtualizedTable
          id="notero-syncConfigsTable"
          columns={columns}
          getRowCount={() => this.rows.length}
          getRowString={(index) => this.rows[index].collectionFullName}
          // renderItem={makeRowRenderer((index) => this.rows[index])}
          renderItem={this.renderItem}
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
