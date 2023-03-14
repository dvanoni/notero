import { htmlTestCases } from './__fixtures__';
import { convertHtmlToBlocks } from '../html-to-notion';

describe('convertHtmlToBlocks', () => {
  it('throws error if note content does not match expected format', () => {
    const html = '<h1>Unexpected</h1>';

    expect(() => convertHtmlToBlocks(html)).toThrow(
      new Error('Failed to load note content')
    );
  });

  it.each(htmlTestCases)(
    'returns expected blocks for "$name"',
    ({ html, expected }) => {
      expect(convertHtmlToBlocks(html)).toStrictEqual(expected);
    }
  );
});
