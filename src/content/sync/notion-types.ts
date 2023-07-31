import { BlockObjectRequest } from '@notionhq/client/build/src/api-endpoints';

export type BlockType = NonNullable<BlockObjectRequest['type']>;

export type Block<T extends BlockType> = Extract<
  BlockObjectRequest,
  { type?: T }
>;

export type ParagraphBlock = Block<'paragraph'>;

export type ChildBlock = NonNullable<
  ParagraphBlock['paragraph']['children']
>[number];

export type ChildBlockType = NonNullable<ChildBlock['type']>;

export type Color = ParagraphBlock['paragraph']['color'];

export type RichText = ParagraphBlock['paragraph']['rich_text'];

export type RichTextText = Extract<RichText[number], { type?: 'text' }>;

export type Annotations = RichTextText['annotations'];

export type TextLink = RichTextText['text']['link'];

export function isBlockType<T extends BlockType>(
  type: T,
  value: object,
): value is Block<T> {
  return type in value;
}
