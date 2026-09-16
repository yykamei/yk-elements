import { readFileSync } from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

/**
 * Vite plugin that emulates CSS Module Scripts for the Vitest browser.
 *
 * Components load styles with `import sheet from './x.css' with { type: 'css' }`,
 * which only works in browsers. Vite's own CSS pipeline would turn the import
 * into an injected <style> tag instead of a CSSStyleSheet, so this plugin
 * rewrites such imports to a virtual module that builds a constructable
 * stylesheet, letting components run unchanged under test.
 *
 * The virtual id ends in `.yk-css.js` (not `.css`) so Vite's internal CSS
 * pipeline ignores it and serves our JS module as-is.
 *
 * Note: watch mode does not rerun tests when a .css file changes (the virtual
 * module is not tied to a watched file); use a full `npm test` run after CSS
 * edits.
 *
 * @returns {import('vite').Plugin}
 */
function cssModuleScripts() {
  const QUERY = '?yk-css';
  const MARKER = '.yk-css.js';
  return {
    name: 'yk-css-module-scripts',
    enforce: 'pre',
    transform(code, id) {
      if (!id.split('?')[0].endsWith('.js')) return;
      if (!/\.css['"]\s*with\s*\{\s*type:\s*['"]css['"]\s*\}/.test(code))
        return;
      return {
        code: code.replace(
          /(from\s*)(['"])([^'"]+\.css)\2\s*with\s*\{\s*type:\s*(['"])css\4\s*\}/g,
          `$1$2$3${QUERY}$2`,
        ),
        map: null,
      };
    },
    resolveId(id, importer) {
      if (!id.includes(QUERY)) return;
      const spec = id.split(QUERY)[0];
      // Bare (package) specifiers are not local files; leave them to Vite.
      if (!spec.startsWith('.') && !isAbsolute(spec)) return;
      const baseDir = importer
        ? dirname(importer.split('?')[0])
        : process.cwd();
      const file = isAbsolute(spec) ? spec : join(baseDir, spec);
      return `${file}${MARKER}`;
    },
    load(id) {
      if (!id.split('?')[0].endsWith(MARKER)) return;
      const raw = id.split('?')[0].slice(0, -MARKER.length);
      const file = raw.startsWith('file://') ? fileURLToPath(raw) : raw;
      return {
        code: `const sheet = new CSSStyleSheet();\nsheet.replaceSync(${JSON.stringify(readFileSync(file, 'utf8'))});\nexport default sheet;`,
        map: null,
      };
    },
  };
}

export default defineConfig({
  plugins: [cssModuleScripts()],
  test: {
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: 'chromium' }],
    },
  },
});
