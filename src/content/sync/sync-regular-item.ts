import {
  getCapacitiesObjectID,
  saveCapacitiesLinkAttachment,
  saveCapacitiesTag,
} from '../data/item-data';
import { logger } from '../utils';

import type { CapacitiesClient } from './capacities-client';
import { isCapacitiesNotFoundError } from './capacities-client';
import type {
  CapacitiesObject,
  Structure,
  WritableObjectProperties,
} from './capacities-types';
import { buildObjectURL } from './capacities-utils';
import { buildProperties } from './property-builder';
import type { SyncJobParams } from './sync-job';

export async function syncRegularItem(
  item: Zotero.Item,
  params: SyncJobParams,
): Promise<void> {
  const object = await saveItemToObject(item, params);

  await saveCapacitiesTag(item);

  await saveCapacitiesLinkAttachment(
    item,
    buildObjectURL(params.spaceID, object.id),
  );
}

async function saveItemToObject(
  item: Zotero.Item,
  { capacities, collectionID, structure, ...params }: SyncJobParams,
): Promise<CapacitiesObject> {
  const objectID = getCapacitiesObjectID(item);

  const properties = await buildProperties({ item, structure, ...params });

  if (objectID) {
    return updateObject(
      capacities,
      structure,
      collectionID,
      objectID,
      properties,
    );
  }

  return createObject(capacities, structure, collectionID, properties);
}

function createObject(
  capacities: CapacitiesClient,
  structure: Structure,
  collectionID: string | undefined,
  properties: WritableObjectProperties,
): Promise<CapacitiesObject> {
  logger.debug('Creating object in structure', structure.id, properties);
  return capacities.createObject({
    structureId: structure.id,
    collections: collectionID ? [collectionID] : undefined,
    properties,
  });
}

async function updateObject(
  capacities: CapacitiesClient,
  structure: Structure,
  collectionID: string | undefined,
  objectID: string,
  properties: WritableObjectProperties,
): Promise<CapacitiesObject> {
  logger.debug('Updating object', objectID, properties);

  try {
    const object = await capacities.updateObject({
      id: objectID,
      properties,
    });

    if (object.structureId === structure.id) return object;

    logger.debug(
      'Recreating object found with different structure',
      object.structureId,
    );
    return createObject(capacities, structure, collectionID, properties);
  } catch (error) {
    if (!isCapacitiesNotFoundError(error)) throw error;

    logger.debug('Recreating object that was not found');
    return createObject(capacities, structure, collectionID, properties);
  }
}
