import { APA_STYLE, NOTION_TAG_NAME } from '../constants';
import { PageTitleFormat } from '../prefs/notero-pref';
import { buildCollectionFullName } from '../utils';

import type {
  DatabasePageProperties,
  DatabasePageProperty,
  DatabaseProperties,
  PropertyRequest,
  PropertyType,
} from './notion-types';
import { buildDate, buildRichText } from './notion-utils';

type PropertyBuilderParams = {
  citationFormat: string;
  databaseProperties: DatabaseProperties;
  item: Zotero.Item;
  pageTitleFormat: PageTitleFormat;
};

type PropertyDefinition<T extends PropertyType = PropertyType> = {
  [P in T]: {
    name: string;
    type: P;
    buildRequest: () => PropertyRequest<P> | Promise<PropertyRequest<P>>;
  };
}[T];

export function buildProperties(
  params: PropertyBuilderParams,
): Promise<DatabasePageProperties> {
  const propertyBuilder = new PropertyBuilder(params);
  return propertyBuilder.buildProperties();
}

function formatCreatorName({ firstName, lastName }: Zotero.Creator) {
  return [lastName, firstName].filter((name) => name).join(', ');
}

function sanitizeSelectOption(text: string): string {
  return text.replace(/,/g, ';');
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

  public async buildProperties(): Promise<DatabasePageProperties> {
    const properties: DatabasePageProperties = {
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
      } as DatabasePageProperty;
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
    [PageTitleFormat.itemFullCitation]: () => this.getFullCitation(),
    [PageTitleFormat.itemInTextCitation]: () => this.getInTextCitation(),
    [PageTitleFormat.itemShortTitle]: () => this.getShortTitle(),
    [PageTitleFormat.itemTitle]: () => this.getTitle(),
  };

  private async getPageTitle(): Promise<string> {
    const pageTitle = await this.pageTitleBuilders[this.pageTitleFormat]();
    return pageTitle || this.getTitle();
  }

  private async getAuthorDateCitation(): Promise<string | null> {
    const citation = await this.getCachedCitation(APA_STYLE, true);
    return citation?.match(/^\((.+)\)$/)?.[1] || null;
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
      buildRequest: () => buildRichText(this.item.getField('abstractNote')),
    },
    {
      name: 'Authors',
      type: 'rich_text',
      buildRequest: () => {
        const primaryCreatorTypeID = Zotero.CreatorTypes.getPrimaryIDForType(
          this.item.itemTypeID,
        );
        if (!primaryCreatorTypeID) return [];

        return buildRichText(
          this.item
            .getCreators()
            .filter(
              ({ creatorTypeID }) => creatorTypeID === primaryCreatorTypeID,
            )
            .map(formatCreatorName)
            .join('\n'),
        );
      },
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
      buildRequest: () =>
        buildDate(Zotero.Date.sqlToDate(this.item.dateAdded, true)),
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

        return buildRichText(
          this.item
            .getCreators()
            .filter(({ creatorTypeID }) => creatorTypeID === editorTypeID)
            .map(formatCreatorName)
            .join('\n'),
        );
      },
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
      buildRequest: async () => buildRichText(await this.getFullCitation()),
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
      buildRequest: () => Zotero.URI.getItemURI(this.item),
    },
  ];
}
