import { chunkString, getDOMParser } from '../utils';

import type {
  Annotations,
  ChildBlock,
  ChildBlockType,
  Color,
  ParagraphBlock,
  RichText,
  RichTextText,
  TextLink,
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
  '255, 32, 32': 'red', // #ff2020
  '255, 119, 0': 'orange', // #ff7700
  '255, 203, 0': 'yellow', // #ffcb00
  '78, 179, 28': 'green', // #4eb31c
  '5, 162, 239': 'blue', // #05a2ef
  '121, 83, 227': 'purple', // #7953e3
  '235, 82, 247': 'pink', // #eb52f7
  '126, 131, 134': 'gray', // #7e8386
  '255, 102, 102': 'red_background', // #ff6666
  '241, 152, 55': 'orange_background', // #f19837
  '255, 212, 0': 'yellow_background', // #ffd400
  '95, 178, 54': 'green_background', // #5fb236
  '46, 168, 229': 'blue_background', // #2ea8e5
  '162, 138, 229': 'purple_background', // #a28ae5
  '229, 110, 238': 'pink_background', // #e56eee
  '170, 170, 170': 'gray_background', // #aaaaaa
};

function getNotionColorFromString(color: string): Color {
  if (!color) return;

  const matches = color.match(/^rgba?\((\d+,\s*\d+,\s*\d+)/);
  const rgb = matches?.[1];

  return (rgb && ZOTERO_COLORS[rgb]) || undefined;
}

function getNotionColor(element: HTMLElement): Color {
  return (
    getNotionColorFromString(element.style.backgroundColor) ||
    getNotionColorFromString(element.style.color)
  );
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

function isHTMLBRElement(node: Node): node is HTMLBRElement {
  return node.nodeName === 'BR';
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

function buildRichText(
  node: ChildNode,
  inheritedAnnotations: Annotations = undefined,
  inheritedLink: TextLink = undefined
): RichTextText[] {
  if (isTextNode(node)) {
    return buildChunkedRichText(
      node.textContent,
      inheritedAnnotations,
      inheritedLink
    );
  }

  if (!isHTMLElement(node) || !node.hasChildNodes()) return [];

  if (isHTMLBRElement(node)) {
    return buildChunkedRichText('\n', inheritedAnnotations, inheritedLink);
  }

  const currentAnnotations = getAnnotations(node);

  const annotations =
    currentAnnotations || inheritedAnnotations
      ? { ...currentAnnotations, ...inheritedAnnotations }
      : undefined;

  const link = isHTMLAnchorElement(node) ? { url: node.href } : inheritedLink;

  const richText = Array.from(node.childNodes).reduce<RichTextText[]>(
    (combinedRichText, childNode) =>
      combinedRichText.concat(buildRichText(childNode, annotations, link)),
    []
  );

  const plainText = richText.reduce(
    (allText, { text }) => allText + text.content,
    ''
  );

  return plainText.trim().length ? richText : [];
}

function buildChunkedRichText(
  textContent: string | null,
  annotations: Annotations = undefined,
  link: TextLink = undefined
): RichTextText[] {
  if (!textContent?.length) return [];

  return chunkString(textContent, TEXT_CONTENT_MAX_LENGTH).map((content) => {
    const richText: RichText[number] = { text: { content } };
    if (annotations) richText.annotations = annotations;
    if (link) richText.text.link = link;
    return richText;
  });
}

export function buildNoteBlocks(htmlString: string): ChildBlock[] {
  const root = getRootElement(htmlString);
  if (!root) throw new Error('Failed to load note content');

  return Array.from(root.children).map((child) => buildBlock(child));
}
