import { BlockObjectRequest } from '@notionhq/client/build/src/api-endpoints';

export const expected: BlockObjectRequest[] = [
  {
    heading_1: {
      rich_text: [{ text: { content: 'Heading' } }],
    },
  },
  {
    paragraph: {
      rich_text: [{ text: { content: 'Paragraph' } }],
    },
  },
];
