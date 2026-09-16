import { readdirSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { build } from 'esbuild';

/**
 * Minifies every source JS and CSS file into dist/, mirroring the source
 * tree so relative imports (including `with { type: 'css' }` CSS module
 * scripts) keep resolving unchanged. Output files are plain ESM modules;
 * nothing is bundled.
 *
 * The dist/ tree is what CDNs serve for `<script type="module">` usage.
 */
function listSourceFiles() {
  const files = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && /\.(js|css)$/.test(entry.name)) {
        files.push(full);
      }
    }
  };
  walk('src');
  files.push('index.js', 'tokens.css');
  return files;
}

// esbuild only overwrites files it emits; clear dist/ first so components
// removed from src/ do not leave stale files that CDNs would keep serving.
await rm('dist', { recursive: true, force: true });

await build({
  entryPoints: listSourceFiles(),
  bundle: false,
  format: 'esm',
  minify: true,
  outdir: 'dist',
  outbase: '.',
  logLevel: 'info',
});
