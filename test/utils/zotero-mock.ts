import { beforeAll } from 'vitest';
import { DeepMockProxy, MockProxy, mock } from 'vitest-mock-extended';

const collectionsStore = new Map<Zotero.Collection['id'], Zotero.Collection>();
const itemsStore = new Map<Zotero.Item['id'], Zotero.Item>();
const collectionItemsStore = new Map<
  Zotero.Collection['id'],
  Set<Zotero.Item>
>();

let idCounter = 0;

function getDataObjectID(): Zotero.DataObjectID {
  return ++idCounter;
}

export const zoteroMock = Zotero as DeepMockProxy<typeof Zotero>;

export function createZoteroCollectionMock(
  ...args: Parameters<typeof mock<Zotero.Collection>>
): MockProxy<Zotero.Collection> {
  const id = getDataObjectID();
  const key = `key${id}`;
  const collectionMock = mock<Zotero.Collection>(
    { ...args[0], id, key },
    args[1],
  );

  collectionsStore.set(id, collectionMock);

  collectionMock.getChildCollections.mockReturnValue([]);

  collectionMock.getChildItems.mockImplementation(() =>
    Array.from(collectionItemsStore.get(id) || []),
  );

  return collectionMock;
}

export function createZoteroItemMock(
  ...args: Parameters<typeof mock<Zotero.Item>>
): MockProxy<Zotero.Item> {
  const id = getDataObjectID();
  const key = `key${id}`;
  const itemMock = mock<Zotero.Item>({ ...args[0], id, key }, args[1]);

  itemsStore.set(id, itemMock);

  itemMock.addToCollection.mockImplementation((collectionID) => {
    const parsedID =
      typeof collectionID === 'string' ? parseInt(collectionID) : collectionID;
    const items = collectionItemsStore.get(parsedID) || new Set();
    items.add(itemMock);
    collectionItemsStore.set(parsedID, items);
  });

  itemMock.getCollections.mockImplementation(() => {
    const collectionIDs: Zotero.DataObjectID[] = [];
    collectionItemsStore.forEach((items, collectionID) => {
      if (items.has(itemMock)) collectionIDs.push(collectionID);
    });
    return collectionIDs;
  });

  return itemMock;
}

export function mockZoteroPrefs() {
  const prefsStore = new Map<string, Zotero.Prefs.Value>();

  zoteroMock.Prefs.get.mockImplementation(prefsStore.get.bind(prefsStore));
  zoteroMock.Prefs.set.mockImplementation(prefsStore.set.bind(prefsStore));
}

beforeAll(() => {
  zoteroMock.Collections.get.mockImplementation((ids) => {
    if (Array.isArray(ids)) {
      return ids.map((id) => collectionsStore.get(id)).filter(Boolean);
    }
    return collectionsStore.get(ids) || false;
  });

  zoteroMock.Items.get.mockImplementation((ids) => {
    if (Array.isArray(ids)) {
      return ids.map((id) => itemsStore.get(id)).filter(Boolean);
    }
    return itemsStore.get(ids) || false;
  });
});
