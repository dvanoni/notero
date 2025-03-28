import type { FluentMessageId } from '../../locale/fluent-types';
const HTML_NS = 'http://www.w3.org/1999/xhtml';
const XUL_NS = 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';

export function createHTMLElement<N extends keyof HTMLElementTagNameMap>(
  doc: Document,
  name: N,
) {
  return doc.createElementNS(HTML_NS, name) as HTMLElementTagNameMap[N];
}

export function createXULElement<N extends keyof XUL.XULElementTagNameMap>(
  doc: Document,
  name: N,
) {
  return doc.createElementNS(XUL_NS, name) as XUL.XULElementTagNameMap[N];
}

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function getXULElementById<E extends XUL.XULElement>(
  id: string,
): E | null {
  return document.getElementById(id) as E | null;
}

export function isXULElement(target: EventTarget): target is XUL.XULElement {
  return 'namespaceURI' in target && target.namespaceURI === XUL_NS;
}

export function isXULElementOfType<N extends keyof XUL.XULElementTagNameMap>(
  target: EventTarget,
  name: N,
): target is XUL.XULElementTagNameMap[N] {
  return isXULElement(target) && target.tagName === name;
}
export type MenuItem = {
  disabled?: boolean;
  l10nId?: FluentMessageId;
  label?: string;
  value: string;
};

export function setMenuItems(
  menuList: XUL.MenuListElement,
  items: MenuItem[],
): void {
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
