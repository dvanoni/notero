import assert from 'node:assert/strict';
import path from 'node:path';

import AdmZip from 'adm-zip';
import fs from 'fs-extra';

import pkg from '../package.json';

import { buildDir, relativeToRoot, xpiDir } from './paths';
import { version } from './version';

assert.ok(fs.existsSync(buildDir), '`build` directory does not exist');

const xpiPath = path.join(xpiDir, `${pkg.name}-${version}.xpi`);

console.log(`Creating ${relativeToRoot(xpiPath)}`);

const zip = new AdmZip();
zip.addLocalFolder(buildDir);
zip.writeZip(xpiPath);
