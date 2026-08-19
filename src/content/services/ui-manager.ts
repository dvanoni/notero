import { getNotionURL } from '../data/item-data';
import { normalizeURL } from '../sync/notion-utils';
import { logger } from '../utils';

import type { EventManager } from './event-manager';
import type { PreferencePaneManager } from './preference-pane-manager';
import type { Service, ServiceParams } from './service';

const FTL_FILE = 'notero.ftl';

function isSingleItem(items: Zotero.Item[]): items is [Zotero.Item] {
  return items.length === 1 && Boolean(items[0]);
}

function isSingleRegularItemOrNote(
  items: Zotero.Item[],
): items is [Zotero.Item] {
  return isSingleItem(items) && (items[0].isRegularItem() || items[0].isNote());
}

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

    this.registerCollectionMenu();
    this.registerItemMenu();
    this.registerToolsMenu();
  }

  public addToWindow(window: Zotero.ZoteroWindow) {
    this.initLocalization(window);
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

  private registerCollectionMenu() {
    Zotero.MenuManager.registerMenu({
      menuID: 'notero-collection-menu',
      pluginID: this.pluginID,
      target: 'main/library/collection',
      menus: [
        {
          menuType: 'menuitem',
          l10nID: 'notero-collection-menu-sync',
          onShowing: (event, context) => {
            const anyCollectionSelected = context.collectionTreeRows.some(
              (row) => row.isCollection(),
            );
            context.setVisible(anyCollectionSelected);
          },
          onCommand: (event, context) => {
            context.collectionTreeRows
              .filter(
                (row): row is Zotero.CollectionTreeRow<Zotero.Collection> =>
                  row.isCollection(),
              )
              .forEach(({ ref: collection }) => {
                logger.log('Request sync for collection:', collection.name);
                this.eventManager.emit('request-sync-collection', collection);
              });
          },
        },
      ],
    });
  }

  private registerItemMenu() {
    Zotero.MenuManager.registerMenu({
      menuID: 'notero-item-menu',
      pluginID: this.pluginID,
      target: 'main/library/item',
      menus: [
        {
          menuType: 'menuitem',
          l10nID: 'notero-item-menu-sync',
          onCommand: (event, context) => {
            logger.groupCollapsed(
              `Request sync for ${context.items.length} item(s) with IDs`,
              context.items.map((item) => item.id),
            );
            logger.table(context.items, ['_id', '_displayTitle']);
            logger.groupEnd();
            this.eventManager.emit('request-sync-items', context.items);
          },
        },
        {
          menuType: 'menuitem',
          l10nID: 'notero-item-menu-open',
          onShowing: (event, context) => {
            if (!isSingleRegularItemOrNote(context.items)) {
              context.setVisible(false);
              return;
            }
            context.setVisible(true);
            const hasNotionURL = Boolean(getNotionURL(context.items[0]));
            context.setEnabled(hasNotionURL);
          },
          onCommand: (event, context) => {
            if (!isSingleRegularItemOrNote(context.items)) return;
            const notionURL = getNotionURL(context.items[0]);
            if (notionURL) {
              Zotero.launchURL(normalizeURL(notionURL));
            }
          },
        },
      ],
    });
  }

  private registerToolsMenu() {
    Zotero.MenuManager.registerMenu({
      menuID: 'notero-tools-menu',
      pluginID: this.pluginID,
      target: 'main/menubar/tools',
      menus: [
        {
          menuType: 'menuitem',
          l10nID: 'notero-tools-menu-preferences',
          onCommand: () => {
            this.preferencePaneManager.openPreferences();
          },
        },
      ],
    });
  }
}
