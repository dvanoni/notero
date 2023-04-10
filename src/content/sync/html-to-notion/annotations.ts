import { Annotations, Color } from '../notion-types';

import { HTMLElementTagName } from './dom-utils';

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
  tagName: string
): tagName is keyof typeof TAG_ANNOTATIONS {
  return tagName in TAG_ANNOTATIONS;
}

// https://www.zotero.org/support/note_templates#variables
const ZOTERO_COLORS: Record<string, Color> = {
  '255, 32, 32': 'red', // #ff2020
  '255, 119, 0': 'orange', // #ff7700
  '255, 203, 0': 'yellow', // #ffcb00
  '78, 179, 28': 'green', // #4eb31c
  '5, 162, 239': 'blue', // #05a2ef
  '121, 83, 227': 'purple', // #7953e3
  '235, 82, 247': 'pink', // #eb52f7
  '126, 131, 134': 'gray', // #7e8386
  '255, 102, 102': 'red_background', // #ff6666
  '241, 152, 55': 'orange_background', // #f19837
  '255, 212, 0': 'yellow_background', // #ffd400
  '95, 178, 54': 'green_background', // #5fb236
  '46, 168, 229': 'blue_background', // #2ea8e5
  '162, 138, 229': 'purple_background', // #a28ae5
  '229, 110, 238': 'pink_background', // #e56eee
  '170, 170, 170': 'gray_background', // #aaaaaa
};

function getNotionColorFromString(color: string): Color {
  if (!color) return;

  const matches = color.match(/^rgba?\((\d+,\s*\d+,\s*\d+)/);
  const rgb = matches?.[1];

  return (rgb && ZOTERO_COLORS[rgb]) || undefined;
}

export function getNotionColor(element: HTMLElement): Color {
  return (
    getNotionColorFromString(element.style.backgroundColor) ||
    getNotionColorFromString(element.style.color)
  );
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
