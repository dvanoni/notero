import { Annotations, Color } from '../notion-types';

import { HTMLElementTagName } from './dom-utils';

type RGB = [r: number, g: number, b: number];

const TAG_ANNOTATIONS = {
  B: { bold: true },
  CODE: { code: true },
  EM: { italic: true },
  I: { italic: true },
  S: { strikethrough: true },
  STRONG: { bold: true },
  U: { underline: true },
} satisfies Partial<Record<HTMLElementTagName, Annotations>>;

function canAnnotateTag(
  tagName: string,
): tagName is keyof typeof TAG_ANNOTATIONS {
  return tagName in TAG_ANNOTATIONS;
}

// These were originally derived from https://www.zotero.org/support/note_templates#variables
// and then modified to better match colors provided in a PDF shared in
// https://github.com/dvanoni/notero/issues/4#issuecomment-1661322835
const BACKGROUND_COLORS = new Map([
  ['red_background', [255, 102, 102]],
  ['orange_background', [255, 180, 55]],
  ['yellow_background', [255, 212, 0]],
  ['green_background', [95, 240, 54]],
  ['blue_background', [80, 200, 229]],
  ['purple_background', [162, 138, 229]],
  ['pink_background', [229, 110, 238]],
  ['gray_background', [170, 170, 170]],
]) satisfies Map<Color, RGB>;

// Determined empirically from Zotero
const TEXT_COLORS = new Map([
  ['red', [255, 32, 32]], // #ff2020
  ['orange', [255, 119, 0]], // #ff7700
  ['yellow', [255, 203, 0]], // #ffcb00
  ['green', [78, 179, 28]], // #4eb31c
  ['blue', [5, 162, 239]], // #05a2ef
  ['purple', [121, 83, 227]], // #7953e3
  ['pink', [235, 82, 247]], // #eb52f7
  ['gray', [126, 131, 134]], // #7e8386
]) satisfies Map<Color, RGB>;

/**
 * Return the squared distance between two colors using the "redmean" approach.
 * @see https://en.wikipedia.org/wiki/Color_difference
 */
function colorDifference(color1: RGB, color2: RGB): number {
  const [r1, g1, b1] = color1;
  const [r2, g2, b2] = color2;
  const rMean = (r1 + r2) / 2;

  return (
    (2 + rMean / 256) * (r1 - r2) ** 2 +
    4 * (g1 - g2) ** 2 +
    (2 + (255 - rMean) / 256) * (b1 - b2) ** 2
  );
}

function getClosestNotionColor(target: RGB, palette: Map<Color, RGB>): Color {
  let closestDifference = Number.MAX_VALUE;
  let closestColor: Color;

  palette.forEach((rgb, color) => {
    const difference = colorDifference(target, rgb);

    if (difference < closestDifference) {
      closestDifference = difference;
      closestColor = color;
    }
  });

  return closestColor;
}

function getRGBFromStyleString(color: string): RGB | undefined {
  if (!color) return;

  const matches = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);

  if (!matches) return;

  const r = Number(matches[1]);
  const g = Number(matches[2]);
  const b = Number(matches[3]);

  return [r, g, b];
}

export function getNotionColor(element: HTMLElement): Color {
  const { backgroundColor, color } = element.style;

  if (backgroundColor) {
    const rgb = getRGBFromStyleString(backgroundColor);

    if (rgb) {
      return getClosestNotionColor(rgb, BACKGROUND_COLORS);
    }
  }

  if (color) {
    const rgb = getRGBFromStyleString(color);

    if (rgb) {
      return getClosestNotionColor(rgb, TEXT_COLORS);
    }
  }
}

export function getAnnotations(element: HTMLElement): NonNullable<Annotations> {
  const annotations: Annotations = {};

  const color = getNotionColor(element);

  if (color) {
    Object.assign(annotations, { color });
  }

  if (element.style.textDecoration === 'line-through') {
    Object.assign(annotations, { strikethrough: true });
  }

  if (canAnnotateTag(element.tagName)) {
    Object.assign(annotations, TAG_ANNOTATIONS[element.tagName]);
  }

  return annotations;
}
