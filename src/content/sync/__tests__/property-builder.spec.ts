import { describe, expect, it, vi } from 'vite-plus/test';
import { any, mock } from 'vitest-mock-extended';

import { createZoteroCollectionMock, zoteroMock } from '../../../../test/utils';
import { PageTitleFormat } from '../../prefs/notero-pref';
import { getItemURL } from '../../utils';
import type {
  PropertyDefinition,
  Structure,
  WritableObjectProperties,
} from '../capacities-types';
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

const titleDefinition: PropertyDefinition = {
  id: 'title',
  name: '',
  type: 'title',
  writable: true,
};

function definition(
  id: string,
  name: string,
  type: PropertyDefinition['type'],
  extra: Partial<PropertyDefinition> = {},
): PropertyDefinition {
  return { id, name, type, writable: true, ...extra };
}

const propertyDefinitions = {
  Abstract: definition('abstract', 'Abstract', 'text'),
  Authors: definition('authors', 'Authors', 'text'),
  Collections: definition('collections', 'Collections', 'text'),
  Date: definition('date', 'Date', 'text'),
  'Date Added': definition('dateAdded', 'Date Added', 'date'),
  DOI: definition('doi', 'DOI', 'url'),
  Editors: definition('editors', 'Editors', 'text'),
  'File Path': definition('filePath', 'File Path', 'text'),
  'Full Citation': definition('fullCitation', 'Full Citation', 'text'),
  'In-Text Citation': definition('inTextCitation', 'In-Text Citation', 'text'),
  'Item Type': definition('itemType', 'Item Type', 'label', {
    labelSet: [{ id: 'journalArticle', name: fakeItemType }],
  }),
  'Short Title': definition('shortTitle', 'Short Title', 'text'),
  Tags: definition('tags', 'Tags', 'text'),
  Title: definition('title2', 'Title', 'text'),
  URL: definition('url', 'URL', 'url'),
  Year: definition('year', 'Year', 'number'),
  'Zotero URI': definition('zoteroUri', 'Zotero URI', 'url'),
};

function buildStructure(definitions: PropertyDefinition[]): Structure {
  return {
    id: 'fake-structure-id',
    title: 'Fake Structure',
    pluralName: 'Fake Structures',
    propertyDefinitions: [titleDefinition, ...definitions],
    labelColor: '#000000',
    collections: [],
  };
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
          structure: buildStructure([]),
          item,
          pageTitleFormat: format,
        });

        expect(result).toStrictEqual({
          title: { type: 'title', title: { value: expected } },
        });
      });
    });

    it('returns item display title for `itemCitationKey` when citation key is unavailable', async () => {
      const { item } = setup();

      item.getField.calledWith('citationKey').mockReturnValue('');

      const result = await buildProperties({
        citationFormat: 'style',
        structure: buildStructure([]),
        item,
        pageTitleFormat: PageTitleFormat.itemCitationKey,
      });

      expect(result).toStrictEqual({
        title: { type: 'title', title: { value: fakeTitle } },
      });
    });
  });

  it('returns only properties that exist in structure', async () => {
    const { item } = setup();

    const result = await buildProperties({
      citationFormat: 'style',
      structure: buildStructure([
        propertyDefinitions.Authors,
        propertyDefinitions.Year,
      ]),
      item,
      pageTitleFormat: PageTitleFormat.itemTitle,
    });

    const expected: WritableObjectProperties = {
      title: { type: 'title', title: { value: fakeTitle } },
      authors: {
        type: 'text',
        text: {
          value: `${fakeLastName1}, ${fakeFirstName1}\n${fakeLastName2}, ${fakeFirstName2}`,
        },
      },
      year: { type: 'number', number: { value: fakeYear } },
    };

    expect(result).toStrictEqual(expected);
  });

  it('excludes properties that do not have correct type', async () => {
    const { item } = setup();

    const result = await buildProperties({
      citationFormat: 'style',
      structure: buildStructure([
        { ...propertyDefinitions.Authors, type: 'number' },
        propertyDefinitions.Year,
      ]),
      item,
      pageTitleFormat: PageTitleFormat.itemTitle,
    });

    const expected: WritableObjectProperties = {
      title: { type: 'title', title: { value: fakeTitle } },
      year: { type: 'number', number: { value: fakeYear } },
    };

    expect(result).toStrictEqual(expected);
  });

  it('excludes label options that do not match any existing labelSet option', async () => {
    const { item } = setup();

    const result = await buildProperties({
      citationFormat: 'style',
      structure: buildStructure([
        { ...propertyDefinitions['Item Type'], labelSet: [] },
      ]),
      item,
      pageTitleFormat: PageTitleFormat.itemTitle,
    });

    expect(result).toStrictEqual(
      expect.objectContaining({
        itemType: { type: 'label', label: [] },
      }),
    );
  });

  it('returns correct values for all properties', async () => {
    const { item } = setup();

    const result = await buildProperties({
      citationFormat: 'style',
      structure: buildStructure(Object.values(propertyDefinitions)),
      item,
      pageTitleFormat: PageTitleFormat.itemTitle,
    });

    const expected: WritableObjectProperties = {
      title: { type: 'title', title: { value: fakeTitle } },
      abstract: { type: 'text', text: { value: fakeAbstract } },
      authors: {
        type: 'text',
        text: {
          value: `${fakeLastName1}, ${fakeFirstName1}\n${fakeLastName2}, ${fakeFirstName2}`,
        },
      },
      collections: { type: 'text', text: { value: fakeCollectionName } },
      date: { type: 'text', text: { value: fakeDate } },
      dateAdded: {
        type: 'date',
        date: { dateResolution: 'day', start: null },
      },
      doi: { type: 'url', url: { value: null } },
      editors: { type: 'text', text: { value: null } },
      filePath: { type: 'text', text: { value: null } },
      fullCitation: { type: 'text', text: { value: fakeFullCitation } },
      inTextCitation: { type: 'text', text: { value: fakeInTextCitation } },
      itemType: {
        type: 'label',
        label: [{ id: 'journalArticle', name: fakeItemType }],
      },
      shortTitle: { type: 'text', text: { value: fakeShortTitle } },
      tags: { type: 'text', text: { value: fakeTag } },
      title2: { type: 'text', text: { value: fakeTitle } },
      url: { type: 'url', url: { value: null } },
      year: { type: 'number', number: { value: fakeYear } },
      zoteroUri: { type: 'url', url: { value: fakeURI } },
    };

    expect(result).toStrictEqual(expected);
  });
});
