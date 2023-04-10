import type { ChildBlock } from '../../../notion-types';

export const expected: ChildBlock[] = [
  {
    quote: {
      rich_text: [{ text: { content: 'quotation start' } }],
      children: [
        {
          quote: {
            rich_text: [
              {
                text: { content: 'quotation ' },
                annotations: { strikethrough: true },
              },
              {
                text: { content: 'middle' },
                annotations: { bold: true, strikethrough: true },
              },
            ],
          },
        },
        {
          paragraph: {
            rich_text: [
              { text: { content: 'plain text ' } },
              {
                text: { content: 'underline' },
                annotations: { underline: true },
              },
            ],
          },
        },
        {
          paragraph: {
            rich_text: [{ text: { content: 'quotation end' } }],
          },
        },
      ],
    },
  },
];
