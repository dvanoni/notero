import esbuild, { type Plugin } from 'esbuild';

import { copyAndWatchAssets, copyAssets } from './utils/copy-assets.mts';
import { generateInstallManifest } from './utils/generate-install-manifest.mts';
import { buildDir } from './utils/paths.mts';

type BuildOptions = {
  sourcemap?: boolean;
  watch?: boolean;
};

type CleanupFunction = () => Promise<void>;

const TARGET = 'firefox115';

const buildPlugin: Plugin = {
  name: 'notero-build-plugin',
  setup(build) {
    build.onStart(() => {
      console.log(
        `Building ${JSON.stringify(build.initialOptions.entryPoints)}`,
      );
    });
  },
};

export async function build({
  sourcemap = false,
  watch = false,
}: BuildOptions = {}): Promise<CleanupFunction | undefined> {
  await generateInstallManifest();

  const bootstrapContext = await esbuild.context({
    entryPoints: ['src/bootstrap.ts'],
    keepNames: true,
    outdir: buildDir,
    plugins: [buildPlugin],
    target: TARGET,
  });

  const contentContext = await esbuild.context({
    bundle: true,
    entryPoints: ['src/content/notero.ts', 'src/content/prefs/preferences.tsx'],
    external: ['components/*', 'react', 'react-dom'],
    format: 'iife',
    outbase: 'src',
    outdir: buildDir,
    plugins: [buildPlugin],
    sourcemap: sourcemap && 'inline',
    target: TARGET,
  });

  if (!watch) {
    await bootstrapContext.rebuild();
    await bootstrapContext.dispose();
    await contentContext.rebuild();
    await contentContext.dispose();
    await copyAssets();
    return;
  }

  await bootstrapContext.watch();
  await contentContext.watch();
  const cleanupAssetWatcher = await copyAndWatchAssets();

  const cleanup: CleanupFunction = async () => {
    console.log('Stopping build watcher');
    await bootstrapContext.dispose();
    await contentContext.dispose();
    await cleanupAssetWatcher();
  };

  return cleanup;
}

// @ts-expect-error Type for `main` is not available yet
if (import.meta.main) {
  const args = process.argv.slice(2);
  const sourcemap = args.includes('--sourcemap');
  const watch = args.includes('--watch');

  const cleanup = await build({ sourcemap, watch });

  if (cleanup) {
    await new Promise<void>((resolve) => {
      process.on('SIGINT', resolve);
    });
    console.log('\nReceived SIGINT - shutting down gracefully...');
    await cleanup();
  }
}
