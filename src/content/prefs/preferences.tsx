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

    await this.initPageTitleFormatMenu();

    ReactDOM.render(
      <SyncConfigsTable />,
      document.getElementById('notero-syncConfigsTable-container'),
    );
  }

  private async initPageTitleFormatMenu(): Promise<void> {
    const isBetterBibTeXActive = await this.isBetterBibTeXActive();

    Object.values(PageTitleFormat).forEach((format) => {
      const label = getLocalizedString(`notero.pageTitleFormat.${format}`);
      const item = this.pageTitleFormatMenu.appendItem(label, format);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
      if (format === this.pageTitleFormatMenu.value) {
        this.pageTitleFormatMenu.selectedItem = item;
      }
      if (format === PageTitleFormat.itemCitationKey) {
        item.disabled = !isBetterBibTeXActive;
      }
    });

    this.pageTitleFormatMenu.disabled = false;
  }

  private async isBetterBibTeXActive(): Promise<boolean> {
    const { AddonManager } = ChromeUtils.import(
      'resource://gre/modules/AddonManager.jsm',
    );
    const addon = await AddonManager.getAddonByID(
      'better-bibtex@iris-advies.com',
    );
    return Boolean(addon?.isActive);
  }

  public openReadme(): void {
    Zotero.launchURL('https://github.com/dvanoni/notero#readme');
  }
}

module.exports = {
  preferences: new Preferences(),
};
