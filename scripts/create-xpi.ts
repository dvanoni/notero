import path from 'path';

import AdmZip from 'adm-zip';
import fs from 'fs-extra';

import pkg from '../package.json';

import { version } from './version';

const rootDir = path.join(__dirname, '..');
const buildDir = path.join(rootDir, 'build');
const xpiDir = path.join(rootDir, 'xpi');

if (!fs.pathExistsSync(buildDir)) {
  throw new Error('`build` directory does not exist');
}

const xpiName = `${pkg.name}-${version}.xpi`;

console.log(`Creating ${xpiName}`);

const zip = new AdmZip();
zip.addLocalFolder(buildDir);
zip.writeZip(path.join(xpiDir, xpiName));
