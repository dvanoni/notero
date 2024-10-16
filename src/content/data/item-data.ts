import { NOTION_TAG_NAME } from '../constants';
import { getPageIDFromURL, isNotionURL } from '../sync/notion-utils';
import { isObject } from '../utils';

const SYNCED_NOTES_ID = 'notero-synced-notes';

export type SyncedNotes = {
  containerBlockID?: string;
  notes?: {
    [noteItemKey: Zotero.DataObjectKey]: {
      blockID: string;
      syncedAt?: Date;
    };
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

  let attachment = attachments[0];
  let pageIDChanged = false;

  if (attachment) {
    const currentURL = attachment.getField('url');
    pageIDChanged =
      !currentURL || getPageIDFromURL(currentURL) !== getPageIDFromURL(appURL);
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

  const syncedNotes = pageIDChanged ? {} : undefined;
  updateNotionLinkAttachmentNote(attachment, syncedNotes);

  await attachment.saveTx();
}

function getSyncedNotesJSON(attachment: Zotero.Item): string | undefined {
  const domParser = new DOMParser();
  const doc = domParser.parseFromString(attachment.getNote(), 'text/html');

  return doc.getElementById(SYNCED_NOTES_ID)?.innerHTML;
}

export function getSyncedNotes(item: Zotero.Item): SyncedNotes {
  const attachment = getNotionLinkAttachment(item);
  if (!attachment) return {};

  return getSyncedNotesFromAttachment(attachment);
}

export function getSyncedNotesFromAttachment(
  attachment: Zotero.Item,
): SyncedNotes {
  const syncedNotesJSON = getSyncedNotesJSON(attachment);
  if (!syncedNotesJSON) return {};

  const parsedValue = JSON.parse(syncedNotesJSON);

  if (!isObject(parsedValue)) return {};

  let containerBlockID;
  const notes: Required<SyncedNotes>['notes'] = {};

  if (typeof parsedValue.containerBlockID === 'string') {
    containerBlockID = parsedValue.containerBlockID;
  }

  if (isObject(parsedValue.noteBlockIDs)) {
    // Convert from original format
    Object.entries(parsedValue.noteBlockIDs).forEach(([key, value]) => {
      if (typeof value === 'string') {
        notes[key] = { blockID: value };
      }
    });
  }

  if (isObject(parsedValue.notes)) {
    Object.entries(parsedValue.notes).forEach(([key, value]) => {
      if (!isObject(value)) return;

      const { blockID, syncedAt } = value;
      if (typeof blockID !== 'string') return;

      notes[key] = {
        blockID,
        syncedAt: typeof syncedAt === 'string' ? new Date(syncedAt) : undefined,
      };
    });
  }

  return { containerBlockID, notes };
}

export async function saveSyncedNote(
  item: Zotero.Item,
  containerBlockID: string,
  noteBlockID: string | undefined,
  noteItemKey: Zotero.DataObjectKey,
) {
  const attachment = getNotionLinkAttachment(item);
  if (!attachment) return;

  const { notes } = getSyncedNotesFromAttachment(attachment);

  const syncedNotes = {
    containerBlockID,
    notes: {
      ...notes,
      ...(noteBlockID && {
        [noteItemKey]: {
          blockID: noteBlockID,
          syncedAt: new Date(),
        },
      }),
    },
  };

  updateNotionLinkAttachmentNote(attachment, syncedNotes);

  await attachment.saveTx();
}

function updateNotionLinkAttachmentNote(
  attachment: Zotero.Item,
  syncedNotes?: SyncedNotes,
) {
  let note = `
<h2 style="background-color: #ff666680;">Do not modify or delete!</h2>
<p>This link attachment serves as a reference for
<a href="https://github.com/dvanoni/notero">Notero</a>
so that it can properly update the Notion page for this item.</p>
<p>Last synced: ${new Date().toLocaleString()}</p>
`;

  const syncedNotesJSON = syncedNotes
    ? JSON.stringify(syncedNotes)
    : getSyncedNotesJSON(attachment);

  if (syncedNotesJSON) {
    note += `<pre id="${SYNCED_NOTES_ID}">${syncedNotesJSON}</pre>`;
  }

  attachment.setNote(note);
}

export async function saveNotionTag(item: Zotero.Item): Promise<void> {
  item.addTag(NOTION_TAG_NAME);
  await item.saveTx({ skipNotifier: true });
}
