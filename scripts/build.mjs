#!/usr/bin/env node

import ES from 'esbuild';
import { readFile } from 'fs/promises';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const myDir = dirname(fileURLToPath(import.meta.url));
const pkgJSONPath = resolve(myDir, '../package.json');
const [ inPath, outPath ] = process.argv.slice(2, 4).map(x => resolve(x));

const baseOpts = {
  bundle: true,
  platform: 'node',
  // sourcemap: 'inline',
}

function loadPathOpts() {
  if (!inPath) { throw new Error(`invalid 'in' path: ${inPath}`) }
  if (!outPath) { throw new Error(`invalid 'out' path: ${outPath}`) }

  return {
    entryPoints: [ inPath ],
    outfile: outPath,
  }
}

async function loadExternals () {
  const pkgData = await readFile(pkgJSONPath);
  const info = JSON.parse(pkgData);
  return [
    ...Object.keys(info.dependencies || {}),
    ...Object.keys(info.devDependencies || {}),
    ...Object.keys(info.peerDependencies || {}),
  ];
}

(async () => {
  try {
    const opts = {
      ...baseOpts,
      ...loadPathOpts(),
      external: await loadExternals(),
    };

    ES.build(opts);
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
})();
