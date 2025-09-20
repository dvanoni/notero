import { FluentMessageId } from '../../locale/fluent-types';
import { createXULElement, logger } from '../utils';

import type { EventManager } from './event-manager';
import type { PreferencePaneManager } from './preference-pane-manager';
import type { Service, ServiceParams } from './service';

const FTL_FILE = 'notero.ftl';

export class UIManager implements Service {
  private pluginID!: string;
  private eventManager!: EventManager;
  private preferencePaneManager!: PreferencePaneManager;

  private managedWindows = new Map<Zotero.ZoteroWindow, Set<Element>>();

  public startup({
    dependencies,
    pluginInfo: { pluginID },
  }: ServiceParams<'eventManager' | 'preferencePaneManager'>) {
    this.pluginID = pluginID;
    this.eventManager = dependencies.eventManager;
    this.preferencePaneManager = dependencies.preferencePaneManager;

    Zotero.MenuManager.registerMenu({
      menuID: 'test',
      pluginID: this.pluginID,
      target: 'main/library/item',
      menus: [
        {
          menuType: 'menuitem',
          l10nID: 'menu-print',
          onShowing: (event, context) => {
            const enabled = Math.random() > 0.5;
            logger.log('setting enabled to', enabled);
            context.setEnabled(enabled);
          },
          onCommand: (event, context) => {
            logger.log('onCommand', event, context);
          },
        },
        {
          menuType: 'submenu',
          l10nID: 'menu-print',
          menus: [
            {
              menuType: 'menuitem',
              l10nID: 'menu-print',
              onShowing: (event, context) => {
                logger.log('onShowing submenu', event, context);
              },
              onCommand: (event, context) => {
                logger.log('onCommand submenu', event, context);
              },
            },
          ],
        },
      ],
    });

    // Zotero.MenuManager.registerMenu({
    //   menuID: 'notero-collection-menu',
    //   pluginID: this.pluginID,
    //   target: 'main/library/collection',
    //   menus: [
    //     {
    //       menuType: 'menuitem',
    //       // l10nID: 'notero-item-menu-sync',
    //       l10nID: 'menu-print',
    //       onShowing: (event, context) => {
    //         logger.log('onShowing', event, context);
    //       },
    //       onShown: (event, context) => {
    //         logger.log('onShown', event, context);
    //       },
    //       onHiding: (event, context) => {
    //         logger.log('onHiding', event, context);
    //       },
    //       onHidden: (event, context) => {
    //         logger.log('onHidden', event, context);
    //       },
    //       onCommand: (event, context) => {
    //         logger.log('onCommand', event, context);
    //       },
    //     },
    //   ],
    // });
  }

  public addToWindow(window: Zotero.ZoteroWindow) {
    this.initLocalization(window);
    this.initCollectionMenuItem(window);
    this.initItemMenuItem(window);
    this.initToolsMenuItem(window);
  }

  public removeFromWindow(window: Zotero.ZoteroWindow) {
    const managedElements = this.managedWindows.get(window);
    if (!managedElements) return;

    managedElements.forEach((element) => {
      element.remove();
    });
    this.managedWindows.delete(window);
  }

  private addManagedElement(window: Zotero.ZoteroWindow, element: Element) {
    const managedElements = this.managedWindows.get(window) ?? new Set();
    managedElements.add(element);
    this.managedWindows.set(window, managedElements);
  }

  private initLocalization(window: Zotero.ZoteroWindow) {
    window.MozXULElement.insertFTLIfNeeded(FTL_FILE);
    const l10nLink = window.document.querySelector(`[href="${FTL_FILE}"]`);
    if (l10nLink) {
      this.addManagedElement(window, l10nLink);
    }
  }

  private initCollectionMenuItem(window: Zotero.ZoteroWindow) {
    this.createMenuItem({
      window,
      l10nId: 'notero-collection-menu-sync',
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
    // this.createMenuItem({
    //   window,
    //   l10nId: 'notero-item-menu-sync',
    //   parentId: 'zotero-itemmenu',
    //   onCommand: () => {
    //     const items = Zotero.getActiveZoteroPane()?.getSelectedItems(false);
    //     if (items) {
    //       logger.groupCollapsed(
    //         `Request sync for ${items.length} item(s) with IDs`,
    //         items.map((item) => item.id),
    //       );
    //       logger.table(items, ['_id', '_displayTitle']);
    //       logger.groupEnd();
    //       this.eventManager.emit('request-sync-items', items);
    //     }
    //   },
    // });
  }

  private initToolsMenuItem(window: Zotero.ZoteroWindow) {
    this.createMenuItem({
      window,
      l10nId: 'notero-tools-menu-preferences',
      parentId: 'menu_ToolsPopup',
      onCommand: () => {
        this.preferencePaneManager.openPreferences();
      },
    });
  }

  private createMenuItem({
    l10nId,
    onCommand,
    parentId,
    window,
  }: {
    l10nId: FluentMessageId;
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
    window.document.l10n.setAttributes(menuItem, l10nId);
    menuItem.addEventListener('command', onCommand);

    menuItem = parentMenu.appendChild(menuItem);
    this.addManagedElement(window, menuItem);

    return menuItem;
  }
}
