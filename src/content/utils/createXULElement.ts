const XUL_NS = 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';

export function createXULElement<Name extends keyof XUL.XULElementTagNameMap>(
  doc: Document,
  name: Name
) {
  return doc.createElementNS(XUL_NS, name) as XUL.XULElementTagNameMap[Name];
}
