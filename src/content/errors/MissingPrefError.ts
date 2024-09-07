import type { NoteroPref } from '../prefs/notero-pref';

import { LocalizableError } from './LocalizableError';

const L10N_IDS: Partial<Record<NoteroPref, string>> = {
  notionDatabaseID: 'notero-error-missing-notion-database',
  notionToken: 'notero-error-missing-notion-token',
};

export class MissingPrefError extends LocalizableError {
  public readonly name = 'MissingPrefError';

  private readonly pref: NoteroPref;

  public constructor(pref: NoteroPref) {
    super(
      `Missing pref: ${pref}`,
      L10N_IDS[pref] || 'notero-error-missing-pref',
    );
    this.pref = pref;
  }

  public override getLocalizedMessage(
    l10n: L10n.Localization,
  ): Promise<string | null> {
    return l10n.formatValue(this.l10nId, { pref: this.pref });
  }
}
