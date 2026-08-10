import assert from 'node:assert/strict';
import path from 'node:path';

import fs from 'fs-extra';

import pkg from '../package.json' with { type: 'json' };

import { genDir, relativeToRoot } from './utils/paths.mts';
import { getVersion } from './utils/version.mts';

const updatesJsonPath = path.join(genDir, 'updates.json');
const updateRdfPath = path.join(genDir, 'update.rdf');

const [, , updateLink] = process.argv;

assert.ok(updateLink, 'Update link must be provided as first argument');

const version = await getVersion();

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
            zotero: {
              strict_min_version: pkg.xpi.zoteroMinVersion,
              strict_max_version: pkg.xpi.zoteroMaxVersion,
            },
          },
        },
      ],
    },
  },
};

fs.outputJsonSync(updatesJsonPath, updatesJson, { spaces: 2 });
fs.copySync(updatesJsonPath, updateRdfPath);
