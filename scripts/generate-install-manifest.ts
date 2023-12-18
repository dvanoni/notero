import path from 'path';

import fs from 'fs-extra';
import pug from 'pug';

import pkg from '../package.json';

import { version } from './version';

const INSTALL_RDF_PATH = 'build/install.rdf';
const MANIFEST_JSON_PATH = 'build/manifest.json';

const rootDir = path.join(__dirname, '..');

console.log(`Generating ${INSTALL_RDF_PATH}`);

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

fs.outputFileSync(path.join(rootDir, INSTALL_RDF_PATH), installRdf);

console.log(`Generating ${MANIFEST_JSON_PATH}`);

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

fs.outputJsonSync(path.join(rootDir, MANIFEST_JSON_PATH), manifestJson, {
  spaces: 2,
});
