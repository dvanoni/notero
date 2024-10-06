import { createZoteroItemMock, zoteroMock } from '../../../../test/utils';
import { getItemURL } from '../get-item-url';

const itemMock = createZoteroItemMock();

describe('getItemURL', () => {
  it('returns url using https', () => {
    zoteroMock.URI.getItemURI.mockReturnValueOnce(
      'http://zotero.org/users/local/ZswAJ4Qe/items/WGAMSPG3',
    );

    expect(getItemURL(itemMock)).toMatch(/^https:\/\/zotero.org/);
  });

  describe('when item is in a user library', () => {
    it('returns local url when user is not signed in', () => {
      zoteroMock.URI.getItemURI.mockReturnValueOnce(
        'http://zotero.org/users/local/ZswAJ4Qe/items/WGAMSPG3',
      );
      zoteroMock.Users.getCurrentUsername.mockReturnValueOnce(undefined);

      expect(getItemURL(itemMock)).toBe(
        'https://zotero.org/users/local/ZswAJ4Qe/items/WGAMSPG3',
      );
    });

    it('returns web url with username when user is signed in', () => {
      zoteroMock.URI.getItemURI.mockReturnValueOnce(
        'http://zotero.org/users/8509743/items/DE9YUFJ9',
      );
      zoteroMock.Users.getCurrentUsername.mockReturnValueOnce(
        'SOME  user-name',
      );

      expect(getItemURL(itemMock)).toBe(
        'https://zotero.org/some__user-name/items/DE9YUFJ9',
      );
    });
  });

  describe('when item is in a group library', () => {
    it('returns web url', () => {
      zoteroMock.URI.getItemURI.mockReturnValueOnce(
        'http://zotero.org/groups/4873137/items/8XLITSYN',
      );
      zoteroMock.Users.getCurrentUsername.mockReturnValueOnce(
        'SOME  user-name',
      );

      expect(getItemURL(itemMock)).toBe(
        'https://zotero.org/groups/4873137/items/8XLITSYN',
      );
    });
  });

  describe('when item is in a feed', () => {
    it('returns local url', () => {
      zoteroMock.URI.getItemURI.mockReturnValueOnce(
        'http://zotero.org/users/local/eHZqskJE/feeds/4/items/3R3PSB8X',
      );
      zoteroMock.Users.getCurrentUsername.mockReturnValueOnce(
        'SOME  user-name',
      );

      expect(getItemURL(itemMock)).toBe(
        'https://zotero.org/users/local/eHZqskJE/feeds/4/items/3R3PSB8X',
      );
    });
  });
});
