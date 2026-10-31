/**
 * Installs the yk-elements document-level stylesheets exactly once.
 *
 * Every component module imports this module, so loading the entry point or a
 * single component gives the page the yk-elements design tokens and the
 * user-agent normalization without a separate stylesheet link. Both sheets are
 * adopted in the low-priority `yk-elements` cascade layer, so unlayered
 * application CSS overrides them. A consumer that uses cascade layers should
 * declare `@layer yk-elements;` before its own layers, or keep the override
 * unlayered.
 *
 * ```js
 * import './base.js';
 * ```
 */
import tokensSheet from '../tokens.css' with { type: 'css' };
import normalizeSheet from './normalize.css' with { type: 'css' };

const BASE_SHEETS = [tokensSheet, normalizeSheet];

function installBaseStyles() {
  const adopted = document.adoptedStyleSheets;
  const missing = BASE_SHEETS.filter((sheet) => !adopted.includes(sheet));
  if (missing.length === 0) return;
  document.adoptedStyleSheets = [...adopted, ...missing];
}

installBaseStyles();
