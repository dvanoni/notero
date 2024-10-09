import { describe, expect, it } from 'vitest';

import { convertHtmlToBlocks } from '../html-to-notion';

import { htmlTestCases } from './fixtures';

describe('convertHtmlToBlocks', () => {
  it.each(htmlTestCases)(
    'returns expected blocks for "$name"',
    ({ html, expected }) => {
      expect(convertHtmlToBlocks(html)).toStrictEqual(expected);
    },
  );
});
