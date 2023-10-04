import type { PropertyRequest } from '../notion-types';

export function buildDate(
  date: Date | false | null | undefined,
): PropertyRequest<'date'> {
  return date ? { start: date.toISOString() } : null;
}
