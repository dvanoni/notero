import {
  APIErrorCode,
  APIResponseError,
  Client,
  Logger,
  LogLevel,
} from '@notionhq/client';
import {
  CreatePageParameters,
  CreatePageResponse,
  GetDatabaseResponse,
  UpdatePageResponse,
} from '@notionhq/client/build/src/api-endpoints';
import 'core-js/stable/object/from-entries';

import NoteroItem from './notero-item';
import { log } from './utils';

type CreateDatabasePageParameters = Extract<
  CreatePageParameters,
  {
    parent: {
      database_id: string;
    };
  }
>;

type DatabasePageProperties = CreateDatabasePageParameters['properties'];

type DatabaseProperties = GetDatabaseResponse['properties'];

type DatabasePageProperty = Extract<
  DatabasePageProperties[string],
  { type?: string }
>;

type PropertyType = NonNullable<DatabasePageProperty['type']>;

type PropertyRequest<T extends PropertyType> = Extract<
  DatabasePageProperty,
  { [P in T]: unknown }
>[T];

export type TitleBuilder = (item: NoteroItem) => string | Promise<string>;

const TEXT_CONTENT_MAX_LENGTH = 2000;

export default class Notion {
  private readonly client: Client;
  private readonly databaseID: string;
  private _databaseProperties?: DatabaseProperties;

  static APP_URL_PROTOCOL = 'notion:';

  static PAGE_URL_REGEX = new RegExp(
    `^${Notion.APP_URL_PROTOCOL}.+([0-9a-f]{32})$`
  );

  static logger: Logger = (level, message, extraInfo) => {
    log(
      `${message} - ${JSON.stringify(extraInfo)}`,
      level === LogLevel.ERROR ? 'error' : 'warning'
    );
  };

  static buildRichText(content: string | null): PropertyRequest<'rich_text'> {
    if (!content) return [];

    return [
      {
        text: {
          content: Notion.truncateTextToMaxLength(content),
        },
      },
    ];
  }

  static buildDate(date: Date | null): PropertyRequest<'date'> {
    return date && { start: date.toISOString() };
  }

  static convertWebURLToAppURL(url: string): string {
    return url.replace(/^https:/, this.APP_URL_PROTOCOL);
  }

  static getPageIDFromURL(url: string): string | undefined {
    const matches = url.match(this.PAGE_URL_REGEX);
    return matches ? matches[1] : undefined;
  }

  static sanitizeSelectOption(text: string): string {
    return text.replace(/,/g, ';');
  }

  static truncateTextToMaxLength(text: string): string {
    return text.substr(0, TEXT_CONTENT_MAX_LENGTH);
  }

  public constructor(authToken: string, databaseID: string) {
    this.client = new Client({
      auth: authToken,
      logger: Notion.logger,
    });
    this.databaseID = databaseID;
  }

  private async getDatabaseProperties(): Promise<DatabaseProperties> {
    if (!this._databaseProperties) {
      const database = await this.client.databases.retrieve({
        database_id: this.databaseID,
      });
      this._databaseProperties = database.properties;
    }
    return this._databaseProperties;
  }

  public async saveItemToDatabase(
    item: NoteroItem,
    buildTitle: TitleBuilder
  ): Promise<CreatePageResponse & UpdatePageResponse> {
    const pageID = item.getNotionPageID();
    const properties = await this.buildItemProperties(item, buildTitle);

    if (pageID) {
      try {
        return await this.client.pages.update({ page_id: pageID, properties });
      } catch (error) {
        if (
          !APIResponseError.isAPIResponseError(error) ||
          error.code !== APIErrorCode.ObjectNotFound
        ) {
          throw error;
        }
      }
    }

    return this.client.pages.create({
      parent: { database_id: this.databaseID },
      properties,
    });
  }

  private async buildItemProperties(
    item: NoteroItem,
    buildTitle: TitleBuilder
  ): Promise<DatabasePageProperties> {
    type Definition<T extends PropertyType = PropertyType> = {
      [P in T]: {
        name: string;
        type: P;
        buildRequest: () => PropertyRequest<P> | Promise<PropertyRequest<P>>;
      };
    }[T];

    const databaseProperties = await this.getDatabaseProperties();

    const databaseHasProperty = ({ name, type }: Definition) =>
      databaseProperties[name]?.type === type;

    const itemProperties: DatabasePageProperties = {
      title: {
        title: Notion.buildRichText(await buildTitle(item)),
      },
    };

    const propertyDefinitions: Definition[] = [
      {
        name: 'Abstract',
        type: 'rich_text',
        buildRequest: () => Notion.buildRichText(item.getAbstract()),
      },
      {
        name: 'Authors',
        type: 'rich_text',
        buildRequest: () => Notion.buildRichText(item.getAuthors().join('\n')),
      },
      {
        name: 'Collections',
        type: 'multi_select',
        buildRequest: () =>
          item.getCollections().map((collection) => ({
            name: Notion.sanitizeSelectOption(collection),
          })),
      },
      {
        name: 'Date',
        type: 'rich_text',
        buildRequest: () => Notion.buildRichText(item.getDate()),
      },
      {
        name: 'Date Added',
        type: 'date',
        buildRequest: () => Notion.buildDate(item.getDateAdded()),
      },
      {
        name: 'DOI',
        type: 'url',
        buildRequest: () => item.getDOI(),
      },
      {
        name: 'Editors',
        type: 'rich_text',
        buildRequest: () => Notion.buildRichText(item.getEditors().join('\n')),
      },
      {
        name: 'File Path',
        type: 'rich_text',
        buildRequest: async () =>
          Notion.buildRichText(await item.getFilePath()),
      },
      {
        name: 'Full Citation',
        type: 'rich_text',
        buildRequest: async () =>
          Notion.buildRichText(
            (await item.getFullCitation()) || item.getTitle()
          ),
      },
      {
        name: 'In-Text Citation',
        type: 'rich_text',
        buildRequest: async () =>
          Notion.buildRichText(
            (await item.getInTextCitation()) || item.getTitle()
          ),
      },
      {
        name: 'Item Type',
        type: 'select',
        buildRequest: () => ({
          name: item.getItemType(),
        }),
      },
      {
        name: 'Short Title',
        type: 'rich_text',
        buildRequest: () => Notion.buildRichText(item.getShortTitle()),
      },
      {
        name: 'Tags',
        type: 'multi_select',
        buildRequest: () =>
          item.getTags().map((tag) => ({
            name: Notion.sanitizeSelectOption(tag),
          })),
      },
      {
        name: 'Title',
        type: 'rich_text',
        buildRequest: () => Notion.buildRichText(item.getTitle()),
      },
      {
        name: 'URL',
        type: 'url',
        buildRequest: () => item.getURL(),
      },
      {
        name: 'Year',
        type: 'number',
        buildRequest: () => item.getYear(),
      },
      {
        name: 'Zotero URI',
        type: 'url',
        buildRequest: () => item.getZoteroURI(),
      },
    ];

    const validPropertyDefinitions =
      propertyDefinitions.filter(databaseHasProperty);

    for (const { name, type, buildRequest } of validPropertyDefinitions) {
      const request = await buildRequest();

      itemProperties[name] = {
        type,
        [type]: request,
      } as DatabasePageProperty;
    }

    return itemProperties;
  }
}
