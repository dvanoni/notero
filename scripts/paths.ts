import path from 'path';

const rootDir = path.join(__dirname, '..');

export const buildDir = path.join(rootDir, 'build');
export const genDir = path.join(rootDir, 'gen');
export const srcDir = path.join(rootDir, 'src');
export const xpiDir = path.join(rootDir, 'xpi');

export const relativeToRoot = (to: string) => path.relative(rootDir, to);
