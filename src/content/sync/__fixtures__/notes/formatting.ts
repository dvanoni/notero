import type { ChildBlock } from '../../notion-types';

export const expected: ChildBlock[] = [
  {
    paragraph: {
      rich_text: [
        { text: { content: 'bold' }, annotations: { bold: true } },
        { text: { content: ' ' } },
        {
          text: { content: 'italic blue' },
          annotations: { color: 'blue_background', italic: true },
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
            content: 'Link to Notion',
            link: { url: 'https://notion.so' },
          },
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
      rich_text: [{ text: { content: 'Heading 1' } }],
    },
  },
  {
    code: {
      language: 'plain text',
      rich_text: [
        { text: { content: 'monospace ' } },
        { text: { content: 'bold' }, annotations: { bold: true } },
        { text: { content: '?' } },
      ],
    },
  },
  {
    paragraph: {
      rich_text: [{ text: { content: '()' } }],
    },
  },
  {
    paragraph: {
      rich_text: [{ text: { content: '' } }],
    },
  },
  {
    bulleted_list_item: {
      rich_text: [{ text: { content: 'unordered one' } }],
    },
  },
  {
    bulleted_list_item: {
      rich_text: [{ text: { content: 'unordered two' } }],
    },
  },
  {
    bulleted_list_item: {
      rich_text: [{ text: { content: 'unordered three' } }],
    },
  },
  {
    numbered_list_item: {
      rich_text: [{ text: { content: 'ordered one' } }],
    },
  },
  {
    numbered_list_item: {
      rich_text: [{ text: { content: 'ordered two' } }],
    },
  },
  {
    numbered_list_item: {
      rich_text: [{ text: { content: 'ordered three' } }],
    },
  },
];
