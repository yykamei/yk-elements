/**
 * Generates the Declarative Shadow DOM snippet page from the component
 * stylesheets on disk, so copy-paste templates never drift from the CSS
 * source of truth.
 *
 * Each entry below mirrors one component's adopted stylesheets and its exact
 * static shadow markup (the string the constructor renders on the fresh
 * path). Field entries hold the bare native control only; subclass wrappers
 * are built on upgrade, as documented in field-base.js. `test/dsd-snippets`
 * loads the generated page and hydrates every snippet, so a drifted entry
 * fails the suite instead of shipping a broken template.
 *
 * Run from the repository root:
 *
 * ```bash
 * node scripts/dsd.mjs
 * ```
 *
 * This rewrites `docs/dsd.html`. The file is generated; edit this script
 * instead and rerun it. Template skeletons gain href, text, media, and heading
 * content from host attributes and light DOM at upgrade, which lint's
 * anchor/media/heading a11y rules cannot see — that is why biome.json
 * overrides them off for the generated page.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const css = (path) => readFileSync(join(root, path), 'utf8').trim();

const delegates = ' shadowrootdelegatesfocus';

const alertSvg =
  '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg>';
const trashSvg =
  '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6 2.75h4M3.25 4.5h9.5M4.5 4.5l.5 8.25a1 1 0 0 0 1 .75h4a1 1 0 0 0 1-.75l.5-8.25M6.75 7v4M9.25 7v4" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" /></svg>';
const plusSvg =
  '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 3.25v9.5M3.25 8h9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg>';
const playSvg =
  '<svg part="play-icon" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3l8 5-8 5z" fill="currentColor" /></svg>';
const pauseSvg =
  '<svg part="pause-icon" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3h2v10H5zM9 3h2v10H9z" fill="currentColor" /></svg>';
const systemSvg =
  '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="3" width="12" height="8" rx="1" /><path d="M5 14h6M8 11v3" /></svg>';
const lightSvg =
  '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="3" /><path d="M8 1.5v1.25M8 13.25v1.25M2.575 3.575l.875.875M12.55 12.55l.875.875M1.5 8h1.25M13.25 8h1.25M3.575 12.55l.875-.875M12.55 3.575l-.875.875" /></svg>';
const darkSvg =
  '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13.2 10.6A5.5 5.5 0 015.4 2.8 6.5 6.5 0 1013.2 10.6z" /></svg>';

// tag: the custom element name.
// stylesheets: component CSS files in adoption order, read from disk.
// shadow: the exact static shadow markup the constructor renders.
// attrs/light: demo attributes and light-DOM children (also the mirror
// fixtures the snippet test asserts against, so keep them meaningful).
// delegates: whether the template carries shadowrootdelegatesfocus.
const entries = [
  {
    tag: 'yk-vstack',
    stylesheets: ['src/layout/yk-vstack.css'],
    shadow: '<slot></slot>',
    light: '<p>First</p><p>Second</p>',
  },
  {
    tag: 'yk-hstack',
    stylesheets: ['src/layout/yk-hstack.css'],
    shadow: '<slot></slot>',
    light: '<p>First</p><p>Second</p>',
  },
  {
    tag: 'yk-cluster',
    stylesheets: ['src/layout/yk-cluster.css'],
    shadow: '<slot></slot>',
    light: '<p>First</p><p>Second</p>',
  },
  {
    tag: 'yk-grid',
    stylesheets: ['src/layout/yk-grid.css'],
    shadow: '<slot></slot>',
    light: '<p>First</p><p>Second</p>',
  },
  {
    tag: 'yk-pad',
    stylesheets: ['src/layout/yk-pad.css'],
    shadow: '<slot></slot>',
    light: '<p>Padded</p>',
  },
  {
    tag: 'yk-container',
    stylesheets: ['src/layout/yk-container.css'],
    shadow: '<slot></slot>',
    light: '<p>Contained</p>',
  },
  {
    tag: 'yk-button',
    stylesheets: [
      'src/components/button-core.css',
      'src/components/yk-button.css',
    ],
    delegates: true,
    shadow: '<button part="button" type="button"><slot></slot></button>',
    attrs: 'variant="primary"',
    light: 'Save',
  },
  {
    tag: 'yk-link',
    stylesheets: [
      'src/components/button-core.css',
      'src/components/yk-link.css',
    ],
    delegates: true,
    shadow: '<a part="link"><slot></slot></a>',
    attrs: 'href="/pricing" variant="primary"',
    light: 'See pricing',
  },
  {
    tag: 'yk-badge',
    stylesheets: ['src/components/yk-badge.css'],
    shadow: '<slot></slot>',
    attrs: 'variant="primary"',
    light: 'Beta',
  },
  {
    tag: 'yk-card',
    stylesheets: ['src/components/yk-card.css'],
    shadow:
      '<div part="header"><slot name="header"></slot></div>' +
      '<div part="body"><slot></slot></div>' +
      '<div part="footer"><slot name="footer"></slot></div>',
    light:
      '<h2 slot="header">Title</h2><p>Body</p><span slot="footer">Footer</span>',
  },
  {
    tag: 'yk-footer-links',
    stylesheets: [
      'src/components/footer-core.css',
      'src/components/yk-footer-links.css',
    ],
    shadow:
      '<nav part="nav" aria-labelledby="heading">' +
      '<h2 part="heading" id="heading"></h2>' +
      '<div part="links"><slot></slot></div>' +
      '</nav>',
    attrs: 'heading="Resources"',
    light:
      '<a href="https://example.com/docs">Documentation</a><a href="https://example.com/support">Support</a>',
  },
  {
    tag: 'yk-field-list-item',
    stylesheets: ['src/components/yk-field-list-item.css'],
    shadow:
      '<div part="content"><slot></slot></div>' +
      `<button part="remove" type="button" aria-label="Remove item">${trashSvg}</button>`,
    attrs: 'remove-label="Remove this row"',
    light: '<p>Example sentence content</p>',
  },
  {
    tag: 'yk-field-list',
    stylesheets: ['src/components/yk-field-list.css'],
    shadow:
      '<div part="items"><slot></slot></div>' +
      `<button part="add" type="button">${plusSvg}<span part="add-label">Add item</span></button>`,
    attrs: 'add-label="Add row" remove-label="Remove row"',
    light:
      '<template><p>New row</p></template><yk-field-list-item><p>Existing row</p></yk-field-list-item>',
  },
  {
    tag: 'yk-alert',
    stylesheets: ['src/components/yk-alert.css'],
    shadow:
      '<div part="content"><slot></slot></div>' +
      `<button part="dismiss" type="button">${alertSvg}</button>` +
      '<slot name="dismiss-label" hidden>Dismiss</slot>',
    attrs: 'variant="danger"',
    light: 'Something happened',
  },
  {
    tag: 'yk-dialog',
    stylesheets: ['src/components/yk-dialog.css'],
    shadow:
      '<dialog part="dialog">' +
      '<div part="header"><slot name="header"></slot></div>' +
      '<div part="body"><slot></slot></div>' +
      '<div part="footer"><slot name="footer"></slot></div>' +
      `<button part="close" type="button">${alertSvg}</button>` +
      '<slot name="close-label" hidden>Close</slot>' +
      '</dialog>',
    light: '<h2 slot="header">Title</h2><p>Body</p>',
  },
  {
    tag: 'yk-progress',
    stylesheets: ['src/components/yk-progress.css'],
    shadow: '<progress part="progress"></progress>',
    attrs: 'value="40" max="100" aria-label="Progress"',
  },
  {
    tag: 'yk-audio',
    stylesheets: ['src/components/yk-audio.css'],
    shadow:
      `<button part="play" type="button">${playSvg}${pauseSvg}</button>` +
      '<input part="timeline" type="range" min="0" max="0" value="0" step="any">' +
      '<span part="time"></span>' +
      '<audio preload="metadata"></audio>' +
      '<slot name="play-label" hidden>Play</slot>' +
      '<slot name="pause-label" hidden>Pause</slot>' +
      '<slot name="seek-label" hidden>Seek</slot>',
  },
  {
    tag: 'yk-theme-switcher',
    stylesheets: ['src/components/yk-theme-switcher.css'],
    shadow:
      '<div part="group" role="radiogroup" aria-label="Theme">' +
      `<label part="option"><input type="radio" name="theme" value="system">${systemSvg}<span class="label">System</span></label>` +
      `<label part="option"><input type="radio" name="theme" value="light">${lightSvg}<span class="label">Light</span></label>` +
      `<label part="option"><input type="radio" name="theme" value="dark">${darkSvg}<span class="label">Dark</span></label>` +
      '</div>',
  },
  {
    tag: 'yk-input-text',
    stylesheets: ['src/components/input-core.css'],
    delegates: true,
    shadow: '<input type="text" part="input">',
    attrs: 'value="prefill" placeholder="Type here"',
  },
  {
    tag: 'yk-input-email',
    stylesheets: ['src/components/input-core.css'],
    delegates: true,
    shadow: '<input type="email" part="input">',
    attrs: 'value="a@b.co" placeholder="you@example.com"',
  },
  {
    tag: 'yk-input-tel',
    stylesheets: ['src/components/input-core.css'],
    delegates: true,
    shadow: '<input type="tel" part="input">',
    attrs: 'value="090-1234-5678"',
  },
  {
    tag: 'yk-input-url',
    stylesheets: ['src/components/input-core.css'],
    delegates: true,
    shadow: '<input type="url" part="input">',
    attrs: 'value="https://example.com"',
  },
  {
    tag: 'yk-input-password',
    stylesheets: ['src/components/input-core.css'],
    delegates: true,
    shadow: '<input type="password" part="input">',
    attrs: 'autocomplete="current-password"',
  },
  {
    tag: 'yk-input-search',
    stylesheets: ['src/components/input-core.css'],
    delegates: true,
    shadow: '<input type="search" part="input">',
    attrs: 'value="query"',
  },
  {
    tag: 'yk-input-file',
    stylesheets: [
      'src/components/input-core.css',
      'src/components/yk-input-file.css',
    ],
    delegates: true,
    shadow: '<input type="file" part="input">',
    attrs: 'accept="image/png"',
  },
  {
    tag: 'yk-input-checkbox',
    stylesheets: ['src/components/yk-input-checkbox.css'],
    delegates: true,
    shadow: '<input type="checkbox" part="input">',
    attrs: 'checked',
    light: 'Subscribe',
  },
  {
    tag: 'yk-textarea',
    stylesheets: ['src/components/input-core.css'],
    delegates: true,
    shadow: '<textarea part="textarea"></textarea>',
    attrs: 'rows="4" placeholder="Write here"',
  },
  {
    tag: 'yk-select',
    stylesheets: [
      'src/components/input-core.css',
      'src/components/yk-select.css',
    ],
    delegates: true,
    shadow: '<select part="select"></select>',
    attrs: 'required',
    light:
      '<option value="noun" selected>noun</option><option value="verb">verb</option>',
  },
  {
    tag: 'yk-combobox',
    stylesheets: ['src/components/yk-combobox.css'],
    delegates: true,
    shadow: '<input type="text" part="input">',
    attrs: 'placeholder="Search…"',
    light:
      '<option value="noun" selected>noun</option><option value="verb">verb</option>',
  },
];

const escapeHtml = (text) =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

const snippetOf = (entry) => {
  const style = entry.stylesheets.map(css).join('\n');
  const open = `<${entry.tag}${entry.attrs ? ` ${entry.attrs}` : ''}>`;
  const template =
    `<template shadowrootmode="open"${entry.delegates ? delegates : ''}>` +
    `<style>\n${style}\n</style>` +
    entry.shadow +
    '</template>';
  return `${open}\n${template}\n${entry.light ?? ''}\n</${entry.tag}>`;
};

const sectionOf = (entry) => {
  const snippet = snippetOf(entry);
  return (
    `<section>\n<h2><code>${entry.tag}</code></h2>\n` +
    `<div data-demo="${entry.tag}">\n${snippet}\n</div>\n` +
    `<pre><code>${escapeHtml(snippet)}</code></pre>\n</section>`
  );
};

const page = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Declarative Shadow DOM snippets — yk-elements</title>
    <link rel="stylesheet" href="../tokens.css" />
    <script type="module" src="../index.js"></script>
  </head>
  <body>
    <h1>Declarative Shadow DOM snippets</h1>
    <p>
      Each demo below ships its shadow root in the initial HTML, so it paints
      styled before the component module loads. Copy a snippet as-is; the live
      demo above it is that exact markup. Templates must match exactly: field
      templates hold the bare native control (wrappers are built on upgrade),
      and focus-delegating templates carry shadowrootdelegatesfocus.
    </p>
${entries.map(sectionOf).join('\n')}
  </body>
</html>
`;

writeFileSync(join(root, 'docs', 'dsd.html'), `${page}\n`);
console.log(`wrote docs/dsd.html (${entries.length} snippets)`);
