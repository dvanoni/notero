import { collectPaginatedAPI, type Client, isFullPage } from '@notionhq/client';

import { NoteroPref, getRequiredNoteroPref } from '../prefs/notero-pref';

import {
  PropertyResponse,
  ResponsePropertyType,
  isPropertyOfType,
} from './notion-types';

const VALID_PROPERTY_TYPES = [
  'rich_text',
  'title',
  'url',
] satisfies ResponsePropertyType[];

type ValidPropertyType = (typeof VALID_PROPERTY_TYPES)[number];

const isValidProperty = isPropertyOfType(VALID_PROPERTY_TYPES);

export async function findDuplicates(
  notion: Client,
  propertyName: string,
): Promise<Set<string>> {
  const databaseID = getRequiredNoteroPref(NoteroPref.notionDatabaseID);

  const propertyID = await getPropertyID(notion, databaseID, propertyName);

  const pages = await collectPaginatedAPI(notion.databases.query, {
    database_id: databaseID,
    filter_properties: [propertyID],
    sorts: [{ direction: 'ascending', property: propertyName }],
  });

  const comparisonValues = new Set<string>();
  const duplicates = new Set<string>();

  for (const page of pages) {
    if (!isFullPage(page)) continue;

    const property = Object.values(page.properties)
      .filter(isValidProperty)
      .find(({ id }) => id === propertyID);
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

async function getPropertyID(
  notion: Client,
  databaseID: string,
  propertyName: string,
): Promise<string> {
  if (propertyName === 'title') return 'title';

  const database = await notion.databases.retrieve({ database_id: databaseID });

  const property = database.properties[propertyName];

  if (!property) {
    throw new Error(`Could not find property "${propertyName}"`);
  }
  if (!VALID_PROPERTY_TYPES.includes(property.type)) {
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
