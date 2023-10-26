import 'core-js/stable/string/trim-end';
import 'core-js/stable/string/trim-start';

import { keyValue } from '../../utils';
import {
  ChildBlock,
  ParagraphBlock,
  RichText,
  RichTextOptions,
  isBlockType,
} from '../notion-types';
import { buildRichText } from '../notion-utils';

import {
  BlockResult,
  ContentResult,
  ListResult,
  RichTextResult,
  blockResult,
  isBlockResult,
  isListResult,
  isRichTextResult,
  listResult,
  richTextResult,
} from './content-result';
import { getRootElement } from './dom-utils';
import {
  BlockElement,
  ListElement,
  ParentElement,
  ParsedNode,
  parseNode,
} from './parse-node';

export function convertHtmlToBlocks(htmlString: string): ChildBlock[] {
  const root = getRootElement(htmlString);
  if (!root) throw new Error('Failed to load HTML content');

  const result = convertNode(root);

  if (
    !result ||
    !isBlockResult(result) ||
    !isBlockType('paragraph', result.block)
  ) {
    throw new Error('Unexpected HTML content');
  }

  const { children, rich_text } = result.block.paragraph;

  return [
    ...(rich_text.length ? [paragraphBlock(rich_text)] : []),
    ...(children || []),
  ];
}

function convertNode(
  node: Node,
  options: RichTextOptions = {},
): ContentResult | undefined {
  const parsedNode = parseNode(node);

  if (!parsedNode) return;

  switch (parsedNode.type) {
    case 'block':
      return parsedNode.supportsChildren
        ? convertParentElement(parsedNode, options)
        : convertBlockElement(parsedNode, options);
    case 'list':
      return convertListElement(parsedNode, options);
    case 'math_block':
      return blockResult({ equation: { expression: parsedNode.expression } });
    default:
      return richTextResult(convertRichTextNode(parsedNode, options));
  }
}

function convertParentElement(
  { annotations, blockType, color, element }: ParentElement,
  options: RichTextOptions,
): BlockResult {
  const updatedOptions = {
    ...options,
    annotations: {
      ...options.annotations,
      ...annotations,
    },
  };

  let rich_text: RichText = [];
  let children: ChildBlock[] | undefined;

  convertChildNodes(element, updatedOptions).forEach((result) => {
    let childBlock: ChildBlock;

    if (isRichTextResult(result)) {
      const trimmedRichText = trimRichText(result.richText);
      if (!trimmedRichText.length) return;

      if (!children) {
        rich_text = [...rich_text, ...trimmedRichText];
        return;
      }
      childBlock = paragraphBlock(trimmedRichText);
    } else {
      childBlock = result.block;
    }

    if (
      !children &&
      !rich_text.length &&
      isBlockType('paragraph', childBlock)
    ) {
      rich_text = childBlock.paragraph.rich_text;
      children = childBlock.paragraph.children;
      return;
    }

    children = [...(children || []), childBlock];
  });

  return blockResult(
    keyValue(blockType, {
      rich_text,
      ...(children && { children }),
      ...(color && { color }),
    }),
  );
}

function convertBlockElement(
  { annotations, blockType, color, element }: BlockElement,
  options: RichTextOptions,
): BlockResult {
  const preserveWhitespace = blockType === 'code';

  const updatedOptions = {
    ...options,
    annotations: {
      ...options.annotations,
      ...annotations,
    },
    preserveWhitespace,
  };

  let rich_text = convertRichTextChildNodes(element, updatedOptions);

  if (!preserveWhitespace) {
    rich_text = trimRichText(rich_text);
  }

  if (blockType === 'code') {
    return blockResult(
      keyValue(blockType, { rich_text, language: 'plain text' }),
    );
  }

  return blockResult(
    keyValue(blockType, {
      rich_text,
      ...(color && { color }),
    }),
  );
}

function convertListElement(
  node: ListElement,
  options: RichTextOptions,
): ListResult {
  return listResult(
    Array.from(node.element.children)
      .map((element) => {
        const parsedChild = parseNode(element);

        if (
          parsedChild?.type === 'block' &&
          parsedChild.supportsChildren &&
          parsedChild.blockType.endsWith('list_item')
        ) {
          return convertParentElement(parsedChild, options);
        }
      })
      .filter(Boolean),
  );
}

function convertChildNodes(
  node: Node,
  options: RichTextOptions,
): (BlockResult | RichTextResult)[] {
  return Array.from(node.childNodes).reduce<(BlockResult | RichTextResult)[]>(
    (results, childNode) => {
      const result = convertNode(childNode, options);

      if (!result) return results;

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
    },
    [],
  );
}

function convertRichTextChildNodes(
  node: Node,
  options: RichTextOptions,
): RichText {
  return Array.from(node.childNodes).reduce<RichText>(
    (combinedRichText, childNode) => {
      const parsedNode = parseNode(childNode);

      if (!parsedNode) return combinedRichText;

      return [...combinedRichText, ...convertRichTextNode(parsedNode, options)];
    },
    [],
  );
}

function convertRichTextNode(
  node: ParsedNode,
  options: RichTextOptions,
): RichText {
  if (node.type === 'text') {
    return buildRichText(node.textContent, options);
  }

  if (node.type === 'br') {
    return buildRichText('\n', { ...options, preserveWhitespace: true });
  }

  if (node.type === 'inline_math') {
    return [{ equation: { expression: node.expression } }];
  }

  const updatedOptions = { ...options };

  if (node.type === 'rich_text') {
    updatedOptions.annotations = {
      ...options.annotations,
      ...node.annotations,
    };
    if (node.link) {
      updatedOptions.link = node.link;
    }
  }

  return convertRichTextChildNodes(node.element, updatedOptions);
}

function paragraphBlock(richText: RichText): ParagraphBlock {
  return { paragraph: { rich_text: richText } };
}

function trimRichText(richText: RichText): RichText {
  function updateContent(
    index: number,
    updater: (content: string) => string,
  ): RichText {
    const richTextPart = richText[index];

    if (!richTextPart) return [];

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
    content.trimEnd(),
  );

  return [...first, ...middle, ...last];
}
