import 'core-js/stable/string/trim-end';
import 'core-js/stable/string/trim-start';

import { chunkString, keyValue } from '../../utils';
import {
  Annotations,
  ChildBlock,
  ChildBlockType,
  isBlockType,
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

const TAGS_SUPPORTING_CHILDREN = new Set([
  'BLOCKQUOTE',
  'DIV',
  'P',
]) satisfies Set<HTMLElementTagName> as Set<string>;

const TAGS_WITHOUT_CHILDREN = new Set<HTMLElementTagName>([
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'PRE',
]);

function getMathExpression(element: Element): string | undefined {
  const { classList, tagName, textContent } = element;

  if (!(tagName === 'PRE' && textContent && classList.contains('math'))) return;

  const matches = /^\$\$((?:.|\n)+)\$\$$/.exec(textContent);

  return matches?.[1] || undefined;
}

// https://developers.notion.com/reference/request-limits#limits-for-property-values
const TEXT_CONTENT_MAX_LENGTH = 2000;

function buildBlock(element: Element): ChildBlock {
  if (TAGS_SUPPORTING_CHILDREN.has(element.nodeName)) {
    return buildBlockWithChildren(element as HTMLElement);
  }

  if (isBlockElement(element)) {
    return buildBlockWithoutChildren(element);
  }

  return buildParagraphBlock(element as HTMLElement);
}

function buildBlockWithChildren(element: HTMLElement): ChildBlock {
  const childResults = Array.from(element.childNodes)
    .map<ChildBlock | RichText | null>((node) => {
      if (isBlockElement(node)) return buildBlock(node);
      return trimRichText(buildRichText(node, true));
    })
    .filter((result): result is ChildBlock | RichText => {
      if (!result) return false;

      if (Array.isArray(result)) return result.length > 0;

      return true;
    });

  let rich_text: RichText = [];
  let children: ChildBlock[] | undefined = undefined;

  if (childResults.length) {
    const firstChild = childResults[0];

    if (isBlockType('paragraph', firstChild)) {
      rich_text = firstChild.paragraph.rich_text;
    } else if (Array.isArray(firstChild)) {
      rich_text = firstChild;
    }

    if (childResults.length > 1) {
      const remainingChildResults = childResults.slice(1);
      if (remainingChildResults.every((child) => Array.isArray(child))) {
        rich_text = (remainingChildResults as RichText).reduce(
          (combinedRichText, child) => combinedRichText.concat(child),
          rich_text
        );
      } else {
        children = remainingChildResults.map((child) => {
          if (Array.isArray(child)) {
            return { paragraph: { rich_text: child } };
          } else {
            return child;
          }
        });
      }
    }
  }

  // rich_text = trimRichText(rich_text);

  const color = getNotionColor(element);

  let block: ChildBlock;

  if (element.tagName === 'BLOCKQUOTE') {
    block = { quote: { rich_text } };
    if (children) block.quote.children = children;
    if (color) block.quote.color = color;
  } else {
    block = { paragraph: { rich_text } };
    if (children) block.paragraph.children = children;
    if (color) block.paragraph.color = color;
  }

  return block;
}

function buildBlockWithoutChildren(element: BlockElement): SupportedBlock {
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
  function updateContent(
    index: number,
    updater: (content: string) => string
  ): RichText {
    const richTextPart = richText[index];

    if (!('text' in richTextPart)) return [richTextPart];

    const content = updater(richTextPart.text.content);

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
    return updateContent(0, (content) => content.trim());
  }

  const first = updateContent(0, (content) => content.trimStart());
  const middle = richText.slice(1, -1);
  const last = updateContent(richText.length - 1, (content) =>
    content.trimEnd()
  );

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
