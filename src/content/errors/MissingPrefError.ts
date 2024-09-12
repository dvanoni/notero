import type { NoteroPref } from '../prefs/notero-pref';

import { LocalizableError } from './LocalizableError';

const L10N_IDS: Partial<Record<NoteroPref, string>> = {
  notionDatabaseID: 'notero-error-missing-notion-database',
  notionToken: 'notero-error-missing-notion-token',
};

export class MissingPrefError extends LocalizableError {
  public readonly name = 'MissingPrefError';

  public constructor(pref: NoteroPref) {
    super(
      `Missing pref: ${pref}`,
      L10N_IDS[pref] || 'notero-error-missing-pref',
      { pref },
    );
  }
}
