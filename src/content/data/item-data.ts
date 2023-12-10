import { NOTION_TAG_NAME } from '../constants';
import { NoteroPref, getNoteroPref } from '../prefs/notero-pref';
import { getPageIDFromURL, isNotionURL } from '../sync/notion-utils';
import { getDOMParser, isObject } from '../utils';

const SYNCED_NOTES_ID = 'notero-synced-notes';

type SyncedNoteBlockIDs = {
  containerBlockID?: string;
  noteBlockIDs?: {
    [noteItemKey: Zotero.DataObjectKey]: string;
  };
};

function getAllNotionLinkAttachments(item: Zotero.Item): Zotero.Item[] {
  const attachmentIDs = item
    .getAttachments(false)
    .slice()
    // Sort to get largest ID first
    .sort((a, b) => b - a);

  return Zotero.Items.get(attachmentIDs).filter((attachment) =>
    isNotionURL(attachment.getField('url')),
  );
}

export function getNotionLinkAttachment(
  item: Zotero.Item,
): Zotero.Item | undefined {
  return getAllNotionLinkAttachments(item)[0];
}

export function getNotionPageID(item: Zotero.Item): string | undefined {
  const notionURL = getNotionLinkAttachment(item)?.getField('url');
  return notionURL && getPageIDFromURL(notionURL);
}

export async function saveNotionLinkAttachment(
  item: Zotero.Item,
  appURL: string,
): Promise<void> {
  const attachments = getAllNotionLinkAttachments(item);

  if (attachments.length > 1) {
    const attachmentIDs = attachments.slice(1).map(({ id }) => id);
    await Zotero.Items.erase(attachmentIDs);
  }

  let attachment = attachments.length ? attachments[0] : null;

  if (attachment) {
    attachment.setField('url', appURL);
  } else {
    attachment = await Zotero.Attachments.linkFromURL({
      parentItemID: item.id,
      title: 'Notion',
      url: appURL,
      saveOptions: {
        skipNotifier: true,
      },
    });
  }

  updateNotionLinkAttachmentNote(attachment);

  await attachment.saveTx();
}

function getSyncedNotesJSON(attachment: Zotero.Item): string | undefined {
  const doc = getDOMParser().parseFromString(attachment.getNote(), 'text/html');

  return doc.getElementById(SYNCED_NOTES_ID)?.innerText;
}

export function getSyncedNoteBlockIDs(item: Zotero.Item): SyncedNoteBlockIDs {
  const attachment = getNotionLinkAttachment(item);
  if (!attachment) return {};

  return getSyncedNoteBlockIDsFromAttachment(attachment);
}

function getSyncedNoteBlockIDsFromAttachment(
  attachment: Zotero.Item,
): SyncedNoteBlockIDs {
  const syncedNotesJSON = getSyncedNotesJSON(attachment);
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

export async function saveSyncedNoteBlockID(
  item: Zotero.Item,
  containerBlockID: string,
  noteBlockID: string,
  noteItemKey: Zotero.DataObjectKey,
) {
  const attachment = getNotionLinkAttachment(item);
  if (!attachment) return;

  const { noteBlockIDs } = getSyncedNoteBlockIDsFromAttachment(attachment);

  const syncedNoteBlockIDs = {
    containerBlockID,
    noteBlockIDs: {
      ...noteBlockIDs,
      [noteItemKey]: noteBlockID,
    },
  };

  updateNotionLinkAttachmentNote(attachment, syncedNoteBlockIDs);

  await attachment.saveTx();
}

function updateNotionLinkAttachmentNote(
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
      : getSyncedNotesJSON(attachment);

    if (syncedNotesJSON) {
      note += `<pre id="${SYNCED_NOTES_ID}">${syncedNotesJSON}</pre>`;
    }
  }

  attachment.setNote(note);
}

export async function saveNotionTag(item: Zotero.Item): Promise<void> {
  item.addTag(NOTION_TAG_NAME);
  await item.saveTx({ skipNotifier: true });
}
