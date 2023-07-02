const esbuild = require('esbuild');

require('@dvanoni/zotero-plugin/copy-assets');
require('@dvanoni/zotero-plugin/generate-install-manifest');
require('@dvanoni/zotero-plugin/version');

const banner = `if (!Zotero.Notero) {

// Make timer functions globally available in Zotero 6
if (typeof setTimeout === 'undefined') {
  var setTimeout = Zotero.setTimeout;
}
if (typeof clearTimeout === 'undefined') {
  var clearTimeout = Zotero.clearTimeout;
}
`;

const builds = [
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
].map((buildOptions) => esbuild.build(buildOptions));

Promise.all(builds).catch((err) => {
  console.error(err);
  process.exit(1);
});
