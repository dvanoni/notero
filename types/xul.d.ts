/**
 * @see https://www.xulplanet.com/references/elemref/
 * @see https://udn.realityripple.com/docs/Archive/Mozilla/XUL/XUL_Reference
 * @see https://udn.realityripple.com/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIDOMXULElement
 */
declare namespace XUL {
  interface ButtonElement extends XULElement {
    disabled: boolean;
    image: string;
  }

  interface CheckboxElement extends XULElement {
    checked: boolean;
  }

  interface DescriptionElement extends XULElement {
    value: string;
  }

  interface MenuItemElement extends XULElement {
    disabled: boolean;
    label: string;
    value: string;
  }

  interface MenuListElement extends XULElement {
    appendItem(
      label: string,
      value?: string,
      description?: string,
    ): MenuItemElement;
    disabled: boolean;
    readonly menupopup: MenuPopupElement;
    removeAllItems(): void;
    selectedIndex: number;
    selectedItem: MenuItemElement | null;
    value: string;
  }

  type MenuPopupElement = XULElement;

  /**
   * @see https://searchfox.org/mozilla-esr115/source/toolkit/content/customElements.js
   */
  interface MozXULElement extends XULElement {
    insertFTLIfNeeded(path: string): void;
  }

  interface PreferenceElement extends XULElement {
    value: unknown;
  }

  interface TextboxElement extends XULElement {
    value: string;
  }

  interface TreeElement extends XULElement {
    disabled: boolean;
    treeBoxObject: XPCOM.nsITreeBoxObject;
    view?: XPCOM.nsITreeView;
  }

  interface XULElement extends Element {
    hidden: boolean;
  }

  type XULElementTagNameMap = {
    button: ButtonElement;
    checkbox: CheckboxElement;
    menuitem: MenuItemElement;
    menulist: MenuListElement;
    preference: PreferenceElement;
    textbox: TextboxElement;
    tree: TreeElement;
  };
}
