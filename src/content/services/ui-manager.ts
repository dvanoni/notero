import { IS_ZOTERO_7 } from '../constants';
import { createXULElement, getLocalizedString, log } from '../utils';

import type { EventManager } from './event-manager';
import type { Service, ServiceParams } from './service';

export class UIManager implements Service {
  private eventManager!: EventManager;

  private managedWindows = new Map<Zotero.ZoteroWindow, Set<Node>>();

  public startup({ dependencies: { eventManager } }: ServiceParams) {
    this.eventManager = eventManager;
  }

  public addToWindow(window: Zotero.ZoteroWindow) {
    this.initCollectionMenuItem(window);
    this.initItemMenuItem(window);
    if (!IS_ZOTERO_7) this.initToolsMenuItem(window);
  }

  public removeFromWindow(window: Zotero.ZoteroWindow) {
    const managedNodes = this.managedWindows.get(window);
    if (!managedNodes) return;

    managedNodes.forEach((node) => node.parentNode?.removeChild(node));
    this.managedWindows.delete(window);
  }

  private addManagedNode(window: Zotero.ZoteroWindow, node: Node) {
    const managedNodes = this.managedWindows.get(window) ?? new Set();
    managedNodes.add(node);
    this.managedWindows.set(window, managedNodes);
  }

  private initCollectionMenuItem(window: Zotero.ZoteroWindow) {
    this.createMenuItem({
      window,
      labelName: 'notero.collectionMenu.sync',
      parentId: 'zotero-collectionmenu',
      onCommand: () => {
        const collection =
          Zotero.getActiveZoteroPane()?.getSelectedCollection(false);
        if (collection) {
          this.eventManager.emit('request-sync-collection', collection);
        }
      },
    });
  }

  private initItemMenuItem(window: Zotero.ZoteroWindow) {
    this.createMenuItem({
      window,
      labelName: 'notero.itemMenu.sync',
      parentId: 'zotero-itemmenu',
      onCommand: () => {
        const items = Zotero.getActiveZoteroPane()?.getSelectedItems(false);
        if (items) {
          this.eventManager.emit('request-sync-items', items);
        }
      },
    });
  }

  private initToolsMenuItem(window: Zotero.ZoteroWindow) {
    this.createMenuItem({
      window,
      labelName: 'notero.toolsMenu.preferences',
      parentId: 'menu_ToolsPopup',
      onCommand: () => {
        this.openPreferences(window);
      },
    });
  }

  private createMenuItem({
    labelName,
    onCommand,
    parentId,
    window,
  }: {
    labelName: string;
    onCommand: (event: Event) => void;
    parentId: string;
    window: Zotero.ZoteroWindow;
  }): XUL.MenuItemElement | null {
    let menuItem = createXULElement(window.document, 'menuitem');
    menuItem.setAttribute('label', getLocalizedString(labelName));
    menuItem.addEventListener('command', onCommand);

    const parentMenu = window.document.getElementById(parentId);
    if (!parentMenu) {
      log(`Failed to find element '${parentId}'`, 'error');
      return null;
    }

    menuItem = parentMenu.appendChild(menuItem);
    this.addManagedNode(window, menuItem);

    return menuItem;
  }

  private openPreferences(window: Zotero.ZoteroWindow) {
    window.openDialog(
      'chrome://notero/content/prefs/preferences.xul',
      'notero-preferences',
    );
  }
}
