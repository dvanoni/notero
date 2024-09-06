import { createXULElement, getLocalizedString, logger } from '../utils';

import type { EventManager } from './event-manager';
import type { PreferencePaneManager } from './preference-pane-manager';
import type { Service, ServiceParams } from './service';

export class UIManager implements Service {
  private eventManager!: EventManager;
  private preferencePaneManager!: PreferencePaneManager;

  private managedWindows = new Map<Zotero.ZoteroWindow, Set<Node>>();

  public startup({
    dependencies,
  }: ServiceParams<'eventManager' | 'preferencePaneManager'>) {
    this.eventManager = dependencies.eventManager;
    this.preferencePaneManager = dependencies.preferencePaneManager;
  }

  public addToWindow(window: Zotero.ZoteroWindow) {
    this.initCollectionMenuItem(window);
    this.initItemMenuItem(window);
    this.initToolsMenuItem(window);
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
          logger.log('Request sync for collection:', collection.name);
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
          logger.groupCollapsed(
            `Request sync for ${items.length} item(s) with IDs`,
            items.map((item) => item.id),
          );
          logger.table(items, ['_id', '_displayTitle']);
          logger.groupEnd();
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
        this.preferencePaneManager.openPreferences();
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
    const parentMenu = window.document.getElementById(parentId);
    if (!parentMenu) {
      logger.error(`Failed to find element '${parentId}'`);
      return null;
    }

    let menuItem = createXULElement(window.document, 'menuitem');
    menuItem.setAttribute('label', getLocalizedString(labelName));
    menuItem.addEventListener('command', onCommand);

    menuItem = parentMenu.appendChild(menuItem);
    this.addManagedNode(window, menuItem);

    return menuItem;
  }
}
