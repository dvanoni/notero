import type { FluentMessageId } from '../../locale/fluent-types';

export type ErrorL10nId = FluentMessageId & `notero-error-${string}`;

export class LocalizableError extends Error {
  public readonly name: string = 'LocalizableError';

  protected readonly l10nId: ErrorL10nId;
  protected readonly l10nArgs?: L10n.L10nArgs;

  public constructor(
    rawMessage: string,
    l10nId: ErrorL10nId,
    l10nArgs?: L10n.L10nArgs,
  ) {
    super(rawMessage);
    this.l10nId = l10nId;
    this.l10nArgs = l10nArgs;
  }

  public getLocalizedMessage(l10n: L10n.Localization): Promise<string | null> {
    return l10n.formatValue(this.l10nId, this.l10nArgs);
  }
}
