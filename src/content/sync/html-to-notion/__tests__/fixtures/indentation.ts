import { BlockObjectRequest } from '@notionhq/client/build/src/api-endpoints';

export const expected: BlockObjectRequest[] = [
  {
    paragraph: {
      rich_text: [],
      children: [
        { paragraph: { rich_text: [{ text: { content: 'first' } }] } },
        {
          paragraph: {
            rich_text: [{ text: { content: 'second' } }],
            children: [
              {
                paragraph: {
                  rich_text: [{ text: { content: 'double indent' } }],
                },
              },
            ],
          },
        },
        { paragraph: { rich_text: [{ text: { content: 'last' } }] } },
      ],
    },
  },
];
