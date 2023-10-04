import { chunkString } from '../utils';

import type {
  PropertyRequest,
  RichText,
  RichTextOptions,
  RichTextText,
} from './notion-types';

// https://developers.notion.com/reference/request-limits#limits-for-property-values
const TEXT_CONTENT_MAX_LENGTH = 2000;

export function buildDate(
  date: Date | false | null | undefined,
): PropertyRequest<'date'> {
  return date ? { start: date.toISOString() } : null;
}

export function buildRichText(
  textContent: string | null | undefined,
  { annotations, link, preserveWhitespace }: RichTextOptions = {},
): RichText {
  if (!textContent?.length) return [];

  const text = preserveWhitespace
    ? textContent
    : collapseWhitespace(textContent);

  const hasAnnotations = Boolean(
    annotations && Object.keys(annotations).length,
  );

  return chunkString(text, TEXT_CONTENT_MAX_LENGTH).map((content) => {
    const richText: RichTextText = { text: { content } };
    if (hasAnnotations) richText.annotations = annotations;
    if (link) richText.text.link = link;
    return richText;
  });
}

function collapseWhitespace(text: string): string {
  return text.replace(/[\s\n]+/g, ' ');
}
