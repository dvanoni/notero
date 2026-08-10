const OBJECT_URL_REGEX =
  /^https:\/\/app\.capacities\.io\/([0-9a-f-]{36})\/([0-9a-f-]{36})$/i;

export function buildObjectURL(spaceId: string, objectId: string): string {
  return `https://app.capacities.io/${spaceId}/${objectId}`;
}

export function getObjectIDFromURL(url: string): string | undefined {
  return url.match(OBJECT_URL_REGEX)?.[2];
}

export function isCapacitiesObjectURL(value: unknown): value is string {
  return typeof value === 'string' && OBJECT_URL_REGEX.test(value);
}
