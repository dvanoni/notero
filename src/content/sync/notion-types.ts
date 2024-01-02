import type {
  BlockObjectRequest,
  CreatePageParameters,
  GetDatabaseResponse,
} from '@notionhq/client/build/src/api-endpoints';

/// Blocks ///

/** Types of all blocks */
export type BlockType = NonNullable<BlockObjectRequest['type']>;

export type Block<T extends BlockType> = Extract<
  BlockObjectRequest,
  { type?: T }
>;

export type ParagraphBlock = Block<'paragraph'>;

/** Types of blocks that can have children */
type ParentBlockType = {
  [T in BlockType]: Required<
    Extract<BlockObjectRequest, { [K in T]: unknown }>[T]
  > extends { children: unknown }
    ? T
    : never;
}[BlockType];

/** Types of blocks that can be used as children */
type ChildBlockType = NonNullable<
  NonNullable<ParagraphBlock['paragraph']['children']>[number]['type']
>;

/**
 * Blocks that can be used as children.
 *
 * The Notion API only allows two levels of nested blocks, and the types are
 * defined accordingly. However, as we convert HTML into blocks, we can end up
 * with more nesting than this depending on the HTML content. To support
 * infinite nesting, this `ChildBlock` type takes the types from
 * `BlockObjectRequest` and redefines the `children` properties as
 * `Array<ChildBlock>` instead of `Array<BlockObjectRequestWithoutChildren>`.
 *
 * @see https://developers.notion.com/reference/patch-block-children
 */
export type ChildBlock = {
  [T in ChildBlockType]: T extends ParentBlockType
    ? Omit<Extract<BlockObjectRequest, { [K in T]: unknown }>, T> & {
        [K in T]: Omit<
          Extract<BlockObjectRequest, { [K in T]: unknown }>[T],
          'children'
        > & {
          children?: ChildBlock[];
        };
      }
    : Extract<BlockObjectRequest, { [K in T]: unknown }>;
}[ChildBlockType];

export type Color = ParagraphBlock['paragraph']['color'];

export type RichText = ParagraphBlock['paragraph']['rich_text'];

export type RichTextText = Extract<RichText[number], { type?: 'text' }>;

export type Annotations = RichTextText['annotations'];

export type TextLink = RichTextText['text']['link'];

export type RichTextOptions = {
  annotations?: Annotations;
  link?: TextLink;
  preserveWhitespace?: boolean;
};

export function isBlockType<T extends BlockType>(
  type: T,
  value: object,
): value is Block<T> {
  return type in value;
}

/// Databases ///

export type DatabaseProperties = GetDatabaseResponse['properties'];

export type DatabasePropertyConfig<T extends PropertyType> = Extract<
  DatabaseProperties[string],
  { type: T }
>;

export type DatabasePageProperties = CreatePageParameters['properties'];

export type DatabasePageProperty = Extract<
  DatabasePageProperties[string],
  { type?: string }
>;

export type PropertyType = NonNullable<DatabasePageProperty['type']>;

export type PropertyRequest<T extends PropertyType> = Extract<
  DatabasePageProperty,
  { [P in T]: unknown }
>[T];
