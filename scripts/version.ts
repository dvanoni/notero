import os from 'node:os';
import path from 'node:path';

import fs from 'fs-extra';
import { inc as semverInc } from 'semver';

import pkg from '../package.json';

import { genDir, relativeToRoot } from './paths';

const versionJsPath = path.join(genDir, 'version.js');

export let version: string;

function getVersion(): string {
  const isGitHubActions = Boolean(process.env.GITHUB_ACTIONS);
  const isPublish = process.env.GITHUB_JOB === 'publish-artifacts';

  if (!isGitHubActions) return getLocalVersion();

  if (!isPublish) return getPrereleaseVersion();

  return pkg.version;
}

function getLocalVersion(): string {
  return `${getPatchBumpVersion()}-${os.userInfo().username}.${os.hostname()}`;
}

function getPrereleaseVersion(): string {
  return `${getPatchBumpVersion()}-${process.env.GITHUB_RUN_NUMBER}`;
}

function getPatchBumpVersion(): string {
  return semverInc(pkg.version, 'patch') || pkg.version;
}

if (fs.existsSync(versionJsPath)) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  version = require(versionJsPath) as string;
  console.log(`Found ${relativeToRoot(versionJsPath)} with ${version}`);
} else {
  version = getVersion();
  console.log(`Writing ${relativeToRoot(versionJsPath)} with ${version}`);

  fs.outputFileSync(
    versionJsPath,
    `module.exports = ${JSON.stringify(version)};\n`,
  );
}
