import { convertHtmlToBlocks } from '../html-to-notion';

import { htmlTestCases } from './fixtures';

describe('convertHtmlToBlocks', () => {
  it('throws error if HTML content does not match expected format', () => {
    const html = '<h1>Unexpected</h1>';

    expect(() => convertHtmlToBlocks(html)).toThrow(
      new Error('Failed to load HTML content'),
    );
  });

  it.each(htmlTestCases)(
    'returns expected blocks for "$name"',
    ({ html, expected }) => {
      expect(convertHtmlToBlocks(html)).toStrictEqual(expected);
    },
  );
});
