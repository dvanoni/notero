import path from 'node:path';

export const rootDir = path.join(import.meta.dirname, '../..');

export const buildDir = path.join(rootDir, 'build');
export const genDir = path.join(rootDir, 'gen');
export const srcDir = path.join(rootDir, 'src');
export const xpiDir = path.join(rootDir, 'xpi');

export const relativeToRoot = (to: string) => path.relative(rootDir, to);
