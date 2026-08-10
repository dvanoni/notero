import React from 'react';
import ReactDOM from 'react-dom';
import type { createRoot } from 'react-dom/client';

import type { FluentMessageId } from '../../locale/fluent-types';
import type { CapacitiesAuthManager } from '../auth';
import {
  getCapacitiesClient,
  isCapacitiesUnauthorizedError,
} from '../sync/capacities-client';
import type { Structure } from '../sync/capacities-types';
import {
  createXULElement,
  getGlobalNotero,
  getLocalizedErrorMessage,
  getXULElementById,
  logger,
} from '../utils';

import { PAGE_TITLE_FORMAT_L10N_IDS, PageTitleFormat } from './notero-pref';
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
  private capacitiesAuthManager!: CapacitiesAuthManager;
  private capacitiesConnectButton!: XUL.ButtonElement;
  private capacitiesConnectionContainer!: XUL.XULElement;
  private capacitiesConnectionSpinner!: XUL.XULElement;
  private capacitiesDisconnectButton!: XUL.ButtonElement;
  private capacitiesCollectionMenu!: XUL.MenuListElement;
  private capacitiesError!: XUL.LabelElement;
  private capacitiesSpaceLabel!: XUL.LabelElement;
  private capacitiesStructureMenu!: XUL.MenuListElement;
  private capacitiesTokenContainer!: XUL.XULElement;
  private capacitiesTokenInput!: HTMLInputElement;
  private pageTitleFormatMenu!: XUL.MenuListElement;

  private structures: Structure[] = [];

  public async init(): Promise<void> {
    await Zotero.uiReadyPromise;

    this.capacitiesAuthManager = getGlobalNotero().capacitiesAuthManager;

    /* oxlint-disable typescript/no-non-null-assertion */
    this.capacitiesTokenContainer = getXULElementById(
      'notero-capacitiesToken-container',
    )!;
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    this.capacitiesTokenInput = document.getElementById(
      'notero-capacitiesToken',
    ) as HTMLInputElement;
    this.capacitiesConnectButton = getXULElementById(
      'notero-capacitiesConnect',
    )!;
    this.capacitiesConnectionSpinner = getXULElementById(
      'notero-capacitiesConnection-spinner',
    )!;
    this.capacitiesConnectionContainer = getXULElementById(
      'notero-capacitiesConnection-container',
    )!;
    this.capacitiesDisconnectButton = getXULElementById(
      'notero-capacitiesDisconnect',
    )!;
    this.capacitiesStructureMenu = getXULElementById(
      'notero-capacitiesStructure',
    )!;
    this.capacitiesCollectionMenu = getXULElementById(
      'notero-capacitiesCollection',
    )!;
    this.capacitiesError = getXULElementById('notero-capacitiesError')!;
    this.capacitiesSpaceLabel = getXULElementById('notero-capacitiesSpace')!;
    this.pageTitleFormatMenu = getXULElementById('notero-pageTitleFormat')!;
    /* oxlint-enable typescript/no-non-null-assertion */

    /* oxlint-disable typescript/no-misused-promises */
    this.capacitiesConnectButton.addEventListener(
      'command',
      this.connectCapacities,
    );
    this.capacitiesDisconnectButton.addEventListener(
      'command',
      this.disconnectCapacities,
    );
    /* oxlint-enable typescript/no-misused-promises */
    this.capacitiesStructureMenu.addEventListener(
      'command',
      this.handleStructureChange,
    );

    await this.initPageTitleFormatMenu();
    await this.initSyncConfigsTable();

    // Don't block window from loading while waiting for network responses
    setTimeout(() => {
      void this.refreshCapacitiesConnectionSection();
    }, 100);
  }

  private async showError(error: unknown): Promise<void> {
    this.capacitiesError.hidden = false;
    this.capacitiesError.value = await getLocalizedErrorMessage(
      error,
      document.l10n,
    );
  }

  private hideError(): void {
    this.capacitiesError.hidden = true;
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
    // oxlint-disable-next-line typescript/no-non-null-assertion
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

    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
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
    const { AddonManager } = ChromeUtils.importESModule(
      'resource://gre/modules/AddonManager.sys.mjs',
    );
    const addon = await AddonManager.getAddonByID(
      'better-bibtex@iris-advies.com',
    );
    return Boolean(addon?.isActive);
  }

  private async refreshCapacitiesConnectionSection(): Promise<void> {
    this.hideError();

    const connection = await this.capacitiesAuthManager.getConnection();

    if (!connection) {
      this.capacitiesTokenContainer.hidden = false;
      this.capacitiesConnectionContainer.hidden = true;
      return;
    }

    this.capacitiesConnectionSpinner.setAttribute('status', 'animate');
    this.capacitiesTokenContainer.hidden = true;

    try {
      const capacities = getCapacitiesClient(connection.apiToken, window);

      document.l10n.setArgs(this.capacitiesSpaceLabel, {
        'space-name': connection.spaceTitle,
      });

      this.structures = await capacities.getStructures();

      this.capacitiesConnectionContainer.hidden = false;
      this.capacitiesConnectionSpinner.removeAttribute('status');

      this.refreshStructureMenu();
      this.refreshCollectionMenu();
    } catch (error) {
      logger.error(error);

      this.capacitiesConnectionSpinner.removeAttribute('status');
      await this.showError(error);

      if (isCapacitiesUnauthorizedError(error)) {
        this.capacitiesTokenContainer.hidden = false;
      }
    }
  }

  private refreshStructureMenu(): void {
    const menuItems: MenuItem[] = this.structures.map((structure) => ({
      label: structure.title,
      value: structure.id,
    }));

    setMenuItems(this.capacitiesStructureMenu, menuItems);
    this.capacitiesStructureMenu.disabled = menuItems.length === 0;
  }

  private refreshCollectionMenu(): void {
    const selectedStructure = this.structures.find(
      (structure) => structure.id === this.capacitiesStructureMenu.value,
    );

    const menuItems: MenuItem[] = [
      { l10nId: 'notero-preferences-capacities-collection-default', value: '' },
      ...(selectedStructure?.collections.map((collection) => ({
        label: collection.title,
        value: collection.id,
      })) || []),
    ];

    setMenuItems(this.capacitiesCollectionMenu, menuItems);
    this.capacitiesCollectionMenu.disabled = !selectedStructure;
  }

  private handleStructureChange = (): void => {
    this.refreshCollectionMenu();
  };

  private connectCapacities = async (): Promise<void> => {
    const apiToken = this.capacitiesTokenInput.value.trim();
    if (!apiToken) return;

    this.hideError();
    this.capacitiesConnectButton.disabled = true;
    this.capacitiesConnectionSpinner.setAttribute('status', 'animate');

    try {
      await this.capacitiesAuthManager.connect(apiToken, window);
      this.capacitiesTokenInput.value = '';
      await this.refreshCapacitiesConnectionSection();
    } catch (error) {
      logger.error(error);
      this.capacitiesConnectionSpinner.removeAttribute('status');
      await this.showError(error);
    } finally {
      this.capacitiesConnectButton.disabled = false;
    }
  };

  private disconnectCapacities = async (): Promise<void> => {
    const dialogTitle =
      (await document.l10n.formatValue(
        'notero-preferences-capacities-disconnect-dialog-title',
      )) || 'Disconnect Capacities';
    const dialogText =
      (await document.l10n.formatValue(
        'notero-preferences-capacities-disconnect-dialog-text',
      )) || 'Disconnect space';

    const confirmed = Services.prompt.confirm(null, dialogTitle, dialogText);
    if (!confirmed) return;

    await this.capacitiesAuthManager.disconnect();

    await this.refreshCapacitiesConnectionSection();
  };
}

type WindowWithNoteroPreferences = typeof window & {
  Notero_Preferences: Preferences;
};

// oxlint-disable-next-line typescript/no-unsafe-type-assertion
(window as WindowWithNoteroPreferences).Notero_Preferences = new Preferences();
