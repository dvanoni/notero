import { chunkString } from '../chunkString';

describe('chunkString', () => {
  it.each`
    str       | chunkSize | expected
    ${''}     | ${5}      | ${[]}
    ${'1234'} | ${5}      | ${['1234']}
    ${'1234'} | ${4}      | ${['1234']}
    ${'1234'} | ${3}      | ${['123', '4']}
  `(
    'returns $expected when string is "$str" and chunk size is $chunkSize',
    ({
      str,
      chunkSize,
      expected,
    }: {
      str: string;
      chunkSize: number;
      expected: string[];
    }) => {
      expect(chunkString(str, chunkSize)).toStrictEqual(expected);
    },
  );

  it('does not split Unicode strings in the middle of a code point', () => {
    // 👋🏻 is two code points, each of which are a surrogate pair.
    // This means that '👋🏻'.length == 4 and [...'👋🏻'].length == 2.
    expect(chunkString('👋🏻🌍 Hello', 3)).toStrictEqual(['👋🏻🌍', ' He', 'llo']);
  });
});
