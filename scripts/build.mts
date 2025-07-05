import esbuild, { type BuildOptions } from 'esbuild';

const enableSourcemap = process.argv.slice(2).includes('--sourcemap');
const sourcemap = enableSourcemap && 'inline';
const target = 'firefox115';

const builds: (BuildOptions & { entryPoints: [string] })[] = [
  {
    entryPoints: ['src/bootstrap.ts'],
    keepNames: true,
    outdir: 'build',
    target,
  },
  {
    bundle: true,
    entryPoints: ['src/content/notero.ts'],
    format: 'iife',
    outdir: 'build/content',
    sourcemap,
    target,
  },
  {
    bundle: true,
    entryPoints: ['src/content/prefs/preferences.tsx'],
    external: ['components/*', 'react', 'react-dom'],
    format: 'iife',
    globalName: 'notero',
    outdir: 'build/content/prefs',
    sourcemap,
    target,
  },
];

Promise.all(
  builds.map((buildOptions) => {
    console.log(`Building ${buildOptions.entryPoints[0]}`);
    return esbuild.build(buildOptions);
  }),
)
  .then(async () => {
    await import('./copy-assets.mts');
    await import('./generate-install-manifest.mts');
  })
  .catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
