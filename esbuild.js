const path = require('path');
const fs = require('fs');
const esbuild = require('esbuild');

require('zotero-plugin/copy-assets');
require('zotero-plugin/rdf');
require('zotero-plugin/version');

async function build() {
  await esbuild.build({
    bundle: true,
    format: 'iife',
    target: ['firefox60'],
    entryPoints: ['content/notero.ts'],
    outdir: 'build/content',
    banner: { js: 'if (!Zotero.Notero) {\n' },
    footer: { js: '\n}' },
  });
}

build().catch((err) => {
  console.log(err);
  process.exit(1);
});
