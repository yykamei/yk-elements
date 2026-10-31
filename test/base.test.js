// @ts-check
import { afterEach, expect, test } from 'vitest';
import '../src/components/yk-card.js';
import '../src/layout/yk-container.js';
import '../src/layout/yk-vstack.js';
import indexSource from '../index.js?raw';
import normalizeSheet from '../src/normalize.css' with { type: 'css' };
import normalizeCss from '../src/normalize.css?raw';
import tokensSheet from '../tokens.css' with { type: 'css' };
import tokensCss from '../tokens.css?raw';

const layoutTags = Object.keys(import.meta.glob('../src/layout/yk-*.js'))
  .map((path) => path.split('/').at(-1).replace(/\.js$/, ''))
  .sort();

// Kept in sync with the block-margin list in normalize.css.
const BLOCK_ELEMENTS = [
  'address',
  'blockquote',
  'dl',
  'figure',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'menu',
  'ol',
  'p',
  'pre',
  'ul',
].sort();

const componentModules = import.meta.glob(
  '../src/{components,layout}/yk-*.js',
  {
    eager: true,
    query: '?raw',
    import: 'default',
  },
);

afterEach(() => {
  document.body.replaceChildren();
  document.querySelectorAll('style[data-test-override]').forEach((style) => {
    style.remove();
  });
  for (const name of [
    '--yk-font-family',
    '--yk-font-size',
    '--yk-line-height',
  ]) {
    document.documentElement.style.removeProperty(name);
  }
});

function append(tag, html = '') {
  const element = document.createElement(tag);
  element.innerHTML = html;
  document.body.append(element);
  return element;
}

function contentFor(tag) {
  if (tag === 'ul' || tag === 'ol' || tag === 'menu') return '<li>Item</li>';
  if (tag === 'dl') return '<dt>Term</dt>';
  if (tag === 'figure') return '<figcaption>Caption</figcaption>';
  if (tag === 'hr') return '';
  return 'Content';
}

function blockMargins(element) {
  const style = getComputedStyle(element);
  return [style.marginBlockStart, style.marginBlockEnd];
}

function rootFontSize() {
  return Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
}

test('installs the token and normalization sheets exactly once', () => {
  expect(document.adoptedStyleSheets).toContain(tokensSheet);
  expect(document.adoptedStyleSheets).toContain(normalizeSheet);
  expect(
    document.adoptedStyleSheets.filter((sheet) => sheet === tokensSheet),
  ).toHaveLength(1);
  expect(
    document.adoptedStyleSheets.filter((sheet) => sheet === normalizeSheet),
  ).toHaveLength(1);
});

test('the entry point installs the base styles before loading components', () => {
  const baseImport = indexSource.indexOf("import './src/base.js';");
  const firstComponentImport = indexSource.indexOf("import './src/layout/");
  expect(baseImport).toBeGreaterThanOrEqual(0);
  expect(firstComponentImport).toBeGreaterThan(baseImport);
});

test('every public component module installs the base styles', () => {
  const paths = Object.keys(componentModules);
  expect(paths.length).toBeGreaterThan(0);
  for (const [path, source] of Object.entries(componentModules)) {
    expect(source, path).toMatch(/import '\.\.\/base\.js';/);
  }
});

test('puts the base styles in the documented cascade layers', () => {
  expect(tokensCss).toContain('@layer yk-elements.tokens');
  expect(normalizeCss).toContain('@layer yk-elements.normalize');
});

test('runs the suite with the light color scheme the tokens assume', () => {
  expect(window.matchMedia('(prefers-color-scheme: dark)').matches).toBe(false);
});

test('applies the yk-elements base typography and colors to the page', () => {
  const body = getComputedStyle(document.body);
  expect(body.fontFamily).toContain('system-ui');
  expect(Number.parseFloat(body.lineHeight)).toBeCloseTo(
    Number.parseFloat(body.fontSize) * 1.5,
  );
  expect([
    body.marginTop,
    body.marginRight,
    body.marginBottom,
    body.marginLeft,
  ]).toEqual(['0px', '0px', '0px', '0px']);

  const probe = append('div');
  probe.style.color = 'var(--yk-color-text)';
  probe.style.backgroundColor = 'var(--yk-color-bg)';
  const probeStyle = getComputedStyle(probe);
  expect(body.color).toBe(probeStyle.color);
  expect(body.backgroundColor).toBe(probeStyle.backgroundColor);
});

test('lets application tokens restyle the base typography', () => {
  document.documentElement.style.setProperty('--yk-font-family', 'serif');
  document.documentElement.style.setProperty('--yk-font-size', '20px');
  document.documentElement.style.setProperty('--yk-line-height', '1.2');

  const body = getComputedStyle(document.body);
  expect(body.fontFamily).toContain('serif');
  expect(body.fontSize).toBe('20px');
  expect(Number.parseFloat(body.lineHeight)).toBeCloseTo(24);
});

test('removes block margins throughout the page, including inside yk-card', () => {
  for (const tag of BLOCK_ELEMENTS) {
    const element = append(tag, contentFor(tag));
    expect(blockMargins(element), tag).toEqual(['0px', '0px']);
  }

  const card = append('yk-card', '<div><p>Body</p></div>');
  expect(blockMargins(card.querySelector('p'))).toEqual(['0px', '0px']);
});

test('keeps inline indentation, list markers, and the heading scale', () => {
  const heading = append('h1', 'Title');
  const list = append('ul', '<li>Item</li>');
  const figure = append('figure', '<figcaption>Caption</figcaption>');

  const listStyle = getComputedStyle(list);
  expect(Number.parseFloat(listStyle.paddingInlineStart)).toBeGreaterThan(0);
  expect(listStyle.listStyleType).not.toBe('none');
  expect(
    Number.parseFloat(getComputedStyle(figure).marginInlineStart),
  ).toBeGreaterThan(0);
  expect(Number.parseFloat(getComputedStyle(heading).fontSize)).toBeGreaterThan(
    Number.parseFloat(getComputedStyle(document.body).fontSize),
  );
});

test('uses border-box for ordinary content but keeps layout hosts on their own box model', () => {
  const ordinary = append('div');
  const vstack = append('yk-vstack');
  const container = append('yk-container');

  expect(getComputedStyle(ordinary).boxSizing).toBe('border-box');
  expect(getComputedStyle(vstack).boxSizing).toBe('content-box');
  expect(getComputedStyle(container).boxSizing).toBe('content-box');
});

test('keeps every layout primitive out of the global border-box rule', () => {
  const match = normalizeCss.match(/:where\(\s*\*:not\(([\s\S]*?)\)\s*\)/);
  if (!match) {
    throw new Error('normalize.css has no box-sizing exclusion list');
  }
  const excluded = match[1]
    .split(',')
    .map((tag) => tag.trim())
    .sort();
  expect(excluded).toEqual(layoutTags);
});

test('keeps the block-margin list in sync with the runtime coverage', () => {
  const declaration = normalizeCss.indexOf('margin-block: 0;');
  const blockStart = normalizeCss.lastIndexOf(':where(', declaration);
  const blockEnd = normalizeCss.indexOf(')', blockStart);
  if (declaration < 0 || blockStart < 0 || blockEnd < 0) {
    throw new Error('normalize.css has no block-margin list');
  }
  const normalized = normalizeCss
    .slice(blockStart + ':where('.length, blockEnd)
    .split(',')
    .map((tag) => tag.trim())
    .sort();
  expect(normalized).toEqual(BLOCK_ELEMENTS);
});

test('lets unlayered application CSS override the base styles', () => {
  const style = document.createElement('style');
  style.dataset.testOverride = '';
  style.textContent = '* { margin-block: 4rem; }';
  document.head.append(style);
  const paragraph = append('p', 'Body');

  const expected = `${rootFontSize() * 4}px`;
  expect(blockMargins(paragraph)).toEqual([expected, expected]);
});

test('lets a consumer layer override after declaring the library layer first', () => {
  // Adopted stylesheets sort after document stylesheets, so a layer declared
  // here would come before yk-elements without this explicit order statement.
  const style = document.createElement('style');
  style.dataset.testOverride = '';
  style.textContent =
    '@layer yk-elements; @layer consumer { p { margin-block: 4rem; } }';
  document.head.append(style);
  const paragraph = append('p', 'Body');

  const expected = `${rootFontSize() * 4}px`;
  expect(blockMargins(paragraph)).toEqual([expected, expected]);
});

test('lets a consumer layer restyle tokens after declaring the library layer first', () => {
  const style = document.createElement('style');
  style.dataset.testOverride = '';
  style.textContent =
    '@layer yk-elements; @layer consumer { :root { --yk-font-family: serif; } }';
  document.head.append(style);

  expect(getComputedStyle(document.body).fontFamily).toContain('serif');
});
