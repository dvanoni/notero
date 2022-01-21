export function buildCollectionFullName(collection: Zotero.Collection): string {
  const parentCollection =
    collection.parentID && Zotero.Collections.get(collection.parentID);

  if (!parentCollection) {
    return collection.name;
  }

  const fullName = buildCollectionFullName(parentCollection);
  return `${fullName} ▸ ${collection.name}`;
}

export function getXULElementById<E extends XUL.XULElement>(id: string): E {
  return document.getElementById(id) as unknown as E;
}

export function hasErrorStack(error: unknown): error is Required<Error> {
  return typeof (error as Error).stack !== 'undefined';
}
