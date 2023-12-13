import { chunkString } from '../../utils';
import { LIMITS } from '../notion-limits';
import type { RichText, RichTextOptions, RichTextText } from '../notion-types';

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

  return chunkString(text, LIMITS.TEXT_CONTENT_CHARACTERS).map((content) => {
    const richText: RichTextText = { text: { content } };
    if (hasAnnotations) richText.annotations = annotations;
    if (link) richText.text.link = link;
    return richText;
  });
}

function collapseWhitespace(text: string): string {
  return text.replace(/[\s\n]+/g, ' ');
}
