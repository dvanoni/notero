import type { ChildBlock } from '../../../notion-types';

export const expected: ChildBlock[] = [
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
