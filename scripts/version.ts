import os from 'node:os';
import path from 'node:path';

import fs from 'fs-extra';
import { inc as semverInc } from 'semver';

import pkg from '../package.json';

import { genDir, relativeToRoot } from './paths';

const versionJsPath = path.join(genDir, 'version.js');

export let version: string;

function getVersion(): string {
  const { GITHUB_ACTIONS, GITHUB_HEAD_REF, GITHUB_JOB } = process.env;

  if (!GITHUB_ACTIONS) return getLocalVersion();

  const isPublish = GITHUB_JOB === 'publish-artifacts';
  if (isPublish) return pkg.version;

  const isReleasePR = Boolean(GITHUB_HEAD_REF?.startsWith('release-please'));
  const baseVersion = isReleasePR ? pkg.version : getPatchBumpVersion();
  return getPrereleaseVersion(baseVersion);
}

function getLocalVersion(): string {
  return `${getPatchBumpVersion()}-${os.userInfo().username}.${os.hostname()}`;
}

function getPrereleaseVersion(baseVersion: string): string {
  return `${baseVersion}-${process.env.GITHUB_RUN_NUMBER}`;
}

function getPatchBumpVersion(): string {
  return semverInc(pkg.version, 'patch') || pkg.version;
}

if (fs.existsSync(versionJsPath)) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
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
