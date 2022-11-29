const path = require('path');
const fs = require('fs');
const esbuild = require('esbuild');

require('@dvanoni/zotero-plugin/copy-assets');
require('@dvanoni/zotero-plugin/generate-install-manifest');
require('@dvanoni/zotero-plugin/version');

async function build() {
  await esbuild.build({
    bundle: true,
    format: 'iife',
    target: ['firefox60'],
    entryPoints: ['src/content/notero.ts'],
    outdir: 'build/content',
    banner: { js: 'if (!Zotero.Notero) {\n' },
    footer: { js: '\n}' },
  });

  await esbuild.build({
    bundle: true,
    format: 'iife',
    globalName: 'notero',
    target: ['firefox60'],
    entryPoints: ['src/content/preferences.ts'],
    outdir: 'build/content',
  });
}

build().catch((err) => {
  console.log(err);
  process.exit(1);
});
