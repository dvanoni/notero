const APP_URL_PROTOCOL = 'notion:';
const WEB_URL_PROTOCOL = 'https:';
const WEB_URL_PROTOCOL_REGEX = new RegExp(`^${WEB_URL_PROTOCOL}`);

const PAGE_URL_REGEX = new RegExp(
  `^(?:${APP_URL_PROTOCOL}|${WEB_URL_PROTOCOL})//www.notion.so/.*([0-9a-f]{32})$`,
);

export function convertWebURLToAppURL(url: string): string {
  return url.replace(WEB_URL_PROTOCOL_REGEX, APP_URL_PROTOCOL);
}

export function getPageIDFromURL(url: string): string | undefined {
  const matches = url.match(PAGE_URL_REGEX);
  return matches ? matches[1] : undefined;
}

export function isNotionURL(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return PAGE_URL_REGEX.test(value);
}
