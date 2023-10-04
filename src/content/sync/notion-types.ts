import type {
  BlockObjectRequest,
  CreatePageParameters,
  GetDatabaseResponse,
} from '@notionhq/client/build/src/api-endpoints';

/*** Blocks ***/

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

/*** Databases ***/

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
