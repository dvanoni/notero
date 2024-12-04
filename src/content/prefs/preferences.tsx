import { APIErrorCode, type Client, isFullDatabase } from '@notionhq/client';
import type { DatabaseObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import React from 'react';
import ReactDOM from 'react-dom';
import type { createRoot } from 'react-dom/client';

import type { FluentMessageId } from '../../locale/fluent-types';
import type { NotionAuthManager } from '../auth';
import { LocalizableError } from '../errors';
import { getNotionClient } from '../sync/notion-client';
import { isNotionErrorWithCode, normalizeID } from '../sync/notion-utils';
import {
  createXULElement,
  getGlobalNotero,
  getLocalizedErrorMessage,
  getXULElementById,
  logger,
} from '../utils';

import {
  PAGE_TITLE_FORMAT_L10N_IDS,
  PageTitleFormat,
  unregisterNoteroPrefObserver,
} from './notero-pref';
import { SyncConfigsTable } from './sync-configs-table';

type ReactDOMClient = typeof ReactDOM & { createRoot: typeof createRoot };

type MenuItem = {
  disabled?: boolean;
  l10nId?: FluentMessageId;
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
  private notionAuthManager!: NotionAuthManager;
  private notionConnectionContainer!: XUL.XULElement;
  private notionConnectionSpinner!: XUL.XULElement;
  private notionConnectButton!: XUL.ButtonElement;
  private notionUpgradeConnectionButton!: XUL.ButtonElement;
  private notionDatabaseMenu!: XUL.MenuListElement;
  private notionError!: XUL.LabelElement;
  private notionWorkspaceLabel!: XUL.LabelElement;
  private pageTitleFormatMenu!: XUL.MenuListElement;
  private prefObserverSymbol!: symbol;

  public async init(): Promise<void> {
    await Zotero.uiReadyPromise;

    this.notionAuthManager = getGlobalNotero().notionAuthManager;

    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    this.notionConnectionContainer = getXULElementById(
      'notero-notionConnection-container',
    )!;
    this.notionConnectionSpinner = getXULElementById(
      'notero-notionConnection-spinner',
    )!;
    this.notionConnectButton = getXULElementById('notero-notionConnect')!;
    this.notionUpgradeConnectionButton = getXULElementById(
      'notero-notionUpgradeConnection',
    )!;
    this.notionWorkspaceLabel = getXULElementById('notero-notionWorkspace')!;
    this.notionDatabaseMenu = getXULElementById('notero-notionDatabase')!;
    this.notionError = getXULElementById('notero-notionError')!;
    this.pageTitleFormatMenu = getXULElementById('notero-pageTitleFormat')!;
    /* eslint-enable @typescript-eslint/no-non-null-assertion */

    window.addEventListener('unload', () => {
      this.deinit();
    });

    await this.initPageTitleFormatMenu();
    await this.initSyncConfigsTable();

    // Don't block window from loading while waiting for network responses
    setTimeout(() => {
      void this.refreshNotionConnectionSection();
    }, 100);
  }

  private deinit(): void {
    // TODO: Remove this
    unregisterNoteroPrefObserver(this.prefObserverSymbol);
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

  private async refreshNotionConnectionSection(): Promise<void> {
    const connection = await this.notionAuthManager.getFirstConnection();
    const legacyToken = this.notionAuthManager.getLegacyAuthToken();

    const authToken = connection?.access_token || legacyToken;

    this.notionError.hidden = true;

    if (!authToken) {
      this.notionConnectButton.hidden = false;
      this.notionConnectionContainer.hidden = true;
      return;
    }

    this.notionConnectionSpinner.setAttribute('status', 'animate');

    try {
      const notion = getNotionClient(window, authToken);

      const user = await notion.users.me({});
      const workspaceName =
        (user.type === 'bot' && user.bot.workspace_name) || 'Connected';

      document.l10n.setArgs(this.notionWorkspaceLabel, {
        'workspace-name': workspaceName,
      });

      this.notionConnectButton.hidden = true;
      this.notionUpgradeConnectionButton.hidden = Boolean(connection);
      this.notionConnectionContainer.hidden = false;
      this.notionConnectionSpinner.removeAttribute('status');

      await this.refreshNotionDatabaseMenu(notion);
    } catch (error) {
      logger.error(error);

      this.notionConnectionSpinner.removeAttribute('status');
      this.notionError.hidden = false;
      this.notionError.value = await getLocalizedErrorMessage(
        error,
        document.l10n,
      );

      if (isNotionErrorWithCode(error, APIErrorCode.Unauthorized)) {
        this.notionConnectButton.hidden = false;
      }
    }
  }

  private async refreshNotionDatabaseMenu(notion: Client): Promise<void> {
    let menuItems: MenuItem[] = [];

    this.notionDatabaseMenu.disabled = true;

    try {
      const databases = await this.retrieveNotionDatabases(notion);

      menuItems = databases.map<MenuItem>((database) => {
        const title = database.title.map((t) => t.plain_text).join('');
        const icon =
          database.icon?.type === 'emoji' ? database.icon.emoji : null;

        return {
          label: icon ? `${icon} ${title}` : title,
          value: normalizeID(database.id),
        };
      });

      this.notionDatabaseMenu.disabled = false;
    } finally {
      setMenuItems(this.notionDatabaseMenu, menuItems);
    }
  }

  private async retrieveNotionDatabases(
    notion: Client,
  ): Promise<DatabaseObjectResponse[]> {
    const response = await notion.search({
      filter: { property: 'object', value: 'database' },
    });

    const databases = response.results.filter(isFullDatabase);

    if (databases.length === 0) {
      throw new LocalizableError(
        'No Notion databases are accessible',
        'notero-error-no-notion-databases',
      );
    }

    return databases;
  }

  public async connectNotion(event: XUL.CommandEvent): Promise<void> {
    const button = event.target as XUL.ButtonElement;

    button.disabled = true;

    window.addEventListener(
      'blur',
      () => {
        button.disabled = false;
      },
      { once: true },
    );

    await this.notionAuthManager.openLogin();
  }

  public async disconnectNotion(): Promise<void> {
    const dialogTitle =
      (await document.l10n.formatValue(
        'notero-preferences-notion-disconnect-dialog-title',
      )) || 'Disconnect Notion Workspace';
    const dialogText =
      (await document.l10n.formatValue(
        'notero-preferences-notion-disconnect-dialog-text',
      )) || 'Disconnect workspace';

    const confirmed = Services.prompt.confirm(null, dialogTitle, dialogText);
    if (!confirmed) return;

    await this.notionAuthManager.removeAllConnections();

    await this.refreshNotionConnectionSection();
  }

  public async upgradeNotionConnection(event: XUL.CommandEvent): Promise<void> {
    const dialogTitle =
      (await document.l10n.formatValue(
        'notero-preferences-notion-upgrade-dialog-title',
      )) || 'Upgrade Notion Connection';
    const dialogText =
      (await document.l10n.formatValue(
        'notero-preferences-notion-upgrade-dialog-text',
      )) || 'Upgrade connection';

    const confirmed = Services.prompt.confirm(null, dialogTitle, dialogText);
    if (!confirmed) return;

    // Ensure window blur listener works as expected
    setTimeout(() => {
      void this.connectNotion(event);
    }, 100);
  }
}

module.exports = {
  preferences: new Preferences(),
};
