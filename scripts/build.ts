import esbuild, { BuildOptions } from 'esbuild';

const banner = `if (!Zotero.Notero) {

// Make timer functions globally available in Zotero 6
if (typeof setTimeout === 'undefined') {
  var setTimeout = Zotero.setTimeout;
}
if (typeof clearTimeout === 'undefined') {
  var clearTimeout = Zotero.clearTimeout;
}
`;

const builds: (BuildOptions & { entryPoints: [string] })[] = [
  {
    entryPoints: ['src/bootstrap.ts'],
    keepNames: true,
    outdir: 'build',
    target: ['firefox60'],
  },
  {
    bundle: true,
    format: 'iife',
    target: ['firefox60'],
    entryPoints: ['src/content/notero.ts'],
    outdir: 'build/content',
    banner: { js: banner },
    footer: { js: '\n}' },
  },
  {
    bundle: true,
    format: 'iife',
    globalName: 'notero',
    target: ['firefox60'],
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
    require('./copy-assets');
    require('./generate-install-manifest');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
