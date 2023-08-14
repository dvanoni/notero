import { BlockObjectRequest } from '@notionhq/client/build/src/api-endpoints';

// Based on a PDF shared in https://github.com/dvanoni/notero/issues/4#issuecomment-1661322835
export const expected: BlockObjectRequest[] = [
  {
    quote: {
      rich_text: [
        {
          text: { content: 'Yellow' },
          annotations: { color: 'yellow_background' },
        },
      ],
    },
  },
  {
    paragraph: {
      rich_text: [
        { text: { content: '(' } },
        { text: { content: 'Author, p. 2' } },
        { text: { content: ')' } },
      ],
    },
  },
  {
    quote: {
      rich_text: [
        {
          text: { content: 'Orange' },
          annotations: { color: 'orange_background' },
        },
      ],
    },
  },
  {
    paragraph: {
      rich_text: [
        { text: { content: '(' } },
        { text: { content: 'Author, p. 3' } },
        { text: { content: ')' } },
      ],
    },
  },
  {
    quote: {
      rich_text: [
        {
          text: { content: 'Green' },
          annotations: { color: 'green_background' },
        },
      ],
    },
  },
  {
    paragraph: {
      rich_text: [
        { text: { content: '(' } },
        { text: { content: 'Author, p. 4' } },
        { text: { content: ')' } },
        { text: { content: ' Custom note' } },
      ],
    },
  },
  {
    quote: {
      rich_text: [
        {
          text: { content: 'Blue' },
          annotations: { color: 'blue_background' },
        },
      ],
    },
  },
  {
    paragraph: {
      rich_text: [
        { text: { content: '(' } },
        { text: { content: 'Author, p. 5' } },
        { text: { content: ')' } },
      ],
    },
  },
];
