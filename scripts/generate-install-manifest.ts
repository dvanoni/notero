import path from 'node:path';

import fs from 'fs-extra';

import pkg from '../package.json';

import { buildDir, relativeToRoot } from './paths';
import { version } from './version';

const manifestJsonPath = path.join(buildDir, 'manifest.json');

console.log(`Generating ${relativeToRoot(manifestJsonPath)}`);

const manifestJson = {
  author: pkg.author.name,
  description: pkg.description,
  homepage_url: pkg.homepage,
  icons: pkg.xpi.icons,
  manifest_version: 2,
  name: pkg.xpi.name,
  version,
  applications: {
    zotero: {
      id: pkg.xpi.id,
      update_url: `${pkg.xpi.releaseURL}updates.json`,
      strict_min_version: pkg.xpi.zoteroMinVersion,
      strict_max_version: pkg.xpi.zoteroMaxVersion,
    },
  },
};

fs.outputJsonSync(manifestJsonPath, manifestJson, { spaces: 2 });
