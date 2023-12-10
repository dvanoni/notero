import { isObject } from '../is-object';

describe('isObject', () => {
  it('returns false when value is undefined', () => {
    expect(isObject(undefined)).toBe(false);
  });

  it('returns false when value is null', () => {
    expect(isObject(null)).toBe(false);
  });

  it('returns false when value is empty string', () => {
    expect(isObject('')).toBe(false);
  });

  it('returns true when value is empty object', () => {
    expect(isObject({})).toBe(true);
  });

  it('returns true when value is non-empty object', () => {
    expect(isObject({ a: 1 })).toBe(true);
  });
});
