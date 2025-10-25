import { iteratePaginatedAPI, type Client, isFullPage } from '@notionhq/client';

import {
  PropertyResponse,
  ResponsePropertyType,
  isPropertyOfType,
} from './notion-types';

const VALID_PROPERTY_TYPES = new Set([
  'rich_text',
  'title',
  'url',
]) satisfies Set<ResponsePropertyType>;

type ValidPropertyType = Parameters<(typeof VALID_PROPERTY_TYPES)['add']>[0];

const isValidProperty = isPropertyOfType(VALID_PROPERTY_TYPES);

export async function findDuplicates(
  notion: Client,
  dataSourceId: string,
  propertyName: string,
): Promise<Set<string>> {
  const propertyId = await getPropertyId(notion, dataSourceId, propertyName);

  const comparisonValues = new Set<string>();
  const duplicates = new Set<string>();

  const args = {
    data_source_id: dataSourceId,
    filter_properties: [propertyId],
    sorts: [{ direction: 'ascending', property: propertyName } as const],
  };

  for await (const page of iteratePaginatedAPI(
    notion.dataSources.query,
    args,
  )) {
    if (!isFullPage(page)) continue;

    const property = Object.values(page.properties)
      .filter(isValidProperty)
      .find(({ id }) => id === propertyId);
    if (!property) continue;

    const textValue = getPropertyTextValue(property);
    if (!textValue) continue;

    if (comparisonValues.has(textValue)) {
      duplicates.add(textValue);
    } else {
      comparisonValues.add(textValue);
    }
  }

  return duplicates;
}

async function getPropertyId(
  notion: Client,
  dataSourceId: string,
  propertyName: string,
): Promise<string> {
  if (propertyName === 'title') return 'title';

  const dataSource = await notion.dataSources.retrieve({
    data_source_id: dataSourceId,
  });

  const property = dataSource.properties[propertyName];

  if (!property) {
    throw new Error(`Could not find property "${propertyName}"`);
  }
  if (!isValidProperty(property)) {
    throw new Error(
      `Property "${propertyName}" has invalid type "${property.type}"`,
    );
  }

  return property.id;
}

function getPropertyTextValue(
  property: PropertyResponse<ValidPropertyType>,
): string | null {
  if (property.type === 'url') return property.url;

  const richText =
    property.type === 'rich_text' ? property.rich_text : property.title;

  return richText.map((t) => t.plain_text).join('');
}
