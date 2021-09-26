import 'core-js/stable/object/from-entries';
import { Client, Logger, LogLevel } from '@notionhq/client';
import { CreatePageResponse } from '@notionhq/client/build/src/api-endpoints';
import { NoteroItem } from './types';

export default class Notion {
  private client: Client;
  private databaseID: string;

  static logger: Logger = (level, message, extraInfo) => {
    Zotero.log(
      `${message} - ${JSON.stringify(extraInfo)}`,
      level === LogLevel.ERROR ? 'error' : 'warning'
    );
  };

  public constructor(authToken: string, databaseID: string) {
    this.client = new Client({
      auth: authToken,
      logger: Notion.logger,
    });
    this.databaseID = databaseID;
  }

  public addItemToDatabase(item: NoteroItem): Promise<CreatePageResponse> {
    return this.client.pages.create({
      parent: {
        database_id: this.databaseID,
      },
      properties: {
        title: {
          title: [
            {
              text: {
                content: item.title,
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
        'Item Type': {
          select: {
            name: item.itemType,
          },
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
      },
    });
  }
}
