import type { ChildBlock, RichText } from '../notion-types';

export type ContentResult = BlockResult | ListResult | RichTextResult;

export type BlockResult = {
  type: 'block';
  block: ChildBlock;
};

export type ListResult = {
  type: 'list';
  results: BlockResult[];
};

export type RichTextResult = {
  type: 'richText';
  richText: RichText;
};

export function blockResult(block: ChildBlock): BlockResult {
  return { block, type: 'block' };
}

export function listResult(results: BlockResult[]): ListResult {
  return { results, type: 'list' };
}

export function richTextResult(richText: RichText): RichTextResult {
  return { richText, type: 'richText' };
}

export function isBlockResult(result: ContentResult): result is BlockResult {
  return result.type === 'block';
}

export function isListResult(result: ContentResult): result is ListResult {
  return result.type === 'list';
}

export function isRichTextResult(
  result: ContentResult
): result is RichTextResult {
  return result.type === 'richText';
}
