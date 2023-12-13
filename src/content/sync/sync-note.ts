import { APIErrorCode, Client } from '@notionhq/client';

import {
  getNotionPageID,
  getSyncedNotes,
  saveSyncedNote,
} from '../data/item-data';

import { convertHtmlToBlocks } from './html-to-notion';
import { LIMITS } from './notion-limits';
import { ChildBlock } from './notion-types';
import { isNotionErrorWithCode } from './notion-utils';

/**
 * Sync a Zotero note item to Notion as children blocks of the page for its
 * parent regular item.
 *
 * All notes are children of a single toggle heading block on the page. This
 * enables Notero to have a single container on the page where it can update
 * note content without impacting anything else on the page added by the user.
 * Within this top-level container block, each note is contained within its own
 * toggle heading block using the note title.
 *
 * Syncing a note performs the following steps:
 * 1. If the top-level container block ID is not saved in Zotero, create the
 *    block by appending it to the page and save its ID.
 * 2. If a block ID is saved in Zotero for the note's toggle heading, delete
 *    the block (including all its children).
 * 3. Append a new toggle heading block with the note content as a child of
 *    the top-level container block.
 *
 * @param notion an initialized Notion `Client` instance
 * @param noteItem the Zotero note item to sync to Notion
 */
export async function syncNote(
  notion: Client,
  noteItem: Zotero.Item,
): Promise<void> {
  const regularItem = noteItem.topLevelItem;
  const pageID = getNotionPageID(regularItem);

  if (!pageID) {
    throw new Error('Cannot sync note for item that is not synced.');
  }

  const syncedNotes = getSyncedNotes(regularItem);
  let { containerBlockID } = syncedNotes;

  if (!containerBlockID) {
    containerBlockID = await createContainerBlock(notion, pageID);
  }

  const existingNoteBlockID = syncedNotes.notes?.[noteItem.key]?.blockID;

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

  await saveSyncedNote(
    regularItem,
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

  const blockBatches = buildNoteBlockBatches(noteItem);

  for (const blocks of blockBatches) {
    await notion.blocks.children.append({
      block_id: noteBlockID,
      children: blocks,
    });
  }

  return noteBlockID;
}

function buildNoteBlockBatches(noteItem: Zotero.Item): ChildBlock[][] {
  const blocks = convertHtmlToBlocks(noteItem.getNote());

  const numBatches = Math.ceil(blocks.length / LIMITS.BLOCK_ARRAY_ELEMENTS);
  const batches = new Array<ChildBlock[]>(numBatches);
  let offset = 0;
  let nextOffset = LIMITS.BLOCK_ARRAY_ELEMENTS;

  for (let i = 0; i < numBatches; ++i) {
    batches[i] = blocks.slice(offset, nextOffset);
    offset = nextOffset;
    nextOffset += LIMITS.BLOCK_ARRAY_ELEMENTS;
  }

  return batches;
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
