const HTML_NS = 'http://www.w3.org/1999/xhtml';

export function createHTMLElement<Name extends keyof HTMLElementTagNameMap>(
  doc: Document,
  name: Name
) {
  return doc.createElementNS(HTML_NS, name) as HTMLElementTagNameMap[Name];
}
