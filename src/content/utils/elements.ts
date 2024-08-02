const HTML_NS = 'http://www.w3.org/1999/xhtml';
const XUL_NS = 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';

export function createHTMLElement<Name extends keyof HTMLElementTagNameMap>(
  doc: Document,
  name: Name,
) {
  return doc.createElementNS(HTML_NS, name) as HTMLElementTagNameMap[Name];
}

export function createXULElement<Name extends keyof XUL.XULElementTagNameMap>(
  doc: Document,
  name: Name,
) {
  return doc.createElementNS(XUL_NS, name) as XUL.XULElementTagNameMap[Name];
}

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function getXULElementById<E extends XUL.XULElement>(
  id: string,
): E | null {
  return document.getElementById(id) as E | null;
}
