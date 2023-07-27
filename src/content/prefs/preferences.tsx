import React from 'react';
// eslint-disable-next-line import/no-unresolved
import ReactDOM from 'react-dom';

import { getLocalizedString, getXULElementById } from '../utils';

import { PageTitleFormat } from './notero-pref';
import { SyncConfigsTable } from './sync-configs-table';

class Preferences {
  private pageTitleFormatMenu!: XUL.MenuListElement;

  public async init(): Promise<void> {
    this.pageTitleFormatMenu = getXULElementById('notero-pageTitleFormat');

    await Zotero.uiReadyPromise;

    this.initPageTitleFormatMenu();

    ReactDOM.render(
      <SyncConfigsTable />,
      document.getElementById('notero-syncConfigsTable-container')
    );
  }

  private initPageTitleFormatMenu(): void {
    Object.values(PageTitleFormat).forEach((format) => {
      const label = getLocalizedString(`notero.pageTitleFormat.${format}`);
      const item = this.pageTitleFormatMenu.appendItem(label, format);
      if (format === this.pageTitleFormatMenu.value) {
        this.pageTitleFormatMenu.selectedItem = item;
      }
    });
    this.pageTitleFormatMenu.disabled = false;
  }

  public openReadme(): void {
    Zotero.launchURL('https://github.com/dvanoni/notero#readme');
  }
}

module.exports = {
  preferences: new Preferences(),
};
