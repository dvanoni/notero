import path from 'node:path';

import { watch, FSWatcher } from 'chokidar';
import fs from 'fs-extra';

import { buildDir, relativeToRoot, srcDir } from './paths.mts';

type CleanupFunction = () => Promise<void>;

const IGNORE_PATTERNS = [/\.(json|ts|tsx)$/, /\.DS_Store$/, /__tests__/];

function srcPathToBuildPath(srcPath: string): string {
  return path.join(buildDir, path.relative(srcDir, srcPath));
}

function createWatcher(persistent: boolean): {
  close: () => Promise<void>;
  ready: Promise<void>;
  watcher: FSWatcher;
} {
  const watcher = watch(srcDir, { ignored: IGNORE_PATTERNS, persistent });

  watcher
    .on('add', (srcPath) => {
      const destPath = srcPathToBuildPath(srcPath);
      console.log(`Copying asset: ${relativeToRoot(srcPath)}`);
      fs.copySync(srcPath, destPath);
    })
    .on('error', (error) => {
      console.error('Asset watcher error:', error);
    });

  const close = () =>
    watcher.close().catch((error) => {
      console.warn('Error closing asset watcher:', error);
    });

  const ready = new Promise<void>((resolve, reject) => {
    watcher.on('ready', resolve).on('error', reject);
  });

  return { close, ready, watcher };
}

export function copyAssets(): Promise<void> {
  const { close, ready } = createWatcher(false);

  return ready.then(close);
}

export async function copyAndWatchAssets(): Promise<CleanupFunction> {
  const { close, ready, watcher } = createWatcher(true);

  watcher
    .on('change', (srcPath) => {
      const destPath = srcPathToBuildPath(srcPath);
      console.log(`Copying updated asset: ${relativeToRoot(srcPath)}`);
      fs.copySync(srcPath, destPath);
    })
    .on('unlink', (srcPath) => {
      const destPath = srcPathToBuildPath(srcPath);
      console.log(`Removing deleted asset: ${relativeToRoot(srcPath)}`);
      fs.removeSync(destPath);
    });

  await ready;

  console.log('Watching assets for changes');

  const cleanup: CleanupFunction = async () => {
    console.log('Stopping asset watcher');
    await close();
  };

  return cleanup;
}
