export type NoteroItem = {
  authors: string[];
  doi: string | null;
  itemType: string;
  title: string;
  url: string | null;
  year: number | null;
  zoteroURI: string;
};

export enum NoteroPref {
  collectionName = 'collectionName',
  notionToken = 'notionToken',
  notionDatabaseID = 'notionDatabaseID',
}
