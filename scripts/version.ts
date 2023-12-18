import os from 'os';
import path from 'path';

import fs from 'fs-extra';
import { inc as semverInc } from 'semver';

import pkg from '../package.json';

export let version: string;

const version_js = path.join(__dirname, '../gen/version.js');

if (fs.existsSync(version_js)) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  version = require(version_js) as string;
  console.log(`Found gen/version.js with ${version}`);
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

  console.log(`Writing gen/version.js with ${version}`);

  fs.outputFileSync(
    version_js,
    `module.exports = ${JSON.stringify(version)};\n`,
  );
}
