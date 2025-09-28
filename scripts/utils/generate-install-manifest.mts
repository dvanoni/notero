import path from 'node:path';

import fs from 'fs-extra';

import pkg from '../../package.json' with { type: 'json' };

import { buildDir, relativeToRoot } from './paths.mts';
import { getVersion } from './version.mts';

const manifestJsonPath = path.join(buildDir, 'manifest.json');

export async function generateInstallManifest() {
  const version = await getVersion();

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
        update_url: pkg.xpi.updateURL,
        strict_min_version: pkg.xpi.zoteroMinVersion,
        strict_max_version: pkg.xpi.zoteroMaxVersion,
      },
    },
  };

  fs.outputJsonSync(manifestJsonPath, manifestJson, { spaces: 2 });
}
