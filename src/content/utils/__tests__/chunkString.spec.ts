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
    }
  );
});
