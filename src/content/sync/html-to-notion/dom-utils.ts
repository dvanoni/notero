import { getDOMParser } from '../../utils';

export type HTMLElementTagName = Uppercase<keyof HTMLElementTagNameMap>;

/** https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType */
enum NodeType {
  ELEMENT_NODE = 1,
  ATTRIBUTE_NODE = 2,
  TEXT_NODE = 3,
  CDATA_SECTION_NODE = 4,
  PROCESSING_INSTRUCTION_NODE = 7,
  COMMENT_NODE = 8,
  DOCUMENT_NODE = 9,
  DOCUMENT_TYPE_NODE = 10,
  DOCUMENT_FRAGMENT_NODE = 11,
}

export function isTextNode(node: Node): boolean {
  return node.nodeType === NodeType.TEXT_NODE;
}

export function isHTMLElement(node: Node): node is HTMLElement {
  return node.nodeType === NodeType.ELEMENT_NODE;
}

export function isHTMLAnchorElement(node: Node): node is HTMLAnchorElement {
  return node.nodeName === 'A';
}

export function isHTMLBRElement(node: Node): node is HTMLBRElement {
  return node.nodeName === 'BR';
}

export function getRootElement(htmlString: string): Element | null {
  const domParser = getDOMParser();
  const doc = domParser.parseFromString(htmlString, 'text/html');
  return doc.querySelector('body > div[data-schema-version]');
}
