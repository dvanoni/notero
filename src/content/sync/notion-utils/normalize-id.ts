/**
 * Normalizes a Notion ID by removing all hyphens.
 *
 * @param id The ID to normalize.
 * @returns The normalized ID.
 */
export function normalizeID(id: string): string {
  return id.replace(/-/g, '');
}
