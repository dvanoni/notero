import path from 'node:path';

import fs from 'fs-extra';

import { buildDir, relativeToRoot, srcDir } from './paths.mts';

const IGNORED_EXTENSIONS = ['.json', '.ts', '.tsx'];
const IGNORED_PATHS = /(\.DS_Store|__tests__)$/;

// https://gist.github.com/jakub-g/5903dc7e4028133704a4
function removeEmptyDirectories(dirPath: string) {
  if (!fs.statSync(dirPath).isDirectory()) return;

  let files = fs.readdirSync(dirPath);

  if (files.length > 0) {
    files.forEach((file) => {
      removeEmptyDirectories(path.join(dirPath, file));
    });
    files = fs.readdirSync(dirPath);
  }

  if (files.length === 0) {
    fs.rmdirSync(dirPath);
  }
}

export function copyAssets() {
  console.group('Copying assets');

  fs.copySync(srcDir, buildDir, {
    filter(src) {
      const include =
        !IGNORED_EXTENSIONS.includes(path.extname(src).toLowerCase()) &&
        !IGNORED_PATHS.test(src);
      if (include && fs.statSync(src).isFile()) {
        console.log(relativeToRoot(src));
      }
      return include;
    },
  });

  console.groupEnd();

  removeEmptyDirectories(buildDir);
}
