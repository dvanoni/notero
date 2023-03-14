import fs from 'fs';
import path from 'path';

import type { ChildBlock } from '../../../notion-types';

import * as formatting from './formatting';
import * as simple from './simple';

type NoteTestCase = {
  name: string;
  html: string;
  expected: ChildBlock[];
};

const cases: Record<string, Pick<NoteTestCase, 'expected'>> = {
  simple,
  formatting,
};

export const htmlTestCases: NoteTestCase[] = Object.entries(cases).map(
  ([name, { expected }]) => ({
    name,
    html: fs.readFileSync(path.resolve(__dirname, `${name}.html`), 'utf8'),
    expected,
  })
);
