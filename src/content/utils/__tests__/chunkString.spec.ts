import { chunkString } from '../chunkString';

describe('chunkString', () => {
  it('returns empty array for empty string', () => {
    expect(chunkString('', 5)).toStrictEqual([]);
  });

  it('returns single element when string is shorter than chunk size', () => {
    expect(chunkString('1234', 5)).toStrictEqual(['1234']);
  });

  it('returns single element when string length is exactly chunk size', () => {
    expect(chunkString('1234', 4)).toStrictEqual(['1234']);
  });

  it('returns multiple elements when string is longer than chunk size', () => {
    expect(chunkString('1234', 3)).toStrictEqual(['123', '4']);
  });
});
