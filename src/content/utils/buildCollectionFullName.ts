export function buildCollectionFullName(collection: Zotero.Collection): string {
  const parentCollection =
    collection.parentID && Zotero.Collections.get(collection.parentID);

  if (!parentCollection) {
    return collection.name;
  }

  const fullName = buildCollectionFullName(parentCollection);
  return `${fullName} ▸ ${collection.name}`;
}
