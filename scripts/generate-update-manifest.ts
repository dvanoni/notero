import path from 'node:path';

import fs from 'fs-extra';

import pkg from '../package.json';

import { genDir, relativeToRoot } from './paths';
import { version } from './version';

const updatesJsonPath = path.join(genDir, 'updates.json');
const updateRdfPath = path.join(genDir, 'update.rdf');

const [, , updateLink] = process.argv;

if (!updateLink) {
  throw new Error('Update link must be provided as first argument');
}

console.log(
  `Generating ${relativeToRoot(
    updatesJsonPath,
  )} and copying to ${relativeToRoot(updateRdfPath)}`,
);

const updatesJson = {
  addons: {
    [pkg.xpi.id]: {
      updates: [
        {
          version,
          update_link: updateLink,
          applications: {
            gecko: {
              strict_min_version: '60.9',
              strict_max_version: '60.9',
            },
            ...(pkg.xpi.supportsZotero7
              ? {
                  zotero: {
                    strict_min_version: '6.999',
                    strict_max_version: '7.0.*',
                  },
                }
              : null),
          },
        },
      ],
    },
  },
};

fs.outputJsonSync(updatesJsonPath, updatesJson, { spaces: 2 });
fs.copySync(updatesJsonPath, updateRdfPath);
