import { describe, expect, it } from 'vitest';

import { createZoteroCollectionMock } from '../../../../test/utils';
import { buildCollectionFullName } from '../build-collection-full-name';

const parent = createZoteroCollectionMock({ name: 'Parent Name' });
const collection = createZoteroCollectionMock({ name: 'Collection Name' });

describe('buildCollectionFullName', () => {
  it('returns collection name when collection has no parent', () => {
    collection.parentID = false;

    expect(buildCollectionFullName(collection)).toBe('Collection Name');
  });

  it('returns parent name prepended to collection name when collection has a parent', () => {
    collection.parentID = parent.id;

    expect(buildCollectionFullName(collection)).toBe(
      'Parent Name ▸ Collection Name',
    );
  });
});
