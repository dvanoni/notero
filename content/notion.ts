import 'core-js/stable/object/from-entries';
import { Client, Logger, LogLevel } from '@notionhq/client';
import {
  CreatePageParameters,
  CreatePageResponse,
} from '@notionhq/client/build/src/api-endpoints';
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

export default class Notion {
  private client: Client;
  private databaseID: string;

  static logger: Logger = (level, message, extraInfo) => {
    Zotero.log(
      `${message} - ${JSON.stringify(extraInfo)}`,
      level === LogLevel.ERROR ? 'error' : 'warning'
    );
  };

  static convertWebURLToLocal(url: string): string {
    return url.replace(/^https/, 'notion');
  }

  public constructor(authToken: string, databaseID: string) {
    this.client = new Client({
      auth: authToken,
      logger: Notion.logger,
    });
    this.databaseID = databaseID;
  }

  public async addItemToDatabase(item: NoteroItem): Promise<CreatePageResponse> {
    return this.client.pages.create({
      parent: {
        database_id: this.databaseID,
      },
      properties: await this.getItemProperties(item),
    });
  }

  private async getItemProperties(item: NoteroItem): Promise<DatabasePageProperties> {
    return {
      title: {
        title: [
          {
            text: {
              content: await item.getInTextCitation() || item.title,
            },
          },
        ],
      },
      Authors: {
        rich_text: [
          {
            text: {
              content: item.authors.join('\n'),
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
              content: await item.getFullCitation() || item.title,
            },
          },
        ],
      },
      'In-Text Citation': {
        rich_text: [
          {
            text: {
              content: await item.getInTextCitation() || item.title,
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
              content: item.title,
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
