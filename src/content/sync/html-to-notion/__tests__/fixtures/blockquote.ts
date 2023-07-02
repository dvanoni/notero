import { BlockObjectRequest } from '@notionhq/client/build/src/api-endpoints';

export const expected: BlockObjectRequest[] = [
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
                text: { content: 'middle first' },
                annotations: { bold: true, strikethrough: true },
              },
            ],
            children: [
              {
                paragraph: {
                  rich_text: [
                    {
                      text: { content: 'quotation ' },
                      annotations: { strikethrough: true },
                    },
                    {
                      text: { content: 'middle last' },
                      annotations: { bold: true, strikethrough: true },
                    },
                  ],
                },
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
