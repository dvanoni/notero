const APP_URL_PROTOCOL = 'notion:';
const WEB_URL_PROTOCOL = 'https:';

const PAGE_URL_REGEX = new RegExp(
  `^(?:${APP_URL_PROTOCOL}|${WEB_URL_PROTOCOL})//(?:www.notion.so|app.notion.com)/.*([0-9a-f]{32})$`,
);

export function getPageIDFromURL(url: string): string | undefined {
  const matches = url.match(PAGE_URL_REGEX);
  return matches ? matches[1] : undefined;
}

export function isNotionPageURL(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return PAGE_URL_REGEX.test(value);
}
