import type { ChildBlock } from '../../../notion-types';

export const expected: ChildBlock[] = [
  {
    quote: {
      rich_text: [{ text: { content: 'quotation start' } }],
      children: [
        {
          quote: {
            rich_text: [{ text: { content: 'quotation middle' } }],
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
