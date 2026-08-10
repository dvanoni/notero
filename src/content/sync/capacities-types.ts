/**
 * @see https://developers.capacities.io/api/concepts/structures
 * @see https://developers.capacities.io/api/concepts/properties
 */

export type LabelOption = {
  id: string;
  name: string;
  color?: string;
};

export type PropertyDefinitionType =
  | 'title'
  | 'text'
  | 'number'
  | 'boolean'
  | 'url'
  | 'date'
  | 'label'
  | 'entity'
  | 'aliases'
  | 'icon'
  | 'createdAt'
  | 'lastUpdatedAt'
  | 'richText';

export type PropertyDefinition = {
  id: string;
  name: string;
  type: PropertyDefinitionType;
  writable: boolean;
  multiple?: boolean;
  labelSet?: LabelOption[];
  allowedStructures?: string[];
};

export type StructureCollection = {
  id: string;
  title: string;
};

export type Structure = {
  id: string;
  title: string;
  pluralName: string;
  propertyDefinitions: PropertyDefinition[];
  labelColor: string;
  collections: StructureCollection[];
};

export type Space = {
  id: string;
  title: string;
  icon?: {
    type: 'emoji' | 'iconify';
    val: string;
  };
};

/// Writable property values ///

export type WritableTitleProperty = {
  type: 'title';
  title: { value: string | null };
};

export type WritableTextProperty = {
  type: 'text';
  text: { value: string | null };
};

export type WritableNumberProperty = {
  type: 'number';
  number: { value: number | null };
};

export type WritableUrlProperty = {
  type: 'url';
  url: { value: string | null };
};

export type WritableDatePayload = {
  dateResolution?: 'day' | 'time';
  start: string | null;
  end?: string | null;
};

export type WritableDateProperty = {
  type: 'date';
  date: WritableDatePayload;
};

export type WritableLabelProperty = {
  type: 'label';
  label: LabelOption[];
};

export type WritablePropertyValue =
  | WritableTitleProperty
  | WritableTextProperty
  | WritableNumberProperty
  | WritableUrlProperty
  | WritableDateProperty
  | WritableLabelProperty;

export type WritableObjectProperties = Record<string, WritablePropertyValue>;

/// Objects ///

export type CapacitiesObject = {
  id: string;
  structureId: string;
  collections: string[];
  properties: Record<string, unknown>;
  blocks?: Record<string, unknown[]>;
};

export type SearchResult = {
  id: string;
  structureId: string;
  title: string;
};

export type CreateObjectParams = {
  structureId: string;
  collections?: string[];
  properties?: WritableObjectProperties;
};

export type UpdateObjectParams = {
  id: string;
  properties?: WritableObjectProperties;
  collections?: string[];
};
