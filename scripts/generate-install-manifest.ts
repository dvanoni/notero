import path from 'node:path';

import fs from 'fs-extra';
import pug from 'pug';

import pkg from '../package.json';

import { buildDir, relativeToRoot } from './paths';
import { version } from './version';

const installRdfPath = path.join(buildDir, 'install.rdf');
const manifestJsonPath = path.join(buildDir, 'manifest.json');

console.log(`Generating ${relativeToRoot(installRdfPath)}`);

const installRdfVars = {
  bootstrapped: pkg.xpi.bootstrapped,
  creator: pkg.author.name,
  description: pkg.description,
  homepageURL: pkg.homepage,
  id: pkg.xpi.id,
  name: pkg.xpi.name,
  updateURL: `${pkg.xpi.releaseURL}update.rdf`,
  version,
};

const template = fs.readFileSync(
  path.join(__dirname, 'install.rdf.pug'),
  'utf8',
);

const installRdf = pug.render(template, { ...installRdfVars, pretty: true });

fs.outputFileSync(installRdfPath, installRdf);

console.log(`Generating ${relativeToRoot(manifestJsonPath)}`);

const manifestJson = {
  author: pkg.author.name,
  description: pkg.description,
  homepage_url: pkg.homepage,
  manifest_version: 2,
  name: pkg.xpi.name,
  version,
  applications: {
    zotero: {
      id: pkg.xpi.id,
      update_url: `${pkg.xpi.releaseURL}updates.json`,
      strict_min_version: '6.999',
      strict_max_version: '7.0.*',
    },
  },
};

fs.outputJsonSync(manifestJsonPath, manifestJson, { spaces: 2 });
