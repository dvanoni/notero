import { describe, expect, it } from 'vitest';

import { truncateMiddle } from '../truncate-middle';

describe('truncateMiddle', () => {
  it('returns original string when length is shorter than maxLength', () => {
    expect(truncateMiddle('1234', 5)).toBe('1234');
  });

  it('returns original string when length is equal to maxLength', () => {
    expect(truncateMiddle('1234', 4)).toBe('1234');
  });

  it('returns truncated string when length is greater than odd maxLength', () => {
    expect(truncateMiddle('1234', 3)).toBe('1…4');
  });

  it('returns truncated string when length is greater than even maxLength', () => {
    expect(truncateMiddle('123456', 4)).toBe('12…6');
  });

  it('returns truncated string with multi-character separator', () => {
    expect(truncateMiddle('123456', 5, '...')).toBe('1...6');
  });

  it('returns truncated string when maxLength is one greater than separator length', () => {
    expect(truncateMiddle('123456', 2)).toBe('1…');
    expect(truncateMiddle('123456', 4, '...')).toBe('1...');
  });

  it('returns empty string when maxLength is zero', () => {
    expect(truncateMiddle('1234', 0)).toBe('');
  });

  it('returns only separator when separator length is equal to maxLength', () => {
    expect(truncateMiddle('1234', 1)).toBe('…');
  });

  it('returns only separator when separator length is greater than maxLength', () => {
    expect(truncateMiddle('1234', 2, '...')).toBe('..');
  });
});
