import esbuild, { BuildOptions } from 'esbuild';

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
  .then(() => {
    /* eslint-disable @typescript-eslint/no-require-imports */
    require('./copy-assets');
    require('./generate-install-manifest');
    /* eslint-enable @typescript-eslint/no-require-imports */
  })
  .catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
