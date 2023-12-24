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

export function isTextNode(node: Node): node is Text {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
  return node.nodeType === NodeType.TEXT_NODE;
}

export function isHTMLElement(node: Node): node is HTMLElement {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
  return node.nodeType === NodeType.ELEMENT_NODE;
}

export function getRootElement(htmlString: string): Element | null {
  const domParser = getDOMParser();
  const { body } = domParser.parseFromString(htmlString, 'text/html');
  const containerDiv = body.querySelector('div[data-schema-version]');
  return containerDiv || body;
}
