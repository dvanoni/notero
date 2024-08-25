import { isFullDatabase } from '@notionhq/client';
import type { DatabaseObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import React from 'react';
// eslint-disable-next-line import/no-unresolved
import ReactDOM from 'react-dom';

import { getNotionClient } from '../sync/notion-client';
import { getLocalizedString, getXULElementById, logger } from '../utils';

import {
  NoteroPref,
  PageTitleFormat,
  getNoteroPref,
  registerNoteroPrefObserver,
  unregisterNoteroPrefObserver,
} from './notero-pref';
import { SyncConfigsTable } from './sync-configs-table';

type MenuItem = {
  disabled?: boolean;
  label: string;
  selected?: boolean;
  value?: string;
};

function setMenuItems(menuList: XUL.MenuListElement, items: MenuItem[]): void {
  menuList.removeAllItems();

  items.forEach(({ disabled, label, selected, value }) => {
    const item = menuList.appendItem(label, value);
    item.disabled = Boolean(disabled);
    if (selected) {
      menuList.selectedItem = item;
    }
  });
}

class Preferences {
  private notionDatabaseError!: XUL.DescriptionElement;
  private notionDatabaseMenu!: XUL.MenuListElement;
  private pageTitleFormatMenu!: XUL.MenuListElement;
  private prefObserverSymbol!: symbol;

  public async init(): Promise<void> {
    await Zotero.uiReadyPromise;

    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    this.notionDatabaseError = getXULElementById('notero-notionDatabaseError')!;
    this.notionDatabaseMenu = getXULElementById('notero-notionDatabase')!;
    this.pageTitleFormatMenu = getXULElementById('notero-pageTitleFormat')!;
    const syncConfigsTableContainer = document.getElementById(
      'notero-syncConfigsTable-container',
    )!;
    /* eslint-enable @typescript-eslint/no-non-null-assertion */

    this.prefObserverSymbol = registerNoteroPrefObserver(
      NoteroPref.notionToken,
      () => {
        void this.refreshNotionDatabaseMenu();
      },
    );

    window.addEventListener('unload', () => {
      this.deinit();
    });

    await this.initPageTitleFormatMenu();

    // Don't block window from loading while waiting for network response
    setTimeout(() => {
      void this.refreshNotionDatabaseMenu();
    }, 100);

    ReactDOM.render(
      <SyncConfigsTable container={syncConfigsTableContainer} />,
      syncConfigsTableContainer,
    );
  }

  private deinit(): void {
    unregisterNoteroPrefObserver(this.prefObserverSymbol);
  }

  private async initPageTitleFormatMenu(): Promise<void> {
    const isBetterBibTeXActive = await this.isBetterBibTeXActive();

    const menuItems = Object.values(PageTitleFormat).map<MenuItem>(
      (format) => ({
        disabled:
          format === PageTitleFormat.itemCitationKey && !isBetterBibTeXActive,
        label: getLocalizedString(`notero.pageTitleFormat.${format}`),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        selected: format === this.pageTitleFormatMenu.value,
        value: format,
      }),
    );

    setMenuItems(this.pageTitleFormatMenu, menuItems);
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

  private async refreshNotionDatabaseMenu(): Promise<void> {
    let menuItems: MenuItem[] = [];

    try {
      const databaseID = getNoteroPref(NoteroPref.notionDatabaseID);
      const databases = await this.retrieveNotionDatabases();

      menuItems = databases.map<MenuItem>((database) => {
        const idWithoutDashes = database.id.replace(/-/g, '');
        const title = database.title.map((t) => t.plain_text).join('');
        const icon =
          database.icon?.type === 'emoji' ? database.icon.emoji : null;

        return {
          label: icon ? `${icon} ${title}` : title,
          value: idWithoutDashes,
          selected: idWithoutDashes === databaseID,
        };
      });

      this.notionDatabaseMenu.disabled = false;
      this.notionDatabaseError.hidden = true;
    } catch (error) {
      this.notionDatabaseMenu.disabled = true;
      this.notionDatabaseError.hidden = false;
      this.notionDatabaseError.value =
        error instanceof Error ? error.message : String(error);
    }

    setMenuItems(this.notionDatabaseMenu, menuItems);
  }

  private async retrieveNotionDatabases(): Promise<DatabaseObjectResponse[]> {
    try {
      const notion = getNotionClient(window);

      const response = await notion.search({
        filter: { property: 'object', value: 'database' },
      });

      const databases = response.results.filter(isFullDatabase);

      if (databases.length === 0) {
        throw new Error('No databases are accessible');
      }

      return databases;
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }
}

module.exports = {
  preferences: new Preferences(),
};
