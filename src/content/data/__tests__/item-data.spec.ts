import { describe, expect, it } from 'vitest';

import { createZoteroItemMock, mockZoteroPrefs } from '../../../../test/utils';
import { NoteroPref, setNoteroPref } from '../../prefs/notero-pref';
import {
  getSyncedNotesFromAttachment,
  saveNotionLinkAttachment,
} from '../item-data';

describe('getSyncedNotesFromAttachment', () => {
  it('loads expected data when synced notes are saved in original format', () => {
    const json = JSON.stringify({
      containerBlockID: 'container',
      noteBlockIDs: {
        keyA: 'blockA',
        keyB: 'blockB',
      },
    });
    const attachment = createZoteroItemMock();
    attachment.getNote.mockReturnValue(
      `<pre id="notero-synced-notes">${json}</pre>`,
    );

    expect(getSyncedNotesFromAttachment(attachment)).toStrictEqual({
      containerBlockID: 'container',
      notes: {
        keyA: { blockID: 'blockA' },
        keyB: { blockID: 'blockB' },
      },
    });
  });

  it('loads expected data when synced notes are saved in updated format', () => {
    const dateA = new Date(1000000000000);
    const dateB = new Date(1777777777777);
    const json = JSON.stringify({
      containerBlockID: 'container',
      notes: {
        keyA: { blockID: 'blockA', syncedAt: dateA },
        keyB: { blockID: 'blockB', syncedAt: dateB },
      },
    });
    const attachment = createZoteroItemMock();
    attachment.getNote.mockReturnValue(
      `<pre id="notero-synced-notes">${json}</pre>`,
    );

    expect(getSyncedNotesFromAttachment(attachment)).toStrictEqual({
      containerBlockID: 'container',
      notes: {
        keyA: { blockID: 'blockA', syncedAt: dateA },
        keyB: { blockID: 'blockB', syncedAt: dateB },
      },
    });
  });
});

describe('saveNotionLinkAttachment', () => {
  it('preserves synced notes when `syncNotes` is disabled', async () => {
    mockZoteroPrefs();
    setNoteroPref(NoteroPref.syncNotes, false);
    const pageURL =
      'notion://www.notion.so/page-00000000000000000000000000000000';
    const syncedNotes =
      '<pre id="notero-synced-notes">{"existing":"notes"}</pre>';
    const item = createZoteroItemMock();
    const attachment = createZoteroItemMock();
    item.getAttachments.mockReturnValue([attachment.id]);
    attachment.getField.calledWith('url').mockReturnValue(pageURL);
    attachment.getNote.mockReturnValue(syncedNotes);

    await saveNotionLinkAttachment(item, pageURL);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(attachment.setNote).toHaveBeenCalledWith(
      expect.stringContaining(syncedNotes),
    );
  });

  it('preserves synced notes when page ID does not change', async () => {
    mockZoteroPrefs();
    setNoteroPref(NoteroPref.syncNotes, true);
    const pageURL =
      'notion://www.notion.so/page-00000000000000000000000000000000';
    const syncedNotes =
      '<pre id="notero-synced-notes">{"existing":"notes"}</pre>';
    const item = createZoteroItemMock();
    const attachment = createZoteroItemMock();
    item.getAttachments.mockReturnValue([attachment.id]);
    attachment.getField.calledWith('url').mockReturnValue(pageURL);
    attachment.getNote.mockReturnValue(syncedNotes);

    await saveNotionLinkAttachment(item, pageURL);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(attachment.setNote).toHaveBeenCalledWith(
      expect.stringContaining(syncedNotes),
    );
  });

  it('resets synced notes when page ID changes', async () => {
    mockZoteroPrefs();
    setNoteroPref(NoteroPref.syncNotes, true);
    const oldPageURL =
      'notion://www.notion.so/old-page-00000000000000000000000000000000';
    const newPageURL =
      'notion://www.notion.so/new-page-77777777777777777777777777777777';
    const syncedNotes =
      '<pre id="notero-synced-notes">{"existing":"notes"}</pre>';
    const item = createZoteroItemMock();
    const attachment = createZoteroItemMock();
    item.getAttachments.mockReturnValue([attachment.id]);
    attachment.getField.calledWith('url').mockReturnValue(oldPageURL);
    attachment.getNote.mockReturnValue(syncedNotes);

    await saveNotionLinkAttachment(item, newPageURL);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(attachment.setNote).toHaveBeenCalledWith(
      expect.stringContaining('<pre id="notero-synced-notes">{}</pre>'),
    );
  });
});
