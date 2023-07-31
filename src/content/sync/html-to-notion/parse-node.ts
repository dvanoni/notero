import type { Annotations, BlockType, Color, TextLink } from '../notion-types';

import { getAnnotations } from './annotations';
import { isHTMLElement, isTextNode } from './dom-utils';

const BLOCKS_SUPPORTING_CHILDREN = new Set([
  'bulleted_list_item',
  'numbered_list_item',
  'paragraph',
  'quote',
]) satisfies Set<BlockType>;

type ParentBlockType = Parameters<
  (typeof BLOCKS_SUPPORTING_CHILDREN)['add']
>[0];

export type BlockElement = {
  annotations: Annotations;
  color: Color;
  element: HTMLElement;
  type: 'block';
} & (
  | {
      blockType: 'code' | 'heading_1' | 'heading_2' | 'heading_3';
      supportsChildren: false;
    }
  | {
      blockType: ParentBlockType;
      supportsChildren: true;
    }
);

export type ParentElement = Extract<BlockElement, { supportsChildren: true }>;

type BRElement = {
  type: 'br';
};

export type ListElement = {
  element: HTMLElement;
  type: 'list';
};

type MathElement = {
  blockType: 'equation';
  element: HTMLElement;
  expression: string;
  type: 'math';
};

type RichTextElement = {
  annotations: Annotations;
  element: HTMLElement;
  link?: TextLink;
  type: 'rich_text';
};

type TextNode = {
  textContent: Node['textContent'];
  type: 'text';
};

export type ParsedNode =
  | BlockElement
  | BRElement
  | ListElement
  | MathElement
  | RichTextElement
  | TextNode;

function doesBlockSupportChildren(
  blockType: BlockElement['blockType'],
): blockType is ParentBlockType {
  return BLOCKS_SUPPORTING_CHILDREN.has(blockType);
}

function parseAnchorElement(element: HTMLAnchorElement): RichTextElement {
  return {
    ...parseRichTextElement(element),
    link: { url: element.href },
  };
}

function parseBlockElement(
  element: HTMLElement,
  blockType: BlockElement['blockType'],
): BlockElement {
  const { color, ...annotations } = getAnnotations(element);

  return {
    ...(doesBlockSupportChildren(blockType)
      ? { blockType, supportsChildren: true }
      : { blockType, supportsChildren: false }),
    annotations,
    color,
    element,
    type: 'block',
  };
}

function parseListItemElement(element: HTMLElement): BlockElement {
  if (element.parentElement?.tagName === 'OL')
    return parseBlockElement(element, 'numbered_list_item');

  if (element.parentElement?.tagName === 'UL')
    return parseBlockElement(element, 'bulleted_list_item');

  return parseBlockElement(element, 'paragraph');
}

function parsePreElement(element: HTMLElement): ParsedNode {
  const { classList, textContent } = element;

  const isMathElement = textContent && classList.contains('math');

  if (isMathElement) {
    const matches = /^\$\$((?:.|\n)+)\$\$$/.exec(textContent);
    const expression = matches?.[1];

    if (expression) {
      return { blockType: 'equation', element, expression, type: 'math' };
    }
  }

  return parseBlockElement(element, 'code');
}

function parseRichTextElement(element: HTMLElement): RichTextElement {
  return {
    annotations: getAnnotations(element),
    element,
    type: 'rich_text',
  };
}

export function parseNode(node: Node): ParsedNode | undefined {
  if (isTextNode(node)) {
    return { textContent: node.textContent, type: 'text' };
  }
  if (!isHTMLElement(node)) {
    return undefined;
  }

  switch (node.tagName) {
    case 'A':
      return parseAnchorElement(node as HTMLAnchorElement);
    case 'BLOCKQUOTE':
      return parseBlockElement(node, 'quote');
    case 'BR':
      return { type: 'br' };
    case 'DIV':
    case 'P':
      return parseBlockElement(node, 'paragraph');
    case 'H1':
      return parseBlockElement(node, 'heading_1');
    case 'H2':
      return parseBlockElement(node, 'heading_2');
    case 'H3':
    case 'H4':
    case 'H5':
    case 'H6':
      return parseBlockElement(node, 'heading_3');
    case 'LI':
      return parseListItemElement(node);
    case 'OL':
    case 'UL':
      return { element: node, type: 'list' };
    case 'PRE':
      return parsePreElement(node);
    default:
      return parseRichTextElement(node);
  }
}
