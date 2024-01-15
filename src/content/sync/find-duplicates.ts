import { collectPaginatedAPI, type Client, isFullPage } from '@notionhq/client';

import { NoteroPref, getRequiredNoteroPref } from '../prefs/notero-pref';

import { isPropertyOfType } from './notion-types';

export async function findDuplicates(notion: Client): Promise<Set<string>> {
  const databaseID = getRequiredNoteroPref(NoteroPref.notionDatabaseID);

  const pages = await collectPaginatedAPI(notion.databases.query, {
    database_id: databaseID,
    filter_properties: ['title'],
    sorts: [{ direction: 'ascending', property: 'title' }],
  });

  const titles = new Set<string>();
  const duplicates = new Set<string>();

  for (const page of pages) {
    if (!isFullPage(page)) continue;

    const titleProperty = Object.values(page.properties).find(
      isPropertyOfType('title'),
    );
    if (!titleProperty) continue;

    const title = titleProperty.title.map((t) => t.plain_text).join('');

    if (titles.has(title)) {
      duplicates.add(title);
    } else {
      titles.add(title);
    }
  }

  return duplicates;
}
