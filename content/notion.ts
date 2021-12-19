import { Client, Logger, LogLevel } from '@notionhq/client';
import {
  CreatePageParameters,
  CreatePageResponse,
} from '@notionhq/client/build/src/api-endpoints';
import 'core-js/stable/object/from-entries';
import NoteroItem from './notero-item';

/* eslint-disable @typescript-eslint/indent */
type CreateDatabasePageParameters = Extract<
  CreatePageParameters,
  {
    parent: {
      database_id: string;
    };
  }
>;
/* eslint-enable @typescript-eslint/indent */

type DatabasePageProperties = CreateDatabasePageParameters['properties'];

const TEXT_CONTENT_MAX_LENGTH = 2000;

export default class Notion {
  private readonly client: Client;
  private readonly databaseID: string;

  static logger: Logger = (level, message, extraInfo) => {
    Zotero.log(
      `${message} - ${JSON.stringify(extraInfo)}`,
      level === LogLevel.ERROR ? 'error' : 'warning'
    );
  };

  static convertWebURLToLocal(url: string): string {
    return url.replace(/^https/, 'notion');
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

  public async addItemToDatabase(
    item: NoteroItem
  ): Promise<CreatePageResponse> {
    return this.client.pages.create({
      parent: {
        database_id: this.databaseID,
      },
      properties: await this.getItemProperties(item),
    });
  }

  private async getItemProperties(
    item: NoteroItem
  ): Promise<DatabasePageProperties> {
    return {
      title: {
        title: [
          {
            text: {
              content: Notion.truncateTextToMaxLength(
                (await item.getInTextCitation()) || item.title
              ),
            },
          },
        ],
      },
      Authors: {
        rich_text: [
          {
            text: {
              content: Notion.truncateTextToMaxLength(item.authors.join('\n')),
            },
          },
        ],
      },
      DOI: {
        url: item.doi && `https://doi.org/${item.doi}`,
      },
      'Full Citation': {
        rich_text: [
          {
            text: {
              content: Notion.truncateTextToMaxLength(
                (await item.getFullCitation()) || item.title
              ),
            },
          },
        ],
      },
      'In-Text Citation': {
        rich_text: [
          {
            text: {
              content: Notion.truncateTextToMaxLength(
                (await item.getInTextCitation()) || item.title
              ),
            },
          },
        ],
      },
      'Item Type': {
        select: {
          name: item.itemType,
        },
      },
      Title: {
        rich_text: [
          {
            text: {
              content: Notion.truncateTextToMaxLength(item.title),
            },
          },
        ],
      },
      URL: {
        url: item.url,
      },
      Year: {
        number: item.year,
      },
      'Zotero URI': {
        url: item.zoteroURI,
      },
    };
  }
}
