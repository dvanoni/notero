import { NOTION_TAG_NAME } from '../constants';
import { PageTitleFormat } from '../prefs/notero-pref';
import { propertyMappings} from '../prefs/propertyMapping
import {
  buildCollectionFullName,
  getItemURL,
  parseItemDate,
  truncateMiddle,
} from '../utils';

import { LIMITS } from './notion-limits';
import type {
  DatabaseProperties,
  DatabaseRequestProperties,
  DatabaseRequestProperty,
  PropertyRequest,
  RequestPropertyType,
} from './notion-types';
import { buildDate, buildRichText } from './notion-utils';

type PropertyBuilderParams = {
  citationFormat: string;
  databaseProperties: DatabaseProperties;
  item: Zotero.Item;
  pageTitleFormat: PageTitleFormat;
};

type PropertyDefinition<T extends RequestPropertyType = RequestPropertyType> = {
  [P in T]: {
    name: string;
    type: P;
    buildRequest: () => PropertyRequest<P> | Promise<PropertyRequest<P>>;
  };
}[T];

export function buildProperties(
  params: PropertyBuilderParams,
): Promise<DatabaseRequestProperties> {
  const propertyBuilder = new PropertyBuilder(params);
  return propertyBuilder.buildProperties();
}

function formatCreatorName({ firstName, lastName }: Zotero.Creator) {
  return [lastName, firstName].filter((name) => name).join(', ');
}

/**
 * Sanitize name of select option to conform to the following constraints:
 * - Commas (`,`) are not valid
 * - Length must be <= 100
 *
 * @see https://developers.notion.com/reference/property-object#select
 */
function sanitizeSelectOption(text: string): string {
  return truncateMiddle(
    text.replace(/,/g, ';'),
    LIMITS.SELECT_OPTION_CHARACTERS,
  );
}

class PropertyBuilder {
  private readonly cachedCitations = new Map<string, string | null>();

  private readonly citationFormat: string;
  private readonly databaseProperties: DatabaseProperties;
  private readonly item: Zotero.Item;
  private readonly pageTitleFormat: PageTitleFormat;

  public constructor(params: PropertyBuilderParams) {
    this.citationFormat = params.citationFormat;
    this.databaseProperties = params.databaseProperties;
    this.item = params.item;
    this.pageTitleFormat = params.pageTitleFormat;
  }

  public async buildProperties(): Promise<DatabaseRequestProperties> {
    const properties: DatabaseRequestProperties = {
      title: {
        title: buildRichText(await this.getPageTitle()),
      },
    };

    const validPropertyDefinitions = this.propertyDefinitions.filter(
      this.databaseHasProperty,
    );

    for (const { name, type, buildRequest } of validPropertyDefinitions) {
      const request = await buildRequest();

      properties[name] = {
        type,
        [type]: request,
      } as DatabaseRequestProperty;
    }

    return properties;
  }

  private databaseHasProperty = ({ name, type }: PropertyDefinition) =>
    this.databaseProperties[name]?.type === type;

  private pageTitleBuilders: Record<
    PageTitleFormat,
    () => string | undefined | Promise<string | null>
  > = {
    [PageTitleFormat.itemAuthorDateCitation]: () =>
      this.getAuthorDateCitation(),
    [PageTitleFormat.itemCitationKey]: () => this.getCitationKey(),
    [PageTitleFormat.itemFullCitation]: () => this.getFullCitation(),
    [PageTitleFormat.itemInTextCitation]: () => this.getInTextCitation(),
    [PageTitleFormat.itemShortTitle]: () => this.getShortTitle(),
    [PageTitleFormat.itemTitle]: () => this.getTitle(),
  };

  private async getPageTitle(): Promise<string> {
    const pageTitle = await this.pageTitleBuilders[this.pageTitleFormat]();
    return pageTitle || this.getTitle();
  }

  private getAuthorDateCitation(): string {
    let citation =
      this.item.getField('firstCreator') || this.item.getDisplayTitle();
    let date = this.item.getField('date', true, true);
    if (date && (date = date.substring(0, 4)) !== '0000') {
      citation += ', ' + date;
    }
    return citation;
  }

  private getCitationKey(): string | undefined {
    return this.item.getField('citationKey');
  }

  public getFullCitation(): Promise<string | null> {
    return this.getCachedCitation(this.citationFormat, false);
  }

  public getInTextCitation(): Promise<string | null> {
    return this.getCachedCitation(this.citationFormat, true);
  }

  private getCitation(
    format: string,
    inTextCitation: boolean,
  ): Promise<string | null> {
    return new Promise((resolve) => {
      const result = Zotero.QuickCopy.getContentFromItems(
        [this.item],
        format,
        (obj, worked) => {
          resolve(worked ? obj.string.trim() : null);
        },
        inTextCitation,
      );

      if (result === false) {
        resolve(null);
      } else if (result !== true) {
        resolve(result.text.trim());
      }
    });
  }

  private async getCachedCitation(
    format: string,
    inTextCitation: boolean,
  ): Promise<string | null> {
    const cacheKey = `${format}-${String(inTextCitation)}`;

    if (!this.cachedCitations.has(cacheKey)) {
      this.cachedCitations.set(
        cacheKey,
        await this.getCitation(format, inTextCitation),
      );
    }

    return this.cachedCitations.get(cacheKey) || null;
  }

  private getShortTitle(): string | undefined {
    return this.item.getField('shortTitle');
  }

  private getTitle(): string {
    return this.item.getDisplayTitle();
  }

  private propertyDefinitions: PropertyDefinition[] = [
    {
      name: 'Abstract',
      type: 'rich_text',
      buildRequest: () =>
        buildRichText(this.item.getField('abstractNote'), {
          preserveWhitespace: true,
        }),
    },
    {
      name: 'Authors',
      type: 'rich_text',
      buildRequest: () => {
        const primaryCreatorTypeID = Zotero.CreatorTypes.getPrimaryIDForType(
          this.item.itemTypeID,
        );
        if (!primaryCreatorTypeID) return [];

        const authors = this.item
          .getCreators()
          .filter(({ creatorTypeID }) => creatorTypeID === primaryCreatorTypeID)
          .map(formatCreatorName)
          .join('\n');

        return buildRichText(authors, { preserveWhitespace: true });
      },
    },
    {
      name: 'Citation Key',
      type: 'rich_text',
      buildRequest: () => buildRichText(this.getCitationKey()),
    },
    {
      name: 'Collections',
      type: 'multi_select',
      buildRequest: () =>
        Zotero.Collections.get(this.item.getCollections()).map(
          (collection) => ({
            name: sanitizeSelectOption(buildCollectionFullName(collection)),
          }),
        ),
    },
    {
      name: 'Date',
      type: 'rich_text',
      buildRequest: () => buildRichText(this.item.getField('date')),
    },
    {
      name: 'Date Added',
      type: 'date',
      buildRequest: () => buildDate(parseItemDate(this.item.dateAdded)),
    },
    {
      name: 'Date Modified',
      type: 'date',
      buildRequest: () => buildDate(parseItemDate(this.item.dateModified)),
    },
    {
      name: 'DOI',
      type: 'url',
      buildRequest: () => {
        const doi = this.item.getField('DOI');
        return doi ? `https://doi.org/${doi}` : null;
      },
    },
    {
      name: 'Editors',
      type: 'rich_text',
      buildRequest: () => {
        const editorTypeID = Zotero.CreatorTypes.getID('editor');
        if (!editorTypeID) return [];

        const editors = this.item
          .getCreators()
          .filter(({ creatorTypeID }) => creatorTypeID === editorTypeID)
          .map(formatCreatorName)
          .join('\n');

        return buildRichText(editors, { preserveWhitespace: true });
      },
    },
    {
      name: 'Extra',
      type: 'rich_text',
      buildRequest: () =>
        buildRichText(this.item.getField('extra'), {
          preserveWhitespace: true,
        }),
    },
    {
      name: 'File Path',
      type: 'rich_text',
      buildRequest: async () => {
        const attachment = await this.item.getBestAttachment();
        if (!attachment) return [];

        return buildRichText((await attachment.getFilePathAsync()) || null);
      },
    },
    {
      name: 'Full Citation',
      type: 'rich_text',
      buildRequest: async () =>
        buildRichText(await this.getFullCitation(), {
          preserveWhitespace: true,
        }),
    },
    {
      name: 'In-Text Citation',
      type: 'rich_text',
      buildRequest: async () => buildRichText(await this.getInTextCitation()),
    },
    {
      name: 'Item Type',
      type: 'select',
      buildRequest: () => ({
        name: Zotero.ItemTypes.getLocalizedString(this.item.itemTypeID),
      }),
    },
    {
      name: 'Place',
      type: 'rich_text',
      buildRequest: () => buildRichText(this.item.getField('place')),
    },
    {
      name: 'Proceedings Title',
      type: 'rich_text',
      buildRequest: () => buildRichText(this.item.getField('proceedingsTitle')),
    },
    {
      name: 'Publication',
      type: 'rich_text',
      buildRequest: () => buildRichText(this.item.getField('publicationTitle')),
    },
    {
      name: 'Series Title',
      type: 'rich_text',
      buildRequest: () => buildRichText(this.item.getField('seriesTitle')),
    },
    {
      name: 'Short Title',
      type: 'rich_text',
      buildRequest: () => buildRichText(this.getShortTitle()),
    },
    {
      name: 'Tags',
      type: 'multi_select',
      buildRequest: () =>
        this.item
          .getTags()
          .filter(({ tag }) => tag !== NOTION_TAG_NAME)
          .map(({ tag }) => ({ name: sanitizeSelectOption(tag) })),
    },
    {
      name: 'Title',
      type: 'rich_text',
      buildRequest: () => buildRichText(this.getTitle()),
    },
    {
      name: 'URL',
      type: 'url',
      buildRequest: () => this.item.getField('url') || null,
    },
    {
      name: 'Year',
      type: 'number',
      buildRequest: () => {
        const year = Number.parseInt(this.item.getField('year') || '');
        return Number.isNaN(year) ? null : year;
      },
    },
    {
      name: 'Zotero URI',
      type: 'url',
      buildRequest: () => getItemURL(this.item),
    },
  ];
}
