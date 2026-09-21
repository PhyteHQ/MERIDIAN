import { build } from 'vite';
import { cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
await build({ configFile: path.join(root, 'vite.pages.config.ts') });

// Commit these files so Pages can publish main / (root), just like DTR.
// Remove only this build's old hashed assets; preserve any hand-added files.
const assets = path.join(root, 'assets');
await mkdir(assets, { recursive: true });
for (const file of await readdir(assets)) {
  if (/^meridian-.*\.(js|css)$/.test(file)) await rm(path.join(assets, file));
}
const output = path.join(root, '.pages-build');
await cp(path.join(output, 'assets'), assets, { recursive: true });
await cp(path.join(output, 'index.html'), path.join(root, 'index.html'));
await cp(path.join(output, 'favicon.svg'), path.join(root, 'favicon.svg'));
await writeFile(path.join(root, '.nojekyll'), '');
console.log('GitHub Pages ready: publish main / (root).');
