import { IS_ZOTERO_7 } from '../constants';
import { createXULElement, getLocalizedString, log } from '../utils';

import { EventManager } from './event-manager';
import type { Service } from './service';

export class UIManager implements Service {
  private get window() {
    return Zotero.getMainWindow();
  }

  private get document() {
    return this.window.document;
  }

  private managedNodes = new Set<Node>();

  public startup() {
    this.initCollectionMenuItem();
    this.initItemMenuItem();
    if (!IS_ZOTERO_7) this.initToolsMenuItem();
  }

  public shutdown() {
    this.managedNodes.forEach((node) => node.parentNode?.removeChild(node));
    this.managedNodes.clear();
  }

  private initCollectionMenuItem() {
    this.createMenuItem({
      labelName: 'notero.collectionMenu.sync',
      parentId: 'zotero-collectionmenu',
      onCommand: () => {
        const collection =
          Zotero.getActiveZoteroPane()?.getSelectedCollection(false);
        if (collection) {
          EventManager.emit('request-sync-collection', collection);
        }
      },
    });
  }

  private initItemMenuItem() {
    this.createMenuItem({
      labelName: 'notero.itemMenu.sync',
      parentId: 'zotero-itemmenu',
      onCommand: () => {
        const items = Zotero.getActiveZoteroPane()?.getSelectedItems(false);
        if (items) {
          const topLevelItems = Zotero.Items.getTopLevel(items);
          EventManager.emit('request-sync-items', topLevelItems);
        }
      },
    });

    this.createMenuItem({
      labelName: 'notero.itemMenu.getNotes',
      parentId: 'zotero-itemmenu',
      onCommand: () => {
        const items = Zotero.getActiveZoteroPane()?.getSelectedItems(false);
        if (items) {
          // const topLevelItems = Zotero.Items.getTopLevel(items);
          // const item = topLevelItems[0];
          const item = items[0];
          if (item) {
            EventManager.emit('build-item-notes', item);
          }
        }
      },
    });
  }

  private initToolsMenuItem() {
    this.createMenuItem({
      labelName: 'notero.toolsMenu.preferences',
      parentId: 'menu_ToolsPopup',
      onCommand: () => {
        this.openPreferences();
      },
    });
  }

  private createMenuItem({
    labelName,
    onCommand,
    parentId,
  }: {
    labelName: string;
    onCommand: (event: Event) => void;
    parentId: string;
  }): XUL.MenuItemElement | null {
    let menuItem = createXULElement(this.document, 'menuitem');
    menuItem.setAttribute('label', getLocalizedString(labelName));
    menuItem.addEventListener('command', onCommand);

    const parentMenu = this.document.getElementById(parentId);
    if (!parentMenu) {
      log(`Failed to find element '${parentId}'`, 'error');
      return null;
    }

    menuItem = parentMenu.appendChild(menuItem);
    this.managedNodes.add(menuItem);

    return menuItem;
  }

  private openPreferences() {
    this.window.openDialog(
      'chrome://notero/content/prefs/preferences.xul',
      'notero-preferences'
    );
  }
}
