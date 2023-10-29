import { NOTION_TAG_NAME } from '../constants';
import { NoteroPref, getNoteroPref } from '../prefs/notero-pref';
import {
  convertWebURLToAppURL,
  getPageIDFromURL,
  isNotionURL,
} from '../sync/notion-utils';
import { getDOMParser, isObject } from '../utils';

const SYNCED_NOTES_ID = 'notero-synced-notes';

type SyncedNoteBlockIDs = {
  containerBlockID?: string;
  noteBlockIDs?: {
    [noteItemKey: Zotero.DataObjectKey]: string;
  };
};

export class NoteroItem {
  public readonly zoteroItem: Zotero.Item;

  public constructor(zoteroItem: Zotero.Item) {
    this.zoteroItem = zoteroItem;
  }

  private getAllNotionLinkAttachments(): Zotero.Item[] {
    const attachmentIDs = this.zoteroItem
      .getAttachments(false)
      .slice()
      // Sort to get largest ID first
      .sort((a, b) => b - a);

    return Zotero.Items.get(attachmentIDs).filter((attachment) =>
      isNotionURL(attachment.getField('url')),
    );
  }

  public getNotionLinkAttachment(): Zotero.Item | undefined {
    return this.getAllNotionLinkAttachments()[0];
  }

  public getNotionPageID(): string | undefined {
    const notionURL = this.getNotionLinkAttachment()?.getField('url');
    return notionURL && getPageIDFromURL(notionURL);
  }

  public async saveNotionLinkAttachment(webURL: string): Promise<void> {
    const appURL = convertWebURLToAppURL(webURL);
    const attachments = this.getAllNotionLinkAttachments();

    if (attachments.length > 1) {
      const attachmentIDs = attachments.slice(1).map(({ id }) => id);
      await Zotero.Items.erase(attachmentIDs);
    }

    let attachment = attachments.length ? attachments[0] : null;

    if (attachment) {
      attachment.setField('url', appURL);
    } else {
      attachment = await Zotero.Attachments.linkFromURL({
        parentItemID: this.zoteroItem.id,
        title: 'Notion',
        url: appURL,
        saveOptions: {
          skipNotifier: true,
        },
      });
    }

    this.updateNotionLinkAttachmentNote(attachment);

    await attachment.saveTx();
  }

  private getSyncedNotesJSON(
    this: void,
    attachment: Zotero.Item,
  ): string | undefined {
    const doc = getDOMParser().parseFromString(
      attachment.getNote(),
      'text/html',
    );

    return doc.getElementById(SYNCED_NOTES_ID)?.innerText;
  }

  public getSyncedNoteBlockIDs(
    attachment: Zotero.Item | undefined = this.getNotionLinkAttachment(),
  ): SyncedNoteBlockIDs {
    if (!attachment) return {};

    const syncedNotesJSON = this.getSyncedNotesJSON(attachment);
    if (!syncedNotesJSON) return {};

    const parsedValue = JSON.parse(syncedNotesJSON);

    if (!isObject(parsedValue)) return {};

    let containerBlockID, noteBlockIDs;

    if (typeof parsedValue.containerBlockID === 'string') {
      containerBlockID = parsedValue.containerBlockID;
    }

    if (isObject(parsedValue.noteBlockIDs)) {
      noteBlockIDs = Object.entries(parsedValue.noteBlockIDs)
        .filter(
          (entry): entry is [string, string] => typeof entry[1] === 'string',
        )
        .reduce<Record<string, string>>(
          (ids, [key, value]) => ({ ...ids, [key]: value }),
          {},
        );
    }

    return { containerBlockID, noteBlockIDs };
  }

  public async saveSyncedNoteBlockID(
    containerBlockID: string,
    noteBlockID: string,
    noteItemKey: Zotero.DataObjectKey,
  ) {
    const attachment = this.getNotionLinkAttachment();
    if (!attachment) return;

    const { noteBlockIDs } = this.getSyncedNoteBlockIDs(attachment);

    const syncedNoteBlockIDs = {
      containerBlockID,
      noteBlockIDs: {
        ...noteBlockIDs,
        [noteItemKey]: noteBlockID,
      },
    };

    this.updateNotionLinkAttachmentNote(attachment, syncedNoteBlockIDs);

    await attachment.saveTx();
  }

  private updateNotionLinkAttachmentNote(
    attachment: Zotero.Item,
    syncedNoteBlockIDs?: Required<SyncedNoteBlockIDs>,
  ) {
    let note = `
<h2 style="background-color: #ff666680;">Do not modify or delete!</h2>
<p>This link attachment serves as a reference for
<a href="https://github.com/dvanoni/notero">Notero</a>
so that it can properly update the Notion page for this item.</p>
<p>Last synced: ${new Date().toLocaleString()}</p>
`;

    if (getNoteroPref(NoteroPref.syncNotes)) {
      const syncedNotesJSON = syncedNoteBlockIDs
        ? JSON.stringify(syncedNoteBlockIDs)
        : this.getSyncedNotesJSON(attachment);

      if (syncedNotesJSON) {
        note += `<pre id="${SYNCED_NOTES_ID}">${syncedNotesJSON}</pre>`;
      }
    }

    attachment.setNote(note);
  }

  public async saveNotionTag(): Promise<void> {
    this.zoteroItem.addTag(NOTION_TAG_NAME);
    await this.zoteroItem.saveTx({ skipNotifier: true });
  }
}
