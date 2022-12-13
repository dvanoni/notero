const HTML_NS = 'http://www.w3.org/1999/xhtml';

export default function createHTMLElement(
  doc: Document,
  qualifiedName: string
) {
  return doc.createElementNS(HTML_NS, qualifiedName);
}
