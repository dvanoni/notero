import path from 'path';

import fs from 'fs-extra';

const IGNORED_EXTENSIONS = ['.json', '.ts', '.tsx'];
const IGNORED_PATHS = /(\.DS_Store|__tests__)$/;

const rootDir = path.join(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const destDir = path.join(rootDir, 'build');

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

console.group('Copying assets');

fs.copySync(srcDir, destDir, {
  filter(src) {
    const include =
      !IGNORED_EXTENSIONS.includes(path.extname(src).toLowerCase()) &&
      !IGNORED_PATHS.test(src);
    if (include) console.log(path.relative(rootDir, src));
    return include;
  },
});

console.groupEnd();

removeEmptyDirectories(destDir);
