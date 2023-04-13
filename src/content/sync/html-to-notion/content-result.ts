import type { ChildBlock, RichText } from '../notion-types';

export type ContentResult = BlockResult | ListResult | RichTextResult;

export type BlockResult = {
  type: 'block';
  block: ChildBlock;
  indent: string | undefined;
};

export type ListResult = {
  type: 'list';
  results: BlockResult[];
};

export type RichTextResult = {
  type: 'rich_text';
  richText: RichText;
};

export function blockResult(block: ChildBlock, indent?: string): BlockResult {
  return { block, type: 'block', indent };
}

export function listResult(results: BlockResult[]): ListResult {
  return { results, type: 'list' };
}

export function richTextResult(richText: RichText): RichTextResult {
  return { richText, type: 'rich_text' };
}

export function isBlockResult(result: ContentResult): result is BlockResult {
  return result.type === 'block';
}

export function isListResult(result: ContentResult): result is ListResult {
  return result.type === 'list';
}

export function isRichTextResult(
  result: ContentResult,
): result is RichTextResult {
  return result.type === 'rich_text';
}
