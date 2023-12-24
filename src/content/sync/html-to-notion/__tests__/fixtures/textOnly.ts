import { BlockObjectRequest } from '@notionhq/client/build/src/api-endpoints';

export const expected: BlockObjectRequest[] = [
  {
    paragraph: {
      rich_text: [{ text: { content: 'Text only' } }],
    },
  },
];
