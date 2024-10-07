export class ItemSyncError extends Error {
  public readonly item: Zotero.Item;
  public readonly name = 'ItemSyncError';

  public constructor(cause: unknown, item: Zotero.Item) {
    super(`Failed to sync item with ID ${item.id} due to ${String(cause)}`, {
      cause,
    });
    this.item = item;
  }
}
