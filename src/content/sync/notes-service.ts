import { BlockObjectRequest } from '@notionhq/client/build/src/api-endpoints';

import { EventManager, Service } from '../services';
import { log } from '../utils';

import { convertHtmlToBlocks } from './html-to-notion';
import { getNotionClient } from './notion-client';

async function replacePageContent(children: BlockObjectRequest[]) {
  const notionClient = getNotionClient();

  const pageID = '4c6164a5-45ad-4f13-ad67-b8303c21e1aa';

  // const existingChildren = await notionClient.blocks.children.list({
  //   block_id: pageID,
  // });

  let notesBlockID = Zotero.Prefs.get('extensions.notero.notesBlockID', true);

  if (typeof notesBlockID === 'string') {
    await notionClient.blocks.delete({ block_id: notesBlockID });
  }

  // for (const result of existingChildren.results) {
  // await notionClient.blocks.delete({ block_id: result.id });
  // }

  const { results } = await notionClient.blocks.children.append({
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

  notesBlockID = results[0].id;
  Zotero.Prefs.set('extensions.notero.notesBlockID', notesBlockID, true);

  await notionClient.blocks.children.append({
    block_id: notesBlockID,
    children,
  });
}

export class NotesService implements Service {
  listChildren = (block_id: string) => {
    const notionClient = getNotionClient();

    notionClient.blocks.children
      .list({ block_id })
      .then((response) =>
        log(`Retrieved block ${JSON.stringify(response, null, 2)}`)
      )
      .catch((error) => log(error, 'error'));
  };

  public startup() {
    EventManager.addListener('build-item-notes', this.buildItemNotes);
  }

  public shutdown() {
    EventManager.removeListener('build-item-notes', this.buildItemNotes);
  }

  private buildItemNotes = (item: Zotero.Item) => {
    const note = this.getNoteItem(item)?.getNote();

    if (!note) {
      log(`No notes for ${item.getDisplayTitle()}`);
      return;
    }

    log(note);

    const blocks = convertHtmlToBlocks(note);

    void replacePageContent(blocks);
  };

  private getNoteItem(item: Zotero.Item) {
    if (item.isNote()) return item;

    const noteIDs = item.getNotes(false);
    Zotero.Items.get(noteIDs)[0];
  }
}
