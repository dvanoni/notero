import esbuild, { BuildOptions } from 'esbuild';

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
    format: 'iife',
    target,
    entryPoints: ['src/content/notero.ts'],
    outdir: 'build/content',
  },
  {
    bundle: true,
    format: 'iife',
    globalName: 'notero',
    target,
    entryPoints: ['src/content/prefs/preferences.tsx'],
    external: ['components/*', 'react', 'react-dom', 'react-intl'],
    outdir: 'build/content/prefs',
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
