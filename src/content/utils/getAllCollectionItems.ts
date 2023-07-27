/**
 * Returns an array of items in the collection and all descendant collections.
 * Note that the resulting array may include duplicate items.
 * @param collection The collection to get items for.
 * @returns An array of items (which may include duplicates).
 */
export function getAllCollectionItems(
  collection: Zotero.Collection
): Zotero.Item[] {
  return collection
    .getChildCollections(false)
    .reduce(
      (items, childCollection) =>
        items.concat(getAllCollectionItems(childCollection)),
      collection.getChildItems(false)
    );
}
