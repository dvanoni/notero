import { describe, expect, it, vi } from 'vite-plus/test';
import { mockDeep } from 'vitest-mock-extended';

import { createZoteroItemMock } from '../../../../test/utils';
import {
  getCapacitiesObjectID,
  saveCapacitiesLinkAttachment,
  saveCapacitiesTag,
} from '../../data/item-data';
import { PageTitleFormat } from '../../prefs/notero-pref';
import type { CapacitiesClient } from '../capacities-client';
import { CapacitiesApiError } from '../capacities-client';
import type {
  CapacitiesObject,
  Structure,
  WritableObjectProperties,
} from '../capacities-types';
import { buildProperties } from '../property-builder';
import type { SyncJobParams } from '../sync-job';
import { syncRegularItem } from '../sync-regular-item';

vi.mock('../../data/item-data');
vi.mock('../property-builder');

const fakeCitationFormat = 'fake-style';
const fakeSpaceID = 'fake-space-id';
const fakeStructure: Structure = {
  id: 'fake-structure-id',
  title: 'Fake Structure',
  pluralName: 'Fake Structures',
  propertyDefinitions: [],
  labelColor: '#000000',
  collections: [],
};
const fakeObjectID = 'fake-object-id';
const fakeProperties: WritableObjectProperties = {
  title: { type: 'title', title: { value: null } },
};
const fakePageTitleFormat = PageTitleFormat.itemAuthorDateCitation;
const fakeObjectResponse: CapacitiesObject = {
  id: fakeObjectID,
  structureId: fakeStructure.id,
  collections: [],
  properties: {},
};

function setup({ objectID }: { objectID?: string }) {
  const regularItem = createZoteroItemMock();
  const capacities = mockDeep<CapacitiesClient>({
    fallbackMockImplementation: () => {
      throw new Error('NOT MOCKED');
    },
  });

  vi.mocked(getCapacitiesObjectID).mockReturnValue(objectID);
  vi.mocked(buildProperties).mockResolvedValue(fakeProperties);

  capacities.createObject.mockResolvedValue(fakeObjectResponse);
  capacities.updateObject.mockResolvedValue(fakeObjectResponse);

  const params: SyncJobParams = {
    capacities,
    citationFormat: fakeCitationFormat,
    collectionID: undefined,
    pageTitleFormat: fakePageTitleFormat,
    spaceID: fakeSpaceID,
    structure: fakeStructure,
  };

  return { capacities, params, regularItem };
}

/* oxlint-disable typescript/unbound-method */
describe('syncRegularItem', () => {
  it('creates new object when object ID is not set', async () => {
    const { capacities, params, regularItem } = setup({ objectID: undefined });

    await syncRegularItem(regularItem, params);

    expect(capacities.createObject).toHaveBeenCalledExactlyOnceWith({
      structureId: fakeStructure.id,
      collections: undefined,
      properties: fakeProperties,
    });
    expect(capacities.updateObject).not.toHaveBeenCalled();
  });

  it('updates existing object when object ID is set', async () => {
    const { capacities, params, regularItem } = setup({
      objectID: fakeObjectID,
    });

    await syncRegularItem(regularItem, params);

    expect(capacities.updateObject).toHaveBeenCalledExactlyOnceWith({
      id: fakeObjectID,
      properties: fakeProperties,
    });
    expect(capacities.createObject).not.toHaveBeenCalled();
  });

  it('creates new object when existing object is not found', async () => {
    const { capacities, params, regularItem } = setup({
      objectID: fakeObjectID,
    });
    capacities.updateObject.mockRejectedValue(
      new CapacitiesApiError(404, 'Not found'),
    );

    await syncRegularItem(regularItem, params);

    expect(capacities.updateObject).toHaveBeenCalledExactlyOnceWith({
      id: fakeObjectID,
      properties: fakeProperties,
    });
    expect(capacities.createObject).toHaveBeenCalledExactlyOnceWith({
      structureId: fakeStructure.id,
      collections: undefined,
      properties: fakeProperties,
    });
  });

  it('creates new object when existing object belongs to different structure', async () => {
    const { capacities, params, regularItem } = setup({
      objectID: fakeObjectID,
    });
    capacities.updateObject.mockResolvedValue({
      ...fakeObjectResponse,
      structureId: 'different-structure-id',
    });

    await syncRegularItem(regularItem, params);

    expect(capacities.createObject).toHaveBeenCalledExactlyOnceWith({
      structureId: fakeStructure.id,
      collections: undefined,
      properties: fakeProperties,
    });
  });

  it('includes collection ID when creating new object', async () => {
    const { capacities, params, regularItem } = setup({ objectID: undefined });
    params.collectionID = 'fake-collection-id';

    await syncRegularItem(regularItem, params);

    expect(capacities.createObject).toHaveBeenCalledExactlyOnceWith({
      structureId: fakeStructure.id,
      collections: ['fake-collection-id'],
      properties: fakeProperties,
    });
  });

  it('saves Capacities link attachment using space and object IDs', async () => {
    const { params, regularItem } = setup({ objectID: fakeObjectID });

    await syncRegularItem(regularItem, params);

    expect(saveCapacitiesLinkAttachment).toHaveBeenCalledExactlyOnceWith(
      regularItem,
      `https://app.capacities.io/${fakeSpaceID}/${fakeObjectID}`,
    );
  });

  it('saves the Capacities tag on the item', async () => {
    const { params, regularItem } = setup({ objectID: fakeObjectID });

    await syncRegularItem(regularItem, params);

    expect(saveCapacitiesTag).toHaveBeenCalledExactlyOnceWith(regularItem);
  });

  it('throws error when update fails with a non-404 error', async () => {
    const { capacities, params, regularItem } = setup({
      objectID: fakeObjectID,
    });
    const unexpectedError = new CapacitiesApiError(
      500,
      'Internal server error',
    );
    capacities.updateObject.mockRejectedValue(unexpectedError);

    await expect(() => syncRegularItem(regularItem, params)).rejects.toThrow(
      unexpectedError,
    );
  });
});
/* oxlint-enable typescript/unbound-method */
