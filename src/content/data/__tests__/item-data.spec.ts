import { describe, expect, it } from 'vite-plus/test';

import { createZoteroItemMock, mockZoteroPrefs } from '../../../../test/utils';
import { NoteroPref, setNoteroPref } from '../../prefs/notero-pref';
import {
  getSyncedNotesFromAttachment,
  saveCapacitiesLinkAttachment,
} from '../item-data';

const fakeSpaceID = '11111111-1111-1111-1111-111111111111';
const fakeObjectID = '22222222-2222-2222-2222-222222222222';
const fakeOtherObjectID = '33333333-3333-3333-3333-333333333333';

describe('getSyncedNotesFromAttachment', () => {
  it('loads expected data when synced notes are saved', () => {
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

describe('saveCapacitiesLinkAttachment', () => {
  it('preserves synced notes when `syncNotes` is disabled', async () => {
    mockZoteroPrefs();
    setNoteroPref(NoteroPref.syncNotes, false);
    const objectURL = `https://app.capacities.io/${fakeSpaceID}/${fakeObjectID}`;
    const syncedNotes =
      '<pre id="notero-synced-notes">{"existing":"notes"}</pre>';
    const item = createZoteroItemMock();
    const attachment = createZoteroItemMock();
    item.getAttachments.mockReturnValue([attachment.id]);
    attachment.getField.calledWith('url').mockReturnValue(objectURL);
    attachment.getNote.mockReturnValue(syncedNotes);

    await saveCapacitiesLinkAttachment(item, objectURL);

    // oxlint-disable-next-line typescript/unbound-method
    expect(attachment.setNote).toHaveBeenCalledExactlyOnceWith(
      expect.stringContaining(syncedNotes),
    );
  });

  it('preserves synced notes when object ID does not change', async () => {
    mockZoteroPrefs();
    setNoteroPref(NoteroPref.syncNotes, true);
    const objectURL = `https://app.capacities.io/${fakeSpaceID}/${fakeObjectID}`;
    const syncedNotes =
      '<pre id="notero-synced-notes">{"existing":"notes"}</pre>';
    const item = createZoteroItemMock();
    const attachment = createZoteroItemMock();
    item.getAttachments.mockReturnValue([attachment.id]);
    attachment.getField.calledWith('url').mockReturnValue(objectURL);
    attachment.getNote.mockReturnValue(syncedNotes);

    await saveCapacitiesLinkAttachment(item, objectURL);

    // oxlint-disable-next-line typescript/unbound-method
    expect(attachment.setNote).toHaveBeenCalledExactlyOnceWith(
      expect.stringContaining(syncedNotes),
    );
  });

  it('resets synced notes when object ID changes', async () => {
    mockZoteroPrefs();
    setNoteroPref(NoteroPref.syncNotes, true);
    const oldObjectURL = `https://app.capacities.io/${fakeSpaceID}/${fakeObjectID}`;
    const newObjectURL = `https://app.capacities.io/${fakeSpaceID}/${fakeOtherObjectID}`;
    const syncedNotes =
      '<pre id="notero-synced-notes">{"existing":"notes"}</pre>';
    const item = createZoteroItemMock();
    const attachment = createZoteroItemMock();
    item.getAttachments.mockReturnValue([attachment.id]);
    attachment.getField.calledWith('url').mockReturnValue(oldObjectURL);
    attachment.getNote.mockReturnValue(syncedNotes);

    await saveCapacitiesLinkAttachment(item, newObjectURL);

    // oxlint-disable-next-line typescript/unbound-method
    expect(attachment.setNote).toHaveBeenCalledExactlyOnceWith(
      expect.stringContaining('<pre id="notero-synced-notes">{}</pre>'),
    );
  });
});
