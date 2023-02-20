/**
 * @see https://www.xulplanet.com/references/elemref/
 * @see https://udn.realityripple.com/docs/Archive/Mozilla/XUL/XUL_Reference
 */
declare namespace XUL {
  interface ButtonElement extends XULElement {
    disabled: boolean;
  }

  interface CheckboxElement extends XULElement {
    checked: boolean;
  }

  type MenuItemElement = XULElement;

  interface MenuListElement extends XULElement {
    appendItem(
      label: string,
      value?: string,
      description?: string
    ): MenuItemElement;
    disabled: boolean;
    selectedIndex: number;
    selectedItem: MenuItemElement | null;
    value: string;
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

  type XULElement = Element;

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
