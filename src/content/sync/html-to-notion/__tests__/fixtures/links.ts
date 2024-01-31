import { BlockObjectRequest } from '@notionhq/client/build/src/api-endpoints';

export const expected: BlockObjectRequest[] = [
  {
    paragraph: {
      rich_text: [
        {
          text: { content: 'https link', link: { url: 'https://notion.so/' } },
        },
        { text: { content: ' ' } },
        {
          text: { content: 'http link', link: { url: 'http://notion.so/' } },
        },
        { text: { content: ' ' } },
        { text: { content: 'zotero link' } },
      ],
    },
  },
];
