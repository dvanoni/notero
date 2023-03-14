import { BlockObjectRequest } from '@notionhq/client/build/src/api-endpoints';

import { EventManager, Service } from '../services';
import { log } from '../utils';

import { convertHtmlToBlocks } from './html-to-notion';
import { getNotionClient } from './notion-client';

/*

- each annotation goes under the heading "annotation"
- each note's content goes under the heading {note name} in the body of the page

- It would be nice if the color of the annotation was also preserved in the Notion page

- If a block ID is _not_ saved in Zotero, assume we haven't synced annotations into Notion yet
   - Create a new block on the page and save its ID into Zotero
   - Add all the annotations content as _children_ of the new block
- If a block ID _is_ saved in Zotero, assume we've previously synced annotations
   - Delete all the children of the block (because I imagine it would be too challenging to update annotations in place)
   - Add all the annotations content as children of the block

- Option to enable syncing of notes

- Handle `data-indent="1"` on paragraphs?

*/

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
