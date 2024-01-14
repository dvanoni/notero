import { createZoteroItemMock } from '../../../../test/utils';
import { getSyncedNotesFromAttachment } from '../item-data';

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
