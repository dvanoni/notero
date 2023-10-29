import { APIErrorCode, Client } from '@notionhq/client';

import { NoteroItem } from '../notero-item';

import { convertHtmlToBlocks } from './html-to-notion';
import { isNotionErrorWithCode } from './notion-utils';

export async function syncNote(
  notion: Client,
  noteItem: Zotero.Item,
): Promise<void> {
  const noteroItem = new NoteroItem(noteItem.topLevelItem);
  const pageID = noteroItem.getNotionPageID();

  if (!pageID) {
    throw new Error('Cannot sync note for item that is not synced.');
  }

  const blockIDs = noteroItem.getSyncedNoteBlockIDs();
  let { containerBlockID } = blockIDs;

  if (!containerBlockID) {
    containerBlockID = await createContainerBlock(notion, pageID);
  }

  const existingNoteBlockID = blockIDs.noteBlockIDs?.[noteItem.key];

  if (existingNoteBlockID) {
    await deleteNoteBlock(notion, existingNoteBlockID);
  }

  let newNoteBlockID;

  try {
    newNoteBlockID = await createNoteBlock(notion, containerBlockID, noteItem);
  } catch (error) {
    if (!isNotionErrorWithCode(error, APIErrorCode.ObjectNotFound)) {
      throw error;
    }

    containerBlockID = await createContainerBlock(notion, pageID);
    newNoteBlockID = await createNoteBlock(notion, containerBlockID, noteItem);
  }

  await noteroItem.saveSyncedNoteBlockID(
    containerBlockID,
    newNoteBlockID,
    noteItem.key,
  );
}

async function createContainerBlock(
  notion: Client,
  pageID: string,
): Promise<string> {
  const { results } = await notion.blocks.children.append({
    block_id: pageID,
    children: [
      {
        heading_1: {
          rich_text: [{ text: { content: 'Zotero Notes' } }],
          is_toggleable: true,
        },
      },
    ],
  });

  if (!results[0]) throw new Error('Failed to create container block');

  return results[0].id;
}

async function createNoteBlock(
  notion: Client,
  containerBlockID: string,
  noteItem: Zotero.Item,
): Promise<string> {
  const { results } = await notion.blocks.children.append({
    block_id: containerBlockID,
    children: [
      {
        heading_1: {
          rich_text: [{ text: { content: noteItem.getNoteTitle() } }],
          is_toggleable: true,
        },
      },
    ],
  });

  if (!results[0]) throw new Error('Failed to create note block');

  const noteBlockID = results[0].id;

  await notion.blocks.children.append({
    block_id: noteBlockID,
    children: convertHtmlToBlocks(noteItem.getNote()),
  });

  return noteBlockID;
}

async function deleteNoteBlock(notion: Client, blockID: string): Promise<void> {
  try {
    await notion.blocks.delete({ block_id: blockID });
  } catch (error) {
    if (!isNotionErrorWithCode(error, APIErrorCode.ObjectNotFound)) {
      throw error;
    }
  }
}
