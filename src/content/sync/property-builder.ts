import { CAPACITIES_TAG_NAME } from '../constants';
import { PageTitleFormat } from '../prefs/notero-pref';
import { buildCollectionFullName, getItemURL, parseItemDate } from '../utils';

import type {
  LabelOption,
  PropertyDefinition,
  PropertyDefinitionType,
  Structure,
  WritableLabelProperty,
  WritableObjectProperties,
  WritablePropertyValue,
} from './capacities-types';

type PropertyBuilderParams = {
  citationFormat: string;
  structure: Structure;
  item: Zotero.Item;
  pageTitleFormat: PageTitleFormat;
};

type FieldDefinition = {
  name: string;
  type: PropertyDefinitionType;
  buildValue: (
    propertyDefinition: PropertyDefinition,
  ) => WritablePropertyValue | Promise<WritablePropertyValue>;
};

function buildTextValue(
  value: string | null | undefined,
): WritablePropertyValue {
  return { type: 'text', text: { value: value || null } };
}

function buildUrlValue(
  value: string | null | undefined,
): WritablePropertyValue {
  return { type: 'url', url: { value: value || null } };
}

function buildNumberValue(value: number | null): WritablePropertyValue {
  return { type: 'number', number: { value } };
}

function buildDateValue(
  date: Date | false | null | undefined,
): WritablePropertyValue {
  return {
    type: 'date',
    date: { dateResolution: 'day', start: date ? date.toISOString() : null },
  };
}

/**
 * Build a `label` property value by matching option names against the
 * property definition's fixed `labelSet`. Unlike Notion's `select`/
 * `multi_select`, Capacities cannot create new label options via the API, so
 * names without a matching existing option are silently dropped.
 *
 * @see https://developers.capacities.io/api/concepts/properties
 */
function buildLabelValue(
  propertyDefinition: PropertyDefinition,
  names: string[],
): WritableLabelProperty {
  const labelSet = propertyDefinition.labelSet || [];

  const label = names.reduce<LabelOption[]>((options, name) => {
    const option = labelSet.find(
      (candidate) => candidate.name.toLowerCase() === name.toLowerCase(),
    );
    if (option) options.push(option);
    return options;
  }, []);

  return { type: 'label', label };
}

export function buildProperties(
  params: PropertyBuilderParams,
): Promise<WritableObjectProperties> {
  const propertyBuilder = new PropertyBuilder(params);
  return propertyBuilder.buildProperties();
}

function formatCreatorName({ firstName, lastName }: Zotero.Creator) {
  return [lastName, firstName].filter((name) => name).join(', ');
}

class PropertyBuilder {
  private readonly cachedCitations = new Map<string, string | null>();

  private readonly citationFormat: string;
  private readonly structure: Structure;
  private readonly item: Zotero.Item;
  private readonly pageTitleFormat: PageTitleFormat;

  public constructor(params: PropertyBuilderParams) {
    this.citationFormat = params.citationFormat;
    this.structure = params.structure;
    this.item = params.item;
    this.pageTitleFormat = params.pageTitleFormat;
  }

  public async buildProperties(): Promise<WritableObjectProperties> {
    const properties: WritableObjectProperties = {};

    const titleDefinition = this.findPropertyDefinition('title', 'title');
    if (titleDefinition) {
      properties[titleDefinition.id] = {
        type: 'title',
        title: { value: await this.getPageTitle() },
      };
    }

    for (const fieldDefinition of this.fieldDefinitions) {
      const propertyDefinition = this.findPropertyDefinition(
        fieldDefinition.name,
        fieldDefinition.type,
      );
      if (!propertyDefinition) continue;

      properties[propertyDefinition.id] =
        await fieldDefinition.buildValue(propertyDefinition);
    }

    return properties;
  }

  private findPropertyDefinition(
    name: string,
    type: PropertyDefinitionType,
  ): PropertyDefinition | undefined {
    return this.structure.propertyDefinitions.find(
      (definition) =>
        definition.writable &&
        definition.type === type &&
        (type === 'title' ||
          definition.name.toLowerCase() === name.toLowerCase()),
    );
  }

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

  private fieldDefinitions: FieldDefinition[] = [
    {
      name: 'Abstract',
      type: 'text',
      buildValue: () => buildTextValue(this.item.getField('abstractNote')),
    },
    {
      name: 'Authors',
      type: 'text',
      buildValue: () => {
        const primaryCreatorTypeID = Zotero.CreatorTypes.getPrimaryIDForType(
          this.item.itemTypeID,
        );
        if (!primaryCreatorTypeID) return buildTextValue(null);

        const authors = this.item
          .getCreators()
          .filter(({ creatorTypeID }) => creatorTypeID === primaryCreatorTypeID)
          .map(formatCreatorName)
          .join('\n');

        return buildTextValue(authors);
      },
    },
    {
      name: 'Citation Key',
      type: 'text',
      buildValue: () => buildTextValue(this.getCitationKey()),
    },
    {
      name: 'Collections',
      type: 'text',
      buildValue: () =>
        buildTextValue(
          Zotero.Collections.get(this.item.getCollections())
            .map(buildCollectionFullName)
            .join(', '),
        ),
    },
    {
      name: 'Date',
      type: 'text',
      buildValue: () => buildTextValue(this.item.getField('date')),
    },
    {
      name: 'Date Added',
      type: 'date',
      buildValue: () => buildDateValue(parseItemDate(this.item.dateAdded)),
    },
    {
      name: 'Date Modified',
      type: 'date',
      buildValue: () => buildDateValue(parseItemDate(this.item.dateModified)),
    },
    {
      name: 'DOI',
      type: 'url',
      buildValue: () => {
        const doi = this.item.getField('DOI');
        return buildUrlValue(doi ? `https://doi.org/${doi}` : null);
      },
    },
    {
      name: 'Editors',
      type: 'text',
      buildValue: () => {
        const editorTypeID = Zotero.CreatorTypes.getID('editor');
        if (!editorTypeID) return buildTextValue(null);

        const editors = this.item
          .getCreators()
          .filter(({ creatorTypeID }) => creatorTypeID === editorTypeID)
          .map(formatCreatorName)
          .join('\n');

        return buildTextValue(editors);
      },
    },
    {
      name: 'Extra',
      type: 'text',
      buildValue: () => buildTextValue(this.item.getField('extra')),
    },
    {
      name: 'File Path',
      type: 'text',
      buildValue: async () => {
        const attachment = await this.item.getBestAttachment();
        if (!attachment) return buildTextValue(null);

        return buildTextValue((await attachment.getFilePathAsync()) || null);
      },
    },
    {
      name: 'Full Citation',
      type: 'text',
      buildValue: async () => buildTextValue(await this.getFullCitation()),
    },
    {
      name: 'In-Text Citation',
      type: 'text',
      buildValue: async () => buildTextValue(await this.getInTextCitation()),
    },
    {
      name: 'Item Type',
      type: 'label',
      buildValue: (propertyDefinition) =>
        buildLabelValue(propertyDefinition, [
          Zotero.ItemTypes.getLocalizedString(this.item.itemTypeID),
        ]),
    },
    {
      name: 'Place',
      type: 'text',
      buildValue: () => buildTextValue(this.item.getField('place')),
    },
    {
      name: 'Proceedings Title',
      type: 'text',
      buildValue: () => buildTextValue(this.item.getField('proceedingsTitle')),
    },
    {
      name: 'Publication',
      type: 'text',
      buildValue: () => buildTextValue(this.item.getField('publicationTitle')),
    },
    {
      name: 'Series Title',
      type: 'text',
      buildValue: () => buildTextValue(this.item.getField('seriesTitle')),
    },
    {
      name: 'Short Title',
      type: 'text',
      buildValue: () => buildTextValue(this.getShortTitle()),
    },
    {
      name: 'Tags',
      type: 'text',
      buildValue: () =>
        buildTextValue(
          this.item
            .getTags()
            .filter(({ tag }) => tag !== CAPACITIES_TAG_NAME)
            .map(({ tag }) => tag)
            .join(', '),
        ),
    },
    {
      name: 'Title',
      type: 'text',
      buildValue: () => buildTextValue(this.getTitle()),
    },
    {
      name: 'URL',
      type: 'url',
      buildValue: () => buildUrlValue(this.item.getField('url')),
    },
    {
      name: 'Year',
      type: 'number',
      buildValue: () => {
        const year = Number.parseInt(this.item.getField('year') || '');
        return buildNumberValue(Number.isNaN(year) ? null : year);
      },
    },
    {
      name: 'Zotero URI',
      type: 'url',
      buildValue: () => buildUrlValue(getItemURL(this.item)),
    },
  ];
}
