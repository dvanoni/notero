import { mock, MockProxy } from 'jest-mock-extended';

import { zoteroMock } from '../../../../test/utils/zotero-mock';
import { buildCollectionFullName } from '../buildCollectionFullName';

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
  it('returns collection name when collection has no parent', () => {
    expect(buildCollectionFullName(collection)).toBe('Collection Name');
  });

  it('returns parent name prepended to collection name when collection has a parent', () => {
    collection.parentID = PARENT_ID;

    expect(buildCollectionFullName(collection)).toBe(
      'Parent Name ▸ Collection Name'
    );
  });
});
