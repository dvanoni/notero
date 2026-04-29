import { describe, expect, it } from 'vite-plus/test';

import { getPageIDFromURL, isNotionPageURL } from '../url';

describe('getPageIDFromURL', () => {
  it('returns undefined for a www.notion.so URL with an invalid page ID', () => {
    const url = 'https://www.notion.so/invalid-page-id';
    expect(getPageIDFromURL(url)).toBeUndefined();
  });

  it('returns page ID for a www.notion.so app URL', () => {
    const url =
      'notion://www.notion.so/page-title-here-34028626a44f8144b2f3ea986abcd5f9';
    expect(getPageIDFromURL(url)).toBe('34028626a44f8144b2f3ea986abcd5f9');
  });

  it('returns page ID for a www.notion.so web URL', () => {
    const url =
      'https://www.notion.so/page-title-here-34028626a44f8144b2f3ea986abcd5f9';
    expect(getPageIDFromURL(url)).toBe('34028626a44f8144b2f3ea986abcd5f9');
  });

  it('returns undefined for a app.notion.com URL with an invalid page ID', () => {
    const url = 'https://app.notion.com/invalid-page-id';
    expect(getPageIDFromURL(url)).toBeUndefined();
  });

  it('returns page ID for an app.notion.com app URL', () => {
    const url =
      'notion://app.notion.com/page-title-here-34028626a44f8144b2f3ea986abcd5f9';
    expect(getPageIDFromURL(url)).toBe('34028626a44f8144b2f3ea986abcd5f9');
  });

  it('returns page ID for an app.notion.com web URL', () => {
    const url =
      'https://app.notion.com/page-title-here-34028626a44f8144b2f3ea986abcd5f9';
    expect(getPageIDFromURL(url)).toBe('34028626a44f8144b2f3ea986abcd5f9');
  });
});

describe('isNotionPageURL', () => {
  it('returns false for a non-Notion URL', () => {
    const url = 'https://www.example.com';
    expect(isNotionPageURL(url)).toBe(false);
  });

  it.each([
    [
      false,
      'www.notion.so URL with an invalid page ID',
      'https://www.notion.so/invalid-page-id',
    ],
    [
      true,
      'www.notion.so app URL',
      'notion://www.notion.so/page-title-here-34028626a44f8144b2f3ea986abcd5f9',
    ],
    [
      true,
      'www.notion.so web URL',
      'https://www.notion.so/page-title-here-34028626a44f8144b2f3ea986abcd5f9',
    ],
    [
      false,
      'app.notion.com URL with an invalid page ID',
      'https://app.notion.com/invalid-page-id',
    ],
    [
      true,
      'app.notion.com app URL',
      'notion://app.notion.com/page-title-here-34028626a44f8144b2f3ea986abcd5f9',
    ],
    [
      true,
      'app.notion.com web URL',
      'https://app.notion.com/page-title-here-34028626a44f8144b2f3ea986abcd5f9',
    ],
  ])('returns %s for a %s', (expected, _description, url) => {
    expect(isNotionPageURL(url)).toBe(expected);
  });
});
