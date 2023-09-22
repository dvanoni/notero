import EventEmitter from 'eventemitter3';

import { log } from '../utils';

import type { Service } from './service';

type CollectionID = Zotero.Collection['id'];
type ItemID = Zotero.Item['id'];
type TagID = Zotero.DataObjectID;

type NotifierIDs = readonly (number | string)[];

type NotifierEvents = {
  'collection.delete': CollectionID[];
  'collection.modify': CollectionID[];
  'collection-item.add': [collectionID: CollectionID, itemID: ItemID][];
  'item.modify': ItemID[];
  'item-tag.modify': [itemID: ItemID, tagID: TagID][];
  'item-tag.remove': [itemID: ItemID, tagID: TagID][];
};

type NotifierEventName = keyof NotifierEvents;

type NotifierEventsMap = {
  [E in NotifierEventName]: [event: E, ids: NotifierEvents[E]];
};

type NotifierEventListener = <E extends NotifierEventName>(
  ...[event, ids]: NotifierEventsMap[E]
) => void;

export type NotifierEventParams = Parameters<NotifierEventListener>;

type EventTypes = {
  'notifier-event': NotifierEventListener;
  'request-sync-collection': (collection: Zotero.Collection) => void;
  'request-sync-items': (items: Zotero.Item[]) => void;
};

export class EventManager implements Service {
  private readonly emitter = new EventEmitter<EventTypes>();

  readonly emit = this.emitter.emit.bind(this.emitter);
  readonly addListener = this.emitter.addListener.bind(this.emitter);
  readonly removeListener = this.emitter.removeListener.bind(this.emitter);

  private observerID?: ReturnType<Zotero.Notifier['registerObserver']>;

  public startup() {
    this.registerObserver();
  }

  public shutdown() {
    this.emitter.removeAllListeners();
    this.unregisterObserver();
  }

  private registerObserver() {
    this.observerID = Zotero.Notifier.registerObserver(
      this.observer,
      ['collection', 'collection-item', 'item', 'item-tag'],
      'notero',
    );
  }

  private unregisterObserver() {
    if (this.observerID) {
      Zotero.Notifier.unregisterObserver(this.observerID);
      delete this.observerID;
    }
  }

  private observer = {
    notify: (
      event: string,
      type: Zotero.Notifier.Type,
      ids: NotifierIDs,
      _extraData: Record<string, unknown>,
    ) => {
      log(`Notified of ${event} ${type} for IDs ${JSON.stringify(ids)}`);

      const eventName = `${type}.${event}`;

      switch (eventName) {
        case 'collection.delete':
        case 'collection.modify':
        case 'item.modify':
          this.emitter.emit('notifier-event', eventName, ids as number[]);
          break;
        case 'collection-item.add':
        case 'item-tag.modify':
        case 'item-tag.remove':
          this.emitter.emit(
            'notifier-event',
            eventName,
            this.mapCompoundIDs(ids),
          );
          break;
      }
    },
  };

  private mapCompoundIDs(this: void, ids: NotifierIDs): [number, number][] {
    return (ids as string[]).map((compoundID) => {
      const ids = compoundID.split('-').map(Number) as [number, number];
      return [ids[0], ids[1]];
    });
  }
}
