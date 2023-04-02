import 'core-js/stable/string/trim-end';
import 'core-js/stable/string/trim-start';

import { chunkString, keyValue } from '../../utils';

import type {
  Annotations,
  ChildBlock,
  ChildBlockType,
  ParagraphBlock,
  RichText,
  RichTextText,
  TextLink,
} from '../notion-types';
import { getAnnotations, getNotionColor } from './annotations';
import {
  getRootElement,
  HTMLElementTagName,
  isHTMLAnchorElement,
  isHTMLBRElement,
  isHTMLElement,
  isTextNode,
} from './dom-utils';

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

function isBlockElement(node: Node): node is BlockElement {
  return node.nodeName in TAG_BLOCK_TYPES;
}

function getMathExpression(element: Element): string | undefined {
  const { classList, tagName, textContent } = element;

  if (!(tagName === 'PRE' && textContent && classList.contains('math'))) return;

  const matches = /^\$\$((?:.|\n)+)\$\$$/.exec(textContent);

  return matches?.[1] || undefined;
}

// https://developers.notion.com/reference/request-limits#limits-for-property-values
const TEXT_CONTENT_MAX_LENGTH = 2000;

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
      richText = richText.concat(buildRichText(child, true));
    }
  });

  const block: ParagraphBlock = { paragraph: { rich_text: richText } };

  if (childBlocks.length) block.paragraph.children = childBlocks;

  return block;
}

function buildChildBlock(element: BlockElement): SupportedBlock {
  const expression = getMathExpression(element);

  if (expression) return { equation: { expression } };

  const blockType = TAG_BLOCK_TYPES[element.tagName];
  const collapseText = blockType !== 'code';

  let rich_text: RichText = buildRichText(element, collapseText);

  if (collapseText) {
    rich_text = trimRichText(rich_text);
  }

  switch (blockType) {
    case 'code':
      return keyValue(blockType, { rich_text, language: 'plain text' });
    case 'heading_1':
    case 'heading_2':
    case 'heading_3':
    case 'paragraph':
    case 'quote': {
      const color = getNotionColor(element);
      return keyValue(blockType, {
        rich_text,
        ...(color ? { color } : undefined),
      });
    }
  }
}

function trimRichText(richText: RichText): RichText {
  function updateContent(index: number, updater: () => string): RichText {
    const richTextPart = richText[index];

    if (!('text' in richTextPart)) return [richTextPart];

    const content = updater.call(richTextPart.text.content);

    if (!content) return [];

    return [
      {
        ...richTextPart,
        text: { ...richTextPart.text, content },
      },
    ];
  }

  if (richText.length === 0) return richText;

  if (richText.length === 1) {
    return updateContent(0, String.prototype.trim);
  }

  const first = updateContent(0, String.prototype.trimStart);
  const middle = richText.slice(1, -1);
  const last = updateContent(richText.length - 1, String.prototype.trimEnd);

  return [...first, ...middle, ...last];
}

function buildParagraphBlock(element: HTMLElement): ParagraphBlock {
  return {
    paragraph: {
      rich_text: buildRichText(element, true),
      color: getNotionColor(element),
    },
  };
}

function buildRichText(
  node: ChildNode,
  collapse: boolean,
  inheritedAnnotations: Annotations = undefined,
  inheritedLink: TextLink = undefined
): RichTextText[] {
  if (isTextNode(node)) {
    return buildChunkedRichText(
      node.textContent,
      collapse,
      inheritedAnnotations,
      inheritedLink
    );
  }

  if (!isHTMLElement(node) || !node.hasChildNodes()) return [];

  if (isHTMLBRElement(node)) {
    return buildChunkedRichText(
      '\n',
      collapse,
      inheritedAnnotations,
      inheritedLink
    );
  }

  const currentAnnotations = getAnnotations(node);

  const annotations =
    currentAnnotations || inheritedAnnotations
      ? { ...currentAnnotations, ...inheritedAnnotations }
      : undefined;

  const link = isHTMLAnchorElement(node) ? { url: node.href } : inheritedLink;

  return Array.from(node.childNodes).reduce<RichTextText[]>(
    (combinedRichText, childNode) =>
      combinedRichText.concat(
        buildRichText(childNode, collapse, annotations, link)
      ),
    []
  );
}

function buildChunkedRichText(
  textContent: string | null,
  collapse: boolean,
  annotations: Annotations,
  link: TextLink
): RichTextText[] {
  if (!textContent?.length) return [];

  const text = collapse ? collapseWhitespace(textContent) : textContent;

  return chunkString(text, TEXT_CONTENT_MAX_LENGTH).map((content) => {
    const richText: RichTextText = { text: { content } };
    if (annotations) richText.annotations = annotations;
    if (link) richText.text.link = link;
    return richText;
  });
}

function collapseWhitespace(text: string): string {
  return text.replace(/[\s\n]+/g, ' ');
}

export function convertHtmlToBlocks(htmlString: string): ChildBlock[] {
  const root = getRootElement(htmlString);
  if (!root) throw new Error('Failed to load HTML content');

  return Array.from(root.children).map((child) => buildBlock(child));
}
