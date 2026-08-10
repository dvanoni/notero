import {
  getCapacitiesObjectID,
  getSyncedNotes,
  saveSyncedNote,
} from '../data/item-data';
import { LocalizableError } from '../errors';
import { isObject } from '../utils';

import type { CapacitiesClient } from './capacities-client';
import { isCapacitiesNotFoundError } from './capacities-client';
import type { CapacitiesObject } from './capacities-types';
import { convertHtmlToMarkdown } from './html-to-markdown';
import type { SyncJobParams } from './sync-job';

/**
 * Sync a Zotero note item to Capacities as blocks nested within the object
 * for its parent regular item.
 *
 * All notes are nested under a single "Zotero Notes" container block on the
 * object. This gives Captero a single place it can update note content
 * without impacting anything else on the object added by the user. Within
 * this container, each note has its own heading block using the note title.
 *
 * Syncing a note performs the following steps:
 * 1. If the container block ID is not saved in Zotero, create it by
 *    appending it to the object and save its ID.
 * 2. If a block ID is saved in Zotero for the note's heading, delete that
 *    block (including all its children).
 * 3. Append a new heading block with the note title, nested under the
 *    container block, then append the note's content nested under that.
 *
 * @param noteItem the Zotero note item to sync to Capacities
 */
export async function syncNoteItem(
  noteItem: Zotero.Item,
  { capacities }: SyncJobParams,
): Promise<void> {
  if (noteItem.isTopLevelItem()) {
    throw new LocalizableError(
      'Cannot sync note without a parent item',
      'notero-error-note-without-parent',
    );
  }

  const regularItem = noteItem.topLevelItem;
  const objectID = getCapacitiesObjectID(regularItem);

  if (!objectID) {
    throw new LocalizableError(
      'Cannot sync note because its parent item is not synced',
      'notero-error-note-parent-not-synced',
    );
  }

  const syncedNotes = getSyncedNotes(regularItem);
  let containerBlockID = syncedNotes.containerBlockID;

  if (!containerBlockID) {
    containerBlockID = await createContainerBlock(capacities, objectID);
  }

  const existingNoteBlockID = syncedNotes.notes?.[noteItem.key]?.blockID;

  if (existingNoteBlockID) {
    await deleteNoteBlock(capacities, objectID, existingNoteBlockID);
  }

  let newNoteBlockID: string | undefined;

  try {
    newNoteBlockID = await createNoteBlock(
      capacities,
      objectID,
      containerBlockID,
      noteItem,
    );
  } catch (error) {
    if (!isCapacitiesNotFoundError(error)) throw error;

    containerBlockID = await createContainerBlock(capacities, objectID);
    newNoteBlockID = await createNoteBlock(
      capacities,
      objectID,
      containerBlockID,
      noteItem,
    );
  } finally {
    await saveSyncedNote(
      regularItem,
      containerBlockID,
      newNoteBlockID,
      noteItem.key,
    );
  }

  await addNoteBlockContent(capacities, objectID, newNoteBlockID, noteItem);
}

async function createContainerBlock(
  capacities: CapacitiesClient,
  objectID: string,
): Promise<string> {
  const response = await capacities.appendMarkdown(objectID, '## Zotero Notes');
  const blockID = getFirstAppendedBlockID(response);

  if (!blockID) {
    throw new LocalizableError(
      'Failed to create container block',
      'notero-error-note-sync-failed',
    );
  }

  return blockID;
}

async function createNoteBlock(
  capacities: CapacitiesClient,
  objectID: string,
  containerBlockID: string,
  noteItem: Zotero.Item,
): Promise<string> {
  const response = await capacities.appendMarkdown(
    objectID,
    `### ${noteItem.getNoteTitle()}`,
    { parentBlockId: containerBlockID },
  );
  const blockID = getFirstAppendedBlockID(response);

  if (!blockID) {
    throw new LocalizableError(
      'Failed to create note block',
      'notero-error-note-sync-failed',
    );
  }

  return blockID;
}

async function addNoteBlockContent(
  capacities: CapacitiesClient,
  objectID: string,
  noteBlockID: string,
  noteItem: Zotero.Item,
): Promise<void> {
  let markdown: string;
  try {
    markdown = convertHtmlToMarkdown(noteItem.getNote());
  } catch (error) {
    throw new LocalizableError(
      'Failed to convert note content to Markdown',
      'notero-error-note-conversion-failed',
      { cause: error },
    );
  }

  if (!markdown) return;

  await capacities.appendMarkdown(objectID, markdown, {
    parentBlockId: noteBlockID,
  });
}

async function deleteNoteBlock(
  capacities: CapacitiesClient,
  objectID: string,
  blockID: string,
): Promise<void> {
  try {
    await capacities.deleteBlock(objectID, blockID);
  } catch (error) {
    if (!isCapacitiesNotFoundError(error)) throw error;
  }
}

function getFirstAppendedBlockID(object: CapacitiesObject): string | undefined {
  const [firstBlockList] = Object.values(object.blocks ?? {});
  const firstBlock = firstBlockList?.[0];
  return isObject(firstBlock) && typeof firstBlock.id === 'string'
    ? firstBlock.id
    : undefined;
}
