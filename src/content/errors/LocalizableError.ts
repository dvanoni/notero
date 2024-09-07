export class LocalizableError extends Error {
  public readonly name: string = 'LocalizableError';

  protected readonly l10nId: string;

  public constructor(rawMessage: string, l10nId: string) {
    super(rawMessage);
    this.l10nId = l10nId;
  }

  public getLocalizedMessage(l10n: L10n.Localization): Promise<string | null> {
    return l10n.formatValue(this.l10nId);
  }
}
