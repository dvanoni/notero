import os from 'node:os';
import path from 'node:path';

import fs from 'fs-extra';
import { inc as semverInc } from 'semver';

import pkg from '../package.json';

import { genDir, relativeToRoot } from './paths';

export let version: string;

const versionJsPath = path.join(genDir, 'version.js');

if (fs.existsSync(versionJsPath)) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  version = require(versionJsPath) as string;
  console.log(`Found ${relativeToRoot(versionJsPath)} with ${version}`);
} else {
  version = pkg.version;

  const isGitHubActions = Boolean(process.env.GITHUB_ACTIONS);
  const isGitHubTagRun = process.env.GITHUB_REF_TYPE === 'tag';

  if (isGitHubActions && !isGitHubTagRun) {
    version = `${semverInc(version, 'patch')}-${process.env.GITHUB_RUN_NUMBER}`;
  } else if (!isGitHubActions) {
    version = `${semverInc(version, 'patch')}-${
      os.userInfo().username
    }.${os.hostname()}`;
  }

  console.log(`Writing ${relativeToRoot(versionJsPath)} with ${version}`);

  fs.outputFileSync(
    versionJsPath,
    `module.exports = ${JSON.stringify(version)};\n`,
  );
}
