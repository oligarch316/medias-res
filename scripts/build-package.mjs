#!/usr/bin/env node

import { readFile, writeFile } from 'fs/promises';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const myDir = dirname(fileURLToPath(import.meta.url));
const pkgJSONPath = resolve(myDir, '../package.json');
const [ outPath, entryPath ] = process.argv.slice(2, 4).map(x => resolve(x));

const copiedKeys = [
  'name',
  'version',
  'description',
  'keywords',
  'homepage',
  'bugs',
  'license',
  'author',
  'contributors',
  'funding',
  'repository',
  'dependencies',
];

if (!outPath) { throw new Error(`invalid 'out' path: ${outPath}`) }
if (!entryPath) { throw new Error(`invalid 'main entry point' path: ${entryPath}`) }

async function loadCopiedData () {
  const pkgData = await readFile(pkgJSONPath);
  const info = JSON.parse(pkgData);
  
  return Object.keys(info)
    .filter(k => copiedKeys.includes(k))
    .reduce((res, k) => {
      res[k] = info[k];
      return res;
    }, {});
}

function formatEntry () {
  const outDir = `${dirname(outPath)}/`;
  return (entryPath.indexOf(outDir) === 0) ? entryPath.slice(outDir.length) : entryPath;
}

(async () => {
  const data = await loadCopiedData();
  data['main'] = formatEntry();

  const buf = Buffer.from(JSON.stringify(data, null, 2));
  await writeFile(outPath, buf);
})();
