import { mock, MockProxy } from 'jest-mock-extended';

import { mockZotero } from '../../../../test/utils/mockZotero';
import { buildCollectionFullName } from '../buildCollectionFullName';

const zoteroMock = mockZotero();

let collection: MockProxy<Zotero.Collection>;
let parent: MockProxy<Zotero.Collection>;

const PARENT_ID = 1234;

beforeEach(() => {
  collection = mock<Zotero.Collection>();
  collection.name = 'Collection Name';

  parent = mock<Zotero.Collection>();
  parent.name = 'Parent Name';

  zoteroMock.Collections.get.calledWith(PARENT_ID).mockReturnValue(parent);
});

describe('buildCollectionFullName', () => {
  describe('when collection has no parent', () => {
    it('returns collection name', () => {
      expect(buildCollectionFullName(collection)).toBe('Collection Name');
    });
  });

  describe('when collection has a parent', () => {
    it('returns parent name prepended to collection name', () => {
      collection.parentID = PARENT_ID;

      expect(buildCollectionFullName(collection)).toBe(
        'Parent Name ▸ Collection Name'
      );
    });
  });
});
