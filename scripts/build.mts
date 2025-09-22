import esbuild from 'esbuild';

import { copyAssets } from './utils/copy-assets.mts';
import { generateInstallManifest } from './utils/generate-install-manifest.mts';

const OUTDIR = 'build';
const TARGET = 'firefox115';

type BuildOptions = {
  enableSourcemap?: boolean;
};

export async function build({ enableSourcemap = false }: BuildOptions = {}) {
  await generateInstallManifest();
  copyAssets();

  console.log('Building src/bootstrap.ts');

  await esbuild.build({
    entryPoints: ['src/bootstrap.ts'],
    keepNames: true,
    outdir: OUTDIR,
    target: TARGET,
  });

  console.log(
    'Building src/content/notero.ts and src/content/prefs/preferences.tsx',
  );

  const ctx = await esbuild.context({
    bundle: true,
    entryPoints: ['src/content/notero.ts', 'src/content/prefs/preferences.tsx'],
    external: ['components/*', 'react', 'react-dom'],
    format: 'iife',
    outbase: 'src',
    outdir: OUTDIR,
    sourcemap: enableSourcemap && 'inline',
    target: TARGET,
  });

  await ctx.watch();

  return ctx;
}

// @ts-expect-error Type for `main` is not available yet
if (import.meta.main) {
  const args = process.argv.slice(2);
  const enableSourcemap = args.includes('--sourcemap');
  const ctx = await build({ enableSourcemap });
  await ctx.dispose();
}
