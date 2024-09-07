import { LocalizableError } from '../errors';

export async function getLocalizedErrorMessage(
  error: unknown,
  l10n: L10n.Localization,
): Promise<string> {
  if (error instanceof LocalizableError) {
    const message = await error.getLocalizedMessage(l10n);
    if (message) return message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
