import { chunkString, getDOMParser } from '../utils';

import type {
  Annotations,
  ChildBlock,
  ChildBlockType,
  Color,
  ParagraphBlock,
  RichText,
} from './notion-types';

type HTMLElementTagName = Uppercase<keyof HTMLElementTagNameMap>;

// https://developer.mozilla.org/en-US/docs/Web/HTML/Block-level_elements#elements
const TAG_BLOCK_TYPES = {
  BLOCKQUOTE: 'quote',
  DIV: 'paragraph',
  H1: 'heading_1',
  H2: 'heading_2',
  H3: 'heading_3',
  H4: 'heading_3',
  H5: 'heading_3',
  H6: 'heading_3',
  P: 'paragraph',
  PRE: 'code',
} as const satisfies Partial<Record<HTMLElementTagName, ChildBlockType>>;

type SupportedTagName = keyof typeof TAG_BLOCK_TYPES;

type SupportedBlockType =
  | (typeof TAG_BLOCK_TYPES)[SupportedTagName]
  | 'equation';

type SupportedBlock = Extract<ChildBlock, { type?: SupportedBlockType }>;

type BlockElement = HTMLElement & { tagName: SupportedTagName };

const TAG_ANNOTATIONS = {
  B: { bold: true },
  CODE: { code: true },
  EM: { italic: true },
  I: { italic: true },
  S: { strikethrough: true },
  STRONG: { bold: true },
  U: { underline: true },
} satisfies Partial<Record<HTMLElementTagName, Annotations>>;

function canAnnotateTag(
  tagName: string
): tagName is keyof typeof TAG_ANNOTATIONS {
  return tagName in TAG_ANNOTATIONS;
}

// https://www.zotero.org/support/note_templates#variables
const ZOTERO_COLORS: Record<string, Color> = {
  '#ffd400': 'yellow_background',
  '#ff6666': 'red_background',
  '#5fb236': 'green_background',
  '#2ea8e5': 'blue_background',
  '#a28ae5': 'purple_background',
  '255, 212, 0': 'yellow_background',
  '255, 102, 102': 'red_background',
  '95, 178, 54': 'green_background',
  '46, 168, 229': 'blue_background',
  '162, 138, 229': 'purple_background',
};

function getNotionColor(element: HTMLElement): Color {
  const { backgroundColor } = element.style;
  if (!backgroundColor) return undefined;

  const matches = backgroundColor.match(/^rgba?\((\d+,\s*\d+,\s*\d+)/);
  const rgb = matches?.[1];

  return (rgb && ZOTERO_COLORS[rgb]) || undefined;
}

function getAnnotations(element: HTMLElement): Annotations {
  const annotations: Annotations = {};

  const color = getNotionColor(element);

  if (color) {
    Object.assign(annotations, { color });
  }

  if (element.style.textDecoration === 'line-through') {
    Object.assign(annotations, { strikethrough: true });
  }

  if (canAnnotateTag(element.tagName)) {
    Object.assign(annotations, TAG_ANNOTATIONS[element.tagName]);
  }

  return Object.keys(annotations).length ? annotations : undefined;
}

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

function isTextNode(node: Node): boolean {
  return node.nodeType === NodeType.TEXT_NODE;
}

function isBlockElement(node: Node): node is BlockElement {
  return node.nodeName in TAG_BLOCK_TYPES;
}

function isHTMLElement(node: Node): node is HTMLElement {
  return node.nodeType === NodeType.ELEMENT_NODE;
}

function isHTMLAnchorElement(node: Node): node is HTMLAnchorElement {
  return node.nodeName === 'A';
}

function getMathExpression(element: Element): string | undefined {
  const { classList, tagName, textContent } = element;

  if (!(tagName === 'PRE' && textContent && classList.contains('math'))) return;

  const matches = /^\$\$((?:.|\n)+)\$\$$/.exec(textContent);

  return matches?.[1] || undefined;
}

// https://developers.notion.com/reference/request-limits#limits-for-property-values
const TEXT_CONTENT_MAX_LENGTH = 2000;

function getRootElement(htmlString: string): Element | null {
  const domParser = getDOMParser();
  const doc = domParser.parseFromString(htmlString, 'text/html');
  return doc.querySelector('body > div[data-schema-version]');
}

function buildBlock(element: Element): ChildBlock {
  // if (!element.hasChildNodes()) {
  if (isBlockElement(element)) return buildChildBlock(element);
  return buildParagraphBlock(element as HTMLElement);
  // }

  let richText: RichText = [];
  const childBlocks: ChildBlock[] = [];

  // Array.from(element.children).forEach((child) => {
  //   if (['DIV', 'P'].includes(child.tagName)) {
  //     childBlocks.push(this.buildParagraphBlock(child as HTMLElement));
  //   } else {
  //     richText = richText.concat(this.buildRichText(child as HTMLElement));
  //   }
  // });

  // element.childNodes.forEach((child) => this.buildBlock(child));
  element.childNodes.forEach((child) => {
    if (isBlockElement(child)) {
      childBlocks.push(buildChildBlock(child));
    } else if (isHTMLElement(child) || isTextNode(child)) {
      richText = richText.concat(buildRichText(child));
    }
  });

  const block: ParagraphBlock = { paragraph: { rich_text: richText } };

  if (childBlocks.length) block.paragraph.children = childBlocks;

  return block;
}

function buildChildBlock(element: BlockElement): SupportedBlock {
  const blockType = TAG_BLOCK_TYPES[element.tagName];
  const rich_text = buildRichText(element);

  const expression = getMathExpression(element);

  if (expression) return { equation: { expression } };

  switch (blockType) {
    case 'code':
      return { [blockType]: { rich_text, language: 'plain text' } };
    case 'heading_1':
      return { [blockType]: { rich_text } };
    case 'heading_2':
      return { [blockType]: { rich_text } };
    case 'heading_3':
      return { [blockType]: { rich_text } };
    case 'paragraph':
      return { [blockType]: { rich_text } };
    case 'quote':
      return { [blockType]: { rich_text } };
  }
}

function buildParagraphBlock(element: HTMLElement): ParagraphBlock {
  return {
    paragraph: {
      rich_text: buildRichText(element),
      color: getNotionColor(element),
    },
  };
}

function buildRichText(node: ChildNode): RichText {
  if (!node.textContent?.length) return [];

  if (!node.textContent.trim().length) return [{ text: { content: ' ' } }];

  const annotations = isHTMLElement(node) ? getAnnotations(node) : undefined;
  const link = isHTMLAnchorElement(node) ? { url: node.href } : undefined;

  return chunkString(node.textContent, TEXT_CONTENT_MAX_LENGTH).map(
    (content) => {
      const richText: RichText[number] = { text: { content } };
      if (link) richText.text.link = link;
      if (annotations) richText.annotations = annotations;
      return richText;
    }
  );
}

export function buildNoteBlocks(htmlString: string): ChildBlock[] {
  const root = getRootElement(htmlString);
  if (!root) throw new Error('Failed to load note content');

  return Array.from(root.children).map((child) => buildBlock(child));
}
