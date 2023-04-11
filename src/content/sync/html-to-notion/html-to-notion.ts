import 'core-js/stable/string/trim-end';
import 'core-js/stable/string/trim-start';

import { chunkString, keyValue } from '../../utils';
import {
  Annotations,
  ChildBlock,
  ChildBlockType,
  isBlockType,
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
  isHTMLListElement,
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

type MathElement = HTMLElement & { tagName: 'PRE'; textContent: string };

type RichTextOptions = {
  annotations?: Annotations;
  link?: TextLink;
  preserveWhitespace?: boolean;
};

type BlockResult = {
  type: 'block';
  block: ChildBlock;
};

type RichTextResult = {
  type: 'richText';
  richText: RichText;
};

type ListResult = {
  type: 'list';
  results: BlockResult[];
};

type ContentResult = BlockResult | RichTextResult | ListResult;

function blockResult(block: ChildBlock): BlockResult {
  return { block, type: 'block' };
}

function richTextResult(richText: RichText): RichTextResult {
  return { richText, type: 'richText' };
}

function listResult(results: BlockResult[]): ListResult {
  return { results, type: 'list' };
}

function isBlockResult(result: ContentResult): result is BlockResult {
  return result.type === 'block';
}

function isRichTextResult(result: ContentResult): result is RichTextResult {
  return result.type === 'richText';
}

function isListResult(result: ContentResult): result is ListResult {
  return result.type === 'list';
}

function isBlockElement(node: Node): node is BlockElement {
  return node.nodeName in TAG_BLOCK_TYPES;
}

function isMathElement(element: Element): element is MathElement {
  const { classList, tagName, textContent } = element;
  return (
    tagName === 'PRE' && Boolean(textContent) && classList.contains('math')
  );
}

const TAGS_SUPPORTING_CHILDREN = new Set([
  'BLOCKQUOTE',
  'DIV',
  'LI',
  'P',
]) satisfies Set<HTMLElementTagName>;

const TAGS_WITHOUT_CHILDREN = new Set([
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'PRE',
]) satisfies Set<HTMLElementTagName>;

function isNodeSupportingChildren(node: Node): node is HTMLElement {
  return TAGS_SUPPORTING_CHILDREN.has(node.nodeName);
}

function getMathExpression(element: Element): string | undefined {
  if (!isMathElement(element)) return;

  const matches = /^\$\$((?:.|\n)+)\$\$$/.exec(element.textContent);

  return matches?.[1] || undefined;
}

// https://developers.notion.com/reference/request-limits#limits-for-property-values
const TEXT_CONTENT_MAX_LENGTH = 2000;

function buildResult(node: Node, options: RichTextOptions = {}): ContentResult {
  if (isNodeSupportingChildren(node)) {
    return buildBlockWithChildren(node, options);
  }

  if (isHTMLListElement(node)) {
    const childResults = Array.from(node.children).map((element) =>
      buildBlockWithChildren(element as HTMLElement, options)
    );
    return listResult(childResults);
  }

  if (isBlockElement(node)) {
    return buildBlockWithoutChildren(node);
  }

  return richTextResult(buildRichText(node, options));
}

function buildBlockWithChildren(
  element: HTMLElement,
  options: RichTextOptions
): BlockResult {
  const { color, ...annotations } = getAnnotations(element);

  const updatedOptions = {
    ...options,
    annotations: { ...options.annotations, ...annotations },
  };

  // This needs to run a similar algorithm to buildRichText
  const childResults = Array.from(element.childNodes)
    .reduce<(BlockResult | RichTextResult)[]>((results, node) => {
      const result = buildResult(node, updatedOptions);

      if (isBlockResult(result)) return [...results, result];

      if (isListResult(result)) return [...results, ...result.results];

      const prevResult = results[results.length - 1];

      if (prevResult && isRichTextResult(prevResult)) {
        const concatResult = richTextResult([
          ...prevResult.richText,
          ...result.richText,
        ]);
        return [...results.slice(0, -1), concatResult];
      }

      return [...results, result];
    }, [])
    .reduce<(BlockResult | RichTextResult)[]>((results, result) => {
      if (isBlockResult(result)) return [...results, result];

      const richText = trimRichText(result.richText);

      if (!richText.length) return results;

      return [...results, richTextResult(richText)];
    }, []);

  let rich_text: RichText = [];
  let children: ChildBlock[] | undefined = undefined;

  if (childResults.length > 0) {
    const firstChild = childResults[0];

    if (isRichTextResult(firstChild)) {
      rich_text = firstChild.richText;
    } else if (isBlockType('paragraph', firstChild.block)) {
      rich_text = firstChild.block.paragraph.rich_text;
      children = firstChild.block.paragraph.children;
    } else {
      children = [firstChild.block];
    }

    let hasBlockResult = false;
    const remainingChildResults = childResults.slice(1);

    remainingChildResults.forEach((result) => {
      if (!hasBlockResult && isRichTextResult(result)) {
        rich_text = [...rich_text, ...result.richText];
        return;
      }

      const newChild = isBlockResult(result)
        ? result.block
        : { paragraph: { rich_text: result.richText } };

      children = [...(children || []), newChild];
      hasBlockResult = true;
    });
  }

  let blockType: ChildBlockType = 'paragraph';

  if (element.tagName === 'BLOCKQUOTE') {
    blockType = 'quote';
  } else if (element.tagName === 'LI') {
    const parentTagName = element.parentElement?.tagName;

    if (parentTagName === 'OL') blockType = 'numbered_list_item';
    if (parentTagName === 'UL') blockType = 'bulleted_list_item';
  }

  return blockResult(
    keyValue(blockType, {
      rich_text,
      ...(children && { children }),
      ...(color && { color }),
    })
  );
}

function buildBlockWithoutChildren(element: BlockElement): BlockResult {
  const expression = getMathExpression(element);

  if (expression) return blockResult({ equation: { expression } });

  const blockType = TAG_BLOCK_TYPES[element.tagName];
  const preserveWhitespace = blockType === 'code';

  let rich_text: RichText = buildRichText(element, { preserveWhitespace });

  if (!preserveWhitespace) {
    rich_text = trimRichText(rich_text);
  }

  if (blockType === 'code') {
    return blockResult(
      keyValue(blockType, { rich_text, language: 'plain text' })
    );
  }

  const color = getNotionColor(element);

  return blockResult(
    keyValue(blockType, {
      rich_text,
      ...(color && { color }),
    })
  );
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

function buildRichText(node: Node, options: RichTextOptions): RichTextText[] {
  if (isTextNode(node)) {
    return buildChunkedRichText(node.textContent, options);
  }

  if (isHTMLBRElement(node)) {
    return buildChunkedRichText('\n', { ...options, preserveWhitespace: true });
  }

  if (!isHTMLElement(node) || !node.hasChildNodes()) return [];

  const updatedOptions = {
    ...options,
    annotations: {
      ...options.annotations,
      ...getAnnotations(node),
    },
  };

  if (isHTMLAnchorElement(node)) {
    updatedOptions.link = { url: node.href };
  }

  return Array.from(node.childNodes).reduce<RichTextText[]>(
    (combinedRichText, childNode) =>
      combinedRichText.concat(buildRichText(childNode, updatedOptions)),
    []
  );
}

function buildChunkedRichText(
  textContent: string | null,
  { annotations, link, preserveWhitespace }: RichTextOptions
): RichTextText[] {
  if (!textContent?.length) return [];

  const text = preserveWhitespace
    ? textContent
    : collapseWhitespace(textContent);

  const hasAnnotations = Boolean(
    annotations && Object.keys(annotations).length
  );

  return chunkString(text, TEXT_CONTENT_MAX_LENGTH).map((content) => {
    const richText: RichTextText = { text: { content } };
    if (hasAnnotations) richText.annotations = annotations;
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

  return Array.from(root.children)
    .map((child) => buildResult(child))
    .reduce<ChildBlock[]>((blocks, result) => {
      if (isBlockResult(result)) return [...blocks, result.block];

      if (isListResult(result))
        return [...blocks, ...result.results.map(({ block }) => block)];

      return [...blocks, { paragraph: { rich_text: result.richText } }];
    }, []);
}
