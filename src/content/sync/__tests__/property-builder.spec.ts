import { describe, expect, it, vi } from 'vitest';
import { any, mock } from 'vitest-mock-extended';

import { createZoteroCollectionMock, zoteroMock } from '../../../../test/utils';
import { PageTitleFormat } from '../../prefs/notero-pref';
import { getItemURL, keyValue } from '../../utils';
import type {
  DataSourceProperties,
  DataSourcePropertyConfig,
  PageRequestProperties,
} from '../notion-types';
import { buildProperties } from '../property-builder';

vi.mock('../../utils/get-item-url');

const fakeCollectionName = 'Fake Collection';
const fakeItemType = 'Journal Article';
const fakePrimaryID = 1;
const fakeTag = 'Fake Tag';
const fakeFirstName1 = 'Fakey';
const fakeLastName1 = 'Fakerson';
const fakeFirstName2 = 'Chet';
const fakeLastName2 = 'Faker';
const fakeAbstract = 'Fake abstract\nwith newline';
const fakeCitationKey = 'fakeCitationKey';
const fakeDate = '2023-10-01';
const fakePublication = 'Fake Publication';
const fakeShortTitle = 'Faking It';
const fakeTitle = 'Faking It: How To Write A Fake Paper';
const fakeURI = 'https://zotero.org/users/local/abcdef/items/abcdef';
const fakeYear = 2023;
const fakeFullCitation = `${fakeLastName1}. (${fakeYear}). ${fakeTitle}. ${fakePublication}.`;
const fakeInTextCitation = `(${fakeLastName1}, ${fakeYear})`;

const pageTitleTestCases: {
  description: string;
  format: PageTitleFormat;
  expected: string;
}[] = [
  {
    description: 'item author-date citation',
    format: PageTitleFormat.itemAuthorDateCitation,
    expected: `${fakeLastName1}, ${fakeYear}`,
  },
  {
    description: 'item citation key',
    format: PageTitleFormat.itemCitationKey,
    expected: fakeCitationKey,
  },
  {
    description: 'item full citation',
    format: PageTitleFormat.itemFullCitation,
    expected: fakeFullCitation,
  },
  {
    description: 'item in-text citation',
    format: PageTitleFormat.itemInTextCitation,
    expected: fakeInTextCitation,
  },
  {
    description: 'item short title',
    format: PageTitleFormat.itemShortTitle,
    expected: fakeShortTitle,
  },
  {
    description: 'item display title',
    format: PageTitleFormat.itemTitle,
    expected: fakeTitle,
  },
];

const propertyConfigs = {
  ...propertyConfig('Abstract', 'rich_text'),
  ...propertyConfig('Authors', 'rich_text'),
  ...propertyConfig('Collections', 'multi_select'),
  ...propertyConfig('Date', 'rich_text'),
  ...propertyConfig('Date Added', 'date'),
  ...propertyConfig('DOI', 'url'),
  ...propertyConfig('Editors', 'rich_text'),
  ...propertyConfig('File Path', 'rich_text'),
  ...propertyConfig('Full Citation', 'rich_text'),
  ...propertyConfig('In-Text Citation', 'rich_text'),
  ...propertyConfig('Item Type', 'select'),
  ...propertyConfig('Short Title', 'rich_text'),
  ...propertyConfig('Tags', 'multi_select'),
  ...propertyConfig('Title', 'rich_text'),
  ...propertyConfig('URL', 'url'),
  ...propertyConfig('Year', 'number'),
  ...propertyConfig('Zotero URI', 'url'),
} satisfies DataSourceProperties;

function propertyConfig<N extends string>(
  name: N,
  type: 'date' | 'multi_select' | 'number' | 'rich_text' | 'select' | 'url',
): Record<N, DataSourcePropertyConfig<typeof type>> {
  type SelectOptions = DataSourcePropertyConfig<'select'>['select']['options'];

  const idNameDescription = { id: 'id', name, description: null };

  switch (type) {
    case 'date':
      return keyValue(name, { ...idNameDescription, type, [type]: {} });
    case 'multi_select':
      return keyValue(name, {
        ...idNameDescription,
        type,
        [type]: { options: [] as SelectOptions },
      });
    case 'number':
      return keyValue(name, {
        ...idNameDescription,
        type,
        [type]: { format: 'number' },
      });
    case 'rich_text':
      return keyValue(name, { ...idNameDescription, type, [type]: {} });
    case 'select':
      return keyValue(name, {
        ...idNameDescription,
        type,
        [type]: { options: [] as SelectOptions },
      });
    case 'url':
      return keyValue(name, { ...idNameDescription, type, [type]: {} });
  }
}

function setup() {
  zoteroMock.CreatorTypes.getPrimaryIDForType.mockReturnValue(fakePrimaryID);

  zoteroMock.ItemTypes.getLocalizedString.mockReturnValue(fakeItemType);

  zoteroMock.QuickCopy.getContentFromItems
    .calledWith(any(), any(), any(), true)
    .mockReturnValue({ html: fakeInTextCitation, text: fakeInTextCitation });
  zoteroMock.QuickCopy.getContentFromItems
    .calledWith(any(), any(), any(), false)
    .mockReturnValue({ html: fakeFullCitation, text: fakeFullCitation });

  const collection = createZoteroCollectionMock({ name: fakeCollectionName });

  const item = mock<Zotero.Item>();
  item.getCollections.mockReturnValue([collection.id]);
  item.getCreators.mockReturnValue([
    {
      creatorTypeID: fakePrimaryID,
      fieldMode: 1,
      firstName: fakeFirstName1,
      lastName: fakeLastName1,
    },
    {
      creatorTypeID: fakePrimaryID,
      fieldMode: 1,
      firstName: fakeFirstName2,
      lastName: fakeLastName2,
    },
  ]);
  item.getDisplayTitle.mockReturnValue(fakeTitle);
  item.getField.calledWith('abstractNote').mockReturnValue(fakeAbstract);
  item.getField.calledWith('citationKey').mockReturnValue(fakeCitationKey);
  item.getField.calledWith('date').mockReturnValue(fakeDate);
  item.getField.calledWith('firstCreator').mockReturnValue(fakeLastName1);
  item.getField.calledWith('shortTitle').mockReturnValue(fakeShortTitle);
  item.getField.calledWith('year').mockReturnValue(String(fakeYear));
  item.getTags.mockReturnValue([{ tag: fakeTag, type: 1 }]);

  vi.mocked(getItemURL).mockReturnValue(fakeURI);

  return { collection, item };
}

describe('buildProperties', () => {
  describe('page title', () => {
    pageTitleTestCases.forEach(({ description, expected, format }) => {
      it(`returns ${description} for \`${format}\``, async () => {
        const { item } = setup();

        const result = await buildProperties({
          citationFormat: 'style',
          databaseProperties: {},
          item,
          pageTitleFormat: format,
        });

        expect(result).toStrictEqual({
          title: {
            title: [{ text: { content: expected } }],
          },
        });
      });
    });

    it('returns item display title for `itemCitationKey` when citation key is unavailable', async () => {
      const { item } = setup();

      item.getField.calledWith('citationKey').mockReturnValue('');

      const result = await buildProperties({
        citationFormat: 'style',
        databaseProperties: {},
        item,
        pageTitleFormat: PageTitleFormat.itemCitationKey,
      });

      expect(result).toStrictEqual({
        title: {
          title: [{ text: { content: fakeTitle } }],
        },
      });
    });
  });

  it('returns only properties that exist in database', async () => {
    const { item } = setup();

    const result = await buildProperties({
      citationFormat: 'style',
      databaseProperties: {
        Authors: propertyConfigs.Authors,
        Year: propertyConfigs.Year,
      },
      item,
      pageTitleFormat: PageTitleFormat.itemTitle,
    });

    const expected: PageRequestProperties = {
      title: {
        title: [{ text: { content: fakeTitle } }],
      },
      Authors: {
        rich_text: [
          {
            text: {
              content: `${fakeLastName1}, ${fakeFirstName1}\n${fakeLastName2}, ${fakeFirstName2}`,
            },
          },
        ],
        type: 'rich_text',
      },
      Year: {
        number: fakeYear,
        type: 'number',
      },
    };

    expect(result).toStrictEqual(expected);
  });

  it('exludes properties that do not have corect type', async () => {
    const { item } = setup();

    const result = await buildProperties({
      citationFormat: 'style',
      databaseProperties: {
        Authors: {
          ...propertyConfigs.Authors,
          type: 'checkbox',
          checkbox: {},
        },
        Year: propertyConfigs.Year,
      },
      item,
      pageTitleFormat: PageTitleFormat.itemTitle,
    });

    const expected: PageRequestProperties = {
      title: {
        title: [{ text: { content: fakeTitle } }],
      },
      Year: {
        number: fakeYear,
        type: 'number',
      },
    };

    expect(result).toStrictEqual(expected);
  });

  it('returns truncated value when collection name exceeds limit', async () => {
    const { collection, item } = setup();

    const nameWithOver100Characters =
      'This name has 27 characters ▸ This name has 27 characters ▸ This name has 27 characters ▸ This name has 27 characters';
    const truncatedName =
      'This name has 27 characters ▸ This name has 27 cha…e has 27 characters ▸ This name has 27 characters';

    collection.name = nameWithOver100Characters;

    const result = await buildProperties({
      citationFormat: 'style',
      databaseProperties: {
        Collections: propertyConfigs.Collections,
      },
      item,
      pageTitleFormat: PageTitleFormat.itemCitationKey,
    });

    expect(result).toStrictEqual(
      expect.objectContaining({
        Collections: {
          multi_select: [{ name: truncatedName }],
          type: 'multi_select',
        },
      }),
    );
  });

  it('returns correct values for all properties', async () => {
    const { item } = setup();

    const result = await buildProperties({
      citationFormat: 'style',
      databaseProperties: propertyConfigs,
      item,
      pageTitleFormat: PageTitleFormat.itemTitle,
    });

    const expected: PageRequestProperties = {
      title: {
        title: [{ text: { content: fakeTitle } }],
      },
      Abstract: {
        rich_text: [{ text: { content: fakeAbstract } }],
        type: 'rich_text',
      },
      Authors: {
        rich_text: [
          {
            text: {
              content: `${fakeLastName1}, ${fakeFirstName1}\n${fakeLastName2}, ${fakeFirstName2}`,
            },
          },
        ],
        type: 'rich_text',
      },
      Collections: {
        multi_select: [{ name: fakeCollectionName }],
        type: 'multi_select',
      },
      DOI: {
        url: null,
        type: 'url',
      },
      Date: {
        rich_text: [{ text: { content: fakeDate } }],
        type: 'rich_text',
      },
      'Date Added': {
        date: null,
        type: 'date',
      },
      Editors: {
        rich_text: [],
        type: 'rich_text',
      },
      'File Path': {
        rich_text: [],
        type: 'rich_text',
      },
      'Full Citation': {
        rich_text: [{ text: { content: fakeFullCitation } }],
        type: 'rich_text',
      },
      'In-Text Citation': {
        rich_text: [{ text: { content: fakeInTextCitation } }],
        type: 'rich_text',
      },
      'Item Type': {
        select: { name: fakeItemType },
        type: 'select',
      },
      'Short Title': {
        rich_text: [{ text: { content: fakeShortTitle } }],
        type: 'rich_text',
      },
      Tags: {
        multi_select: [{ name: fakeTag }],
        type: 'multi_select',
      },
      Title: {
        rich_text: [{ text: { content: fakeTitle } }],
        type: 'rich_text',
      },
      URL: {
        url: null,
        type: 'url',
      },
      Year: {
        number: fakeYear,
        type: 'number',
      },
      'Zotero URI': {
        url: fakeURI,
        type: 'url',
      },
    };

    expect(result).toStrictEqual(expected);
  });
});
