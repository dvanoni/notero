import { APA_STYLE } from '../constants';
import { ItemSyncError, LocalizableError } from '../errors';
import {
  NoteroPref,
  PageTitleFormat,
  getNoteroPref,
  getRequiredNoteroPref,
} from '../prefs/notero-pref';
import { getLocalizedErrorMessage, logger } from '../utils';

import { CapacitiesClient, getCapacitiesClient } from './capacities-client';
import type { Structure } from './capacities-types';
import { ProgressWindow } from './progress-window';
import { syncNoteItem } from './sync-note-item';
import { syncRegularItem } from './sync-regular-item';

export type SyncJobParams = {
  capacities: CapacitiesClient;
  citationFormat: string;
  collectionID?: string;
  pageTitleFormat: PageTitleFormat;
  spaceID: string;
  structure: Structure;
};

export async function performSyncJob(
  itemIDs: Set<Zotero.Item['id']>,
  getCapacitiesAuthToken: () => Promise<string>,
  window: Window,
): Promise<void> {
  const items = Zotero.Items.get(Array.from(itemIDs));
  if (!items.length) return;

  const progressWindow = new ProgressWindow(items.length, window);
  await progressWindow.show();

  try {
    const params = await prepareSyncJob(getCapacitiesAuthToken, window);
    await syncItems(items, progressWindow, params);
  } catch (error) {
    await handleError(error, progressWindow, window);
  }
}

async function prepareSyncJob(
  getCapacitiesAuthToken: () => Promise<string>,
  window: Window,
): Promise<SyncJobParams> {
  const authToken = await getCapacitiesAuthToken();
  const capacities = getCapacitiesClient(authToken, window);

  const structureID = getRequiredNoteroPref(NoteroPref.capacitiesStructureID);
  const collectionID = getNoteroPref(NoteroPref.capacitiesCollectionID);

  const structure = await retrieveStructure(capacities, structureID);
  const space = await capacities.getSpace();

  const citationFormat = getCitationFormat();
  const pageTitleFormat = getPageTitleFormat();

  return {
    capacities,
    citationFormat,
    collectionID,
    pageTitleFormat,
    spaceID: space.id,
    structure,
  };
}

function getCitationFormat(): string {
  const format = Zotero.Prefs.get('export.quickCopy.setting');

  if (typeof format === 'string' && format) return format;

  return APA_STYLE;
}

function getPageTitleFormat(): PageTitleFormat {
  return getNoteroPref(NoteroPref.pageTitleFormat) || PageTitleFormat.itemTitle;
}

async function retrieveStructure(
  capacities: CapacitiesClient,
  structureID: string,
): Promise<Structure> {
  const structures = await capacities.getStructures();

  const structure = structures.find(({ id }) => id === structureID);

  if (!structure) {
    throw new LocalizableError(
      'Configured Capacities structure not found',
      'notero-error-missing-structure',
    );
  }

  return structure;
}

async function syncItems(
  items: Zotero.Item[],
  progressWindow: ProgressWindow,
  params: SyncJobParams,
) {
  for (const [index, item] of items.entries()) {
    const step = index + 1;
    logger.groupCollapsed(
      `Syncing item ${step} of ${items.length} with ID`,
      item.id,
    );
    logger.debug(item.getDisplayTitle());

    await progressWindow.updateText(step);

    try {
      if (item.isNote()) {
        await syncNoteItem(item, params);
      } else {
        await syncRegularItem(item, params);
      }
    } catch (error) {
      throw new ItemSyncError(error, item);
    } finally {
      logger.groupEnd();
    }

    progressWindow.updateProgress(step);
  }

  progressWindow.complete();
}

async function handleError(
  error: unknown,
  progressWindow: ProgressWindow,
  window: Window,
) {
  let cause = error;
  let failedItem: Zotero.Item | undefined;

  if (error instanceof ItemSyncError) {
    cause = error.cause;
    failedItem = error.item;
  }

  const errorMessage = await getLocalizedErrorMessage(
    cause,
    window.document.l10n,
  );

  logger.error(error, failedItem?.getDisplayTitle());

  progressWindow.fail(errorMessage, failedItem);
}
