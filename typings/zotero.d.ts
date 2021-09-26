declare namespace Zotero {
  interface Collection extends DataObject {
    name: string;
  }

  interface Collections extends DataObjects<Collection> {}

  interface DataObject {
    id: number;
    key: string;
  }

  interface DataObjects<T extends DataObject> {
    get<I = number | number[]>(ids: I): I extends number ? T | undefined : T[];
  }

  interface Item extends DataObject {
    getCreators(): { firstName: string; lastName: string }[];
    getDisplayTitle(includeAuthorAndDate?: boolean): string;
    getField(
      field: number | string,
      unformatted?: boolean,
      includeBaseMapped?: boolean
    ): string;
    isRegularItem(): boolean;
    itemTypeID: number;
    itemType: string;
  }

  interface Items extends DataObjects<Item> {}

  interface ItemTypes {
    getLocalizedString(idOrName: number | string): string;
  }

  interface Notifier {
    registerObserver(
      ref: {
        notify(
          event: string,
          type: string,
          ids: (number | string)[],
          extraData: Record<string, unknown>
        );
      },
      types?: string[],
      id?: string,
      priority?: number
    ): string;
    unregisterObserver(id: string);
  }

  interface Prefs {
    get(pref: string, global: boolean): boolean | number | string | undefined;
  }
}

declare const Zotero: {
  Collections: Zotero.Collections;
  Items: Zotero.Items;
  ItemTypes: Zotero.ItemTypes;
  Notifier: Zotero.Notifier;
  Prefs: Zotero.Prefs;
  debug(message: string);
  log(message: string);
};

// declare const Components: any
