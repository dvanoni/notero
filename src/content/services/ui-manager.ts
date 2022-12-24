import { createXULElement, getLocalizedString } from '../utils';

import type { Service } from './service';

export default class UIManager implements Service {
  private get window() {
    return Zotero.getMainWindow();
  }

  private get document() {
    return this.window.document;
  }

  private managedNodes = new Set<Node>();

  public startup() {
    const menuItem = createXULElement(this.document, 'menuitem');
    menuItem.setAttribute(
      'label',
      getLocalizedString('notero.preferences.menuItem')
    );
    menuItem.addEventListener('command', () => {
      this.openPreferences();
    });
    const toolsMenu = this.document.getElementById('menu_ToolsPopup');
    if (toolsMenu) {
      const toolsMenuItem = toolsMenu.appendChild(menuItem);
      this.managedNodes.add(toolsMenuItem);
    }
  }

  public shutdown() {
    this.managedNodes.forEach((node) => node.parentNode?.removeChild(node));
    this.managedNodes.clear();
  }

  private openPreferences() {
    this.window.openDialog(
      'chrome://notero/content/preferences.xul',
      'notero-preferences'
    );
  }
}
