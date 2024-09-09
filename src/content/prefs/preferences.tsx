import { isFullDatabase } from '@notionhq/client';
import type { DatabaseObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import React from 'react';
import ReactDOM from 'react-dom';
import type { createRoot } from 'react-dom/client';

import { getNotionClient } from '../sync/notion-client';
import {
  createXULElement,
  getLocalizedErrorMessage,
  getXULElementById,
  logger,
} from '../utils';

import {
  NoteroPref,
  PAGE_TITLE_FORMAT_L10N_IDS,
  PageTitleFormat,
  registerNoteroPrefObserver,
  unregisterNoteroPrefObserver,
} from './notero-pref';
import { SyncConfigsTable } from './sync-configs-table';

type ReactDOMClient = typeof ReactDOM & { createRoot: typeof createRoot };

type MenuItem = {
  disabled?: boolean;
  l10nId?: string;
  label?: string;
  value: string;
};

function setMenuItems(menuList: XUL.MenuListElement, items: MenuItem[]): void {
  menuList.menupopup.replaceChildren();

  items.forEach(({ disabled, l10nId, label, value }) => {
    const item = createXULElement(document, 'menuitem');
    item.value = value;
    item.disabled = Boolean(disabled);
    if (l10nId) {
      document.l10n.setAttributes(item, l10nId);
    } else {
      item.label = label || value;
    }
    menuList.menupopup.append(item);
  });
}

class Preferences {
  private notionDatabaseError!: XUL.DescriptionElement;
  private notionDatabaseMenu!: XUL.MenuListElement;
  private notionTokenInput!: HTMLInputElement;
  private pageTitleFormatMenu!: XUL.MenuListElement;
  private prefObserverSymbol!: symbol;

  public async init(): Promise<void> {
    await Zotero.uiReadyPromise;

    this.notionTokenInput = document.getElementById(
      'notero-notionToken',
    ) as HTMLInputElement;
    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    this.notionDatabaseError = getXULElementById('notero-notionDatabaseError')!;
    this.notionDatabaseMenu = getXULElementById('notero-notionDatabase')!;
    this.pageTitleFormatMenu = getXULElementById('notero-pageTitleFormat')!;
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

    this.initNotionTokenInput();
    await this.initPageTitleFormatMenu();
    await this.initSyncConfigsTable();

    // Don't block window from loading while waiting for network response
    setTimeout(() => {
      void this.refreshNotionDatabaseMenu();
    }, 100);
  }

  private deinit(): void {
    unregisterNoteroPrefObserver(this.prefObserverSymbol);
  }

  private initNotionTokenInput(): void {
    const clickListener = (event: MouseEvent) => {
      if (!this.notionTokenInput.contains(event.target as Node)) {
        this.notionTokenInput.blur();
      }
    };

    this.notionTokenInput.addEventListener('blur', () => {
      this.notionTokenInput.type = 'password';
      document.removeEventListener('click', clickListener);
    });
    this.notionTokenInput.addEventListener('focus', () => {
      this.notionTokenInput.type = 'text';
      document.addEventListener('click', clickListener);
    });
  }

  private async initPageTitleFormatMenu(): Promise<void> {
    const isBetterBibTeXActive = await this.isBetterBibTeXActive();

    const menuItems = Object.values(PageTitleFormat).map<MenuItem>(
      (format) => ({
        disabled:
          format === PageTitleFormat.itemCitationKey && !isBetterBibTeXActive,
        l10nId: PAGE_TITLE_FORMAT_L10N_IDS[format],
        value: format,
      }),
    );

    setMenuItems(this.pageTitleFormatMenu, menuItems);
    this.pageTitleFormatMenu.disabled = false;
  }

  private async initSyncConfigsTable(): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const syncConfigsTableContainer = document.getElementById(
      'notero-syncConfigsTable-container',
    )!;
    const collection = await document.l10n.formatValue(
      'notero-preferences-collection-column',
    );
    const syncEnabled = await document.l10n.formatValue(
      'notero-preferences-sync-enabled-column',
    );
    const columnLabels = {
      collectionFullName: collection || 'Collection',
      syncEnabled: syncEnabled || 'Sync Enabled',
    };

    (ReactDOM as ReactDOMClient)
      .createRoot(syncConfigsTableContainer)
      .render(
        <SyncConfigsTable
          columnLabels={columnLabels}
          container={syncConfigsTableContainer}
        />,
      );
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

    this.notionDatabaseMenu.disabled = true;
    this.notionDatabaseError.hidden = true;

    try {
      const databases = await this.retrieveNotionDatabases();

      menuItems = databases.map<MenuItem>((database) => {
        const idWithoutDashes = database.id.replace(/-/g, '');
        const title = database.title.map((t) => t.plain_text).join('');
        const icon =
          database.icon?.type === 'emoji' ? database.icon.emoji : null;

        return {
          label: icon ? `${icon} ${title}` : title,
          value: idWithoutDashes,
        };
      });

      this.notionDatabaseMenu.disabled = false;
    } catch (error) {
      this.notionDatabaseMenu.disabled = true;
      this.notionDatabaseError.hidden = false;
      this.notionDatabaseError.value = await getLocalizedErrorMessage(
        error,
        document.l10n,
      );
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
