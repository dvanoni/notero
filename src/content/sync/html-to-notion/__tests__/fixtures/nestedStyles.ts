import { BlockObjectRequest } from '@notionhq/client/build/src/api-endpoints';

export const expected: BlockObjectRequest[] = [
  {
    paragraph: {
      rich_text: [
        { annotations: { color: 'red' }, text: { content: 'red' } },
        { annotations: { color: 'green' }, text: { content: 'green' } },
        { annotations: { color: 'green' }, text: { content: '\n' } },
        { annotations: { color: 'green' }, text: { content: 'last' } },
      ],
    },
  },
];
