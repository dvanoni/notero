import { Client, Logger, LogLevel } from '@notionhq/client';
import {
  CreatePageParameters,
  CreatePageResponse,
  GetDatabaseResponse,
} from '@notionhq/client/build/src/api-endpoints';
import 'core-js/stable/object/from-entries';
import NoteroItem from './notero-item';

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
  { [P in T]: any }
>[T];

const TEXT_CONTENT_MAX_LENGTH = 2000;

export default class Notion {
  private readonly client: Client;
  private readonly databaseID: string;
  private _databaseProperties?: DatabaseProperties;

  static URL_PROTOCOL = 'notion:';

  static logger: Logger = (level, message, extraInfo) => {
    Zotero.log(
      `${message} - ${JSON.stringify(extraInfo)}`,
      level === LogLevel.ERROR ? 'error' : 'warning'
    );
  };

  static buildRichText(content: string): PropertyRequest<'rich_text'> {
    return [
      {
        text: {
          content: Notion.truncateTextToMaxLength(content),
        },
      },
    ];
  }

  static convertWebURLToLocal(url: string): string {
    return url.replace(/^https:/, this.URL_PROTOCOL);
  }

  static truncateTextToMaxLength(str: string): string {
    return str.substr(0, TEXT_CONTENT_MAX_LENGTH);
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

  public async addItemToDatabase(
    item: NoteroItem
  ): Promise<CreatePageResponse> {
    return this.client.pages.create({
      parent: {
        database_id: this.databaseID,
      },
      properties: await this.buildItemProperties(item),
    });
  }

  private async buildItemProperties(
    item: NoteroItem
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
        title: Notion.buildRichText(
          (await item.getInTextCitation()) || item.title
        ),
      },
    };

    const propertyDefinitions: Definition[] = [
      {
        name: 'Authors',
        type: 'rich_text',
        buildRequest: () => Notion.buildRichText(item.authors.join('\n')),
      },
      {
        name: 'DOI',
        type: 'url',
        buildRequest: () => item.doi && `https://doi.org/${item.doi}`,
      },
      {
        name: 'Full Citation',
        type: 'rich_text',
        buildRequest: async () =>
          Notion.buildRichText((await item.getFullCitation()) || item.title),
      },
      {
        name: 'In-Text Citation',
        type: 'rich_text',
        buildRequest: async () =>
          Notion.buildRichText((await item.getInTextCitation()) || item.title),
      },
      {
        name: 'Item Type',
        type: 'select',
        buildRequest: () => ({
          name: item.itemType,
        }),
      },
      {
        name: 'Title',
        type: 'rich_text',
        buildRequest: () => Notion.buildRichText(item.title),
      },
      {
        name: 'URL',
        type: 'url',
        buildRequest: () => item.url,
      },
      {
        name: 'Year',
        type: 'number',
        buildRequest: () => item.year,
      },
      {
        name: 'Zotero URI',
        type: 'url',
        buildRequest: () => item.zoteroURI,
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
