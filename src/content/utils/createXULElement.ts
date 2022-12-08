const XUL_NS = 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';

export default function createXULElement(doc: Document, qualifiedName: string) {
  return doc.createElementNS(XUL_NS, qualifiedName);
}
