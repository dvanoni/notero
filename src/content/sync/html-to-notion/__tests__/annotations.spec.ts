import { describe, expect, it } from 'vitest';

import type { Color } from '../../notion-types';
import { getNotionColor } from '../annotations';

type Hex = `#${string}`;

type ColorProperties = {
  backgroundColor?: Hex;
  color?: Hex;
};

type ColorTestCase = [hex: Hex, expected: NonNullable<Color>];

// From https://www.zotero.org/support/note_templates#variables
const zoteroBackgroundColors: ColorTestCase[] = [
  ['#ff6666', 'red_background'],
  ['#f19837', 'orange_background'],
  ['#ffd400', 'yellow_background'],
  ['#5fb236', 'green_background'],
  ['#2ea8e5', 'blue_background'],
  ['#a28ae5', 'purple_background'],
  ['#e56eee', 'pink_background'],
  ['#aaaaaa', 'gray_background'],
];

// Determined empirically from Zotero
const zoteroTextColors: ColorTestCase[] = [
  ['#ff2020', 'red'],
  ['#ff7700', 'orange'],
  ['#ffcb00', 'yellow'],
  ['#4eb31c', 'green'],
  ['#05a2ef', 'blue'],
  ['#7953e3', 'purple'],
  ['#eb52f7', 'pink'],
  ['#7e8386', 'gray'],
];

const customBackgroundColors: ColorTestCase[] = [
  // A gray that's not completely achromatic
  ['#ddddd9', 'gray_background'],
  // Based on a PDF shared in https://github.com/dvanoni/notero/issues/4#issuecomment-1661322835
  ['#ffcd99', 'orange_background'],
  ['#ffff55', 'yellow_background'],
  ['#55ff55', 'green_background'],
  ['#acfff3', 'blue_background'],
];

function buildElement({ backgroundColor, color }: ColorProperties) {
  const element = document.createElement('p');

  if (backgroundColor) {
    element.style.backgroundColor = backgroundColor;
  }

  if (color) {
    element.style.color = color;
  }

  return element;
}

describe('getNotionColor', () => {
  it('returns undefined when element has no colors', () => {
    const element = buildElement({});
    expect(getNotionColor(element)).toBeUndefined();
  });

  it('returns `green` when color is Zotero green', () => {
    const element = buildElement({ color: '#4eb31c' });
    const expected: Color = 'green';
    expect(getNotionColor(element)).toBe(expected);
  });

  it('returns `green_background` when backgroundColor is Zotero green', () => {
    const element = buildElement({ backgroundColor: '#5fb236' });
    const expected: Color = 'green_background';
    expect(getNotionColor(element)).toBe(expected);
  });

  it('returns `green_background` when both color and backgroundColor are Zotero green', () => {
    const element = buildElement({
      backgroundColor: '#5fb236',
      color: '#4eb31c',
    });
    const expected: Color = 'green_background';
    expect(getNotionColor(element)).toBe(expected);
  });

  it('returns `green_background` when backgroundColor is custom green', () => {
    const element = buildElement({ backgroundColor: '#55ff55' });
    const expected: Color = 'green_background';
    expect(getNotionColor(element)).toBe(expected);
  });

  describe('with Zotero background color', () => {
    it.each(zoteroBackgroundColors)('%s returns %s', (hex, expected) => {
      const element = buildElement({ backgroundColor: hex });
      expect(getNotionColor(element)).toBe(expected);
    });
  });

  describe('with Zotero text color', () => {
    it.each(zoteroTextColors)('%s returns %s', (hex, expected) => {
      const element = buildElement({ color: hex });
      expect(getNotionColor(element)).toBe(expected);
    });
  });

  describe('with custom background color', () => {
    it.each(customBackgroundColors)('%s returns %s', (hex, expected) => {
      const element = buildElement({ backgroundColor: hex });
      expect(getNotionColor(element)).toBe(expected);
    });
  });
});
