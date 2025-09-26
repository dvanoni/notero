import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import fs from 'fs-extra';
import { inc as semverInc } from 'semver';

import pkg from '../../package.json' with { type: 'json' };

import { genDir, relativeToRoot } from './paths.mts';

const versionJsonPath = path.join(genDir, 'version.json');

export async function getVersion(): Promise<string> {
  if (fs.existsSync(versionJsonPath)) {
    const versionJsonURL = pathToFileURL(versionJsonPath).href;
    const versionModule = (await import(versionJsonURL, {
      with: { type: 'json' },
    })) as { default: string };
    const version = versionModule.default;
    console.log(`Found ${relativeToRoot(versionJsonPath)} with ${version}`);
    return version;
  }

  const version = computeVersion();
  console.log(`Writing ${relativeToRoot(versionJsonPath)} with ${version}`);
  fs.outputJsonSync(versionJsonPath, version);
  return version;
}

function computeVersion(): string {
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
