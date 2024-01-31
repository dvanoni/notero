import fs from 'fs';
import path from 'path';

import { BlockObjectRequest } from '@notionhq/client/build/src/api-endpoints';

import * as annotations from './annotations';
import * as blockquote from './blockquote';
import * as formatting from './formatting';
import * as links from './links';
import * as nestedStyles from './nestedStyles';
import * as simple from './simple';
import * as textOnly from './textOnly';
import * as withoutContainer from './withoutContainer';

type NoteTestCase = {
  name: string;
  html: string;
  expected: BlockObjectRequest[];
};

const cases: Record<string, Pick<NoteTestCase, 'expected'>> = {
  annotations,
  blockquote,
  formatting,
  links,
  nestedStyles,
  simple,
  textOnly,
  withoutContainer,
};

export const htmlTestCases: NoteTestCase[] = Object.entries(cases).map(
  ([name, { expected }]) => ({
    name,
    html: fs.readFileSync(path.resolve(__dirname, `${name}.html`), 'utf8'),
    expected,
  }),
);
