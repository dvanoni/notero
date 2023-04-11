import type { ChildBlock } from '../../../notion-types';

export const expected: ChildBlock[] = [
  {
    paragraph: {
      rich_text: [
        { text: { content: 'bold' }, annotations: { bold: true } },
        { text: { content: ' ' } },
        {
          text: { content: 'italic ' },
          annotations: { color: 'blue_background', italic: true },
        },
        {
          text: { content: 'blue' },
          annotations: { color: 'blue_background' },
        },
        { text: { content: ' ' } },
        {
          text: { content: 'underline' },
          annotations: { underline: true },
        },
        { text: { content: ' plain text ' } },
        {
          text: { content: 'redacted' },
          annotations: { strikethrough: true },
        },
        { text: { content: ' ' } },
        {
          text: {
            content: 'Link to ',
            link: { url: 'https://notion.so/' },
          },
        },
        {
          text: {
            content: 'Notion',
            link: { url: 'https://notion.so/' },
          },
          annotations: { bold: true },
        },
        { text: { content: ' ' } },
        { text: { content: 'super' } },
        { text: { content: ' ' } },
        { text: { content: 'sub' } },
        { text: { content: ' ' } },
        { text: { content: 'code' }, annotations: { code: true } },
        { text: { content: ' next' } },
      ],
    },
  },
  {
    paragraph: {
      rich_text: [{ text: { content: 'Tab' } }],
    },
  },
  {
    paragraph: {
      rich_text: [{ text: { content: 'Next indent' } }],
    },
  },
  {
    paragraph: {
      rich_text: [{ text: { content: 'Another indent' } }],
    },
  },
  {
    paragraph: {
      rich_text: [
        {
          text: { content: 'green highlight' },
          annotations: { color: 'green_background' },
        },
      ],
    },
  },
  {
    heading_1: {
      rich_text: [
        { text: { content: 'Heading ' } },
        { text: { content: '1' }, annotations: { color: 'purple' } },
      ],
    },
  },
  {
    code: {
      language: 'plain text',
      rich_text: [
        { text: { content: 'monospace ' } },
        { text: { content: 'bold' }, annotations: { bold: true } },
        { text: { content: '?\n\nfinal line' } },
      ],
    },
  },
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
  {
    paragraph: {
      color: 'yellow_background',
      rich_text: [{ text: { content: '()' } }],
    },
  },
  {
    paragraph: {
      rich_text: [],
    },
  },
  {
    paragraph: {
      rich_text: [],
    },
  },
  {
    bulleted_list_item: {
      rich_text: [
        { text: { content: 'red' }, annotations: { color: 'red' } },
        { text: { content: ' one' } },
      ],
    },
  },
  {
    bulleted_list_item: {
      rich_text: [
        { text: { content: 'orange' }, annotations: { color: 'orange' } },
        { text: { content: ' two' } },
        { text: { content: '\n' } },
        { text: { content: 'additional line' } },
      ],
    },
  },
  {
    bulleted_list_item: {
      rich_text: [
        { text: { content: 'yellow' }, annotations: { color: 'yellow' } },
        { text: { content: ' three' } },
      ],
      children: [
        {
          bulleted_list_item: {
            rich_text: [
              { text: { content: 'green' }, annotations: { color: 'green' } },
              { text: { content: ' four' } },
            ],
          },
        },
        {
          bulleted_list_item: {
            rich_text: [
              { text: { content: 'blue' }, annotations: { color: 'blue' } },
              { text: { content: ' five' } },
            ],
            // @ts-expect-error nested deeper than Notion allows
            children: [
              {
                bulleted_list_item: {
                  rich_text: [
                    {
                      text: { content: 'pink' },
                      annotations: { color: 'pink' },
                    },
                    { text: { content: ' six' } },
                  ],
                },
              },
            ],
          },
        },
        {
          bulleted_list_item: {
            rich_text: [
              { text: { content: 'purple' }, annotations: { color: 'purple' } },
              { text: { content: ' seven' } },
            ],
          },
        },
      ],
    },
  },
  {
    bulleted_list_item: {
      rich_text: [
        { text: { content: 'gray' }, annotations: { color: 'gray' } },
        { text: { content: ' eight' } },
      ],
    },
  },
  {
    numbered_list_item: {
      rich_text: [
        {
          text: { content: 'red' },
          annotations: { color: 'red_background' },
        },
        { text: { content: ' one' } },
      ],
    },
  },
  {
    numbered_list_item: {
      rich_text: [
        {
          text: { content: 'orange' },
          annotations: { color: 'orange_background' },
        },
        { text: { content: ' two' } },
      ],
    },
  },
  {
    numbered_list_item: {
      rich_text: [
        {
          text: { content: 'yellow' },
          annotations: { color: 'yellow_background' },
        },
        { text: { content: ' three' } },
      ],
    },
  },
  {
    numbered_list_item: {
      rich_text: [
        {
          text: { content: 'green' },
          annotations: { color: 'green_background' },
        },
        { text: { content: ' four' } },
      ],
    },
  },
  {
    numbered_list_item: {
      rich_text: [
        {
          text: { content: 'blue' },
          annotations: { color: 'blue_background' },
        },
        { text: { content: ' five' } },
      ],
    },
  },
  {
    numbered_list_item: {
      rich_text: [
        {
          text: { content: 'purple' },
          annotations: { color: 'purple_background' },
        },
        { text: { content: ' six' } },
      ],
    },
  },
  {
    numbered_list_item: {
      rich_text: [
        {
          text: { content: 'pink' },
          annotations: { color: 'pink_background' },
        },
        { text: { content: ' seven' } },
      ],
    },
  },
  {
    numbered_list_item: {
      rich_text: [
        {
          text: { content: 'gray' },
          annotations: { color: 'gray_background' },
        },
        { text: { content: ' eight' } },
      ],
    },
  },
  {
    equation: {
      expression: 'x^2 = 5',
    },
  },
];
