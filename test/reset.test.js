// @ts-check
import { afterEach, expect, test } from 'vitest';
import resetCss from '../reset.css?raw';

const layoutStyles = import.meta.glob('../src/layout/*.css', {
  eager: true,
  query: '?raw',
  import: 'default',
});

// Every layout primitive whose :host block declares `gap` owns its children's
// spacing, so its direct children must appear in reset.css.
const GAP_LAYOUTS = Object.entries(layoutStyles)
  .filter(([, css]) => /:host\s*{[^}]*\bgap\s*:/s.test(css))
  .map(([path]) =>
    path
      .split('/')
      .at(-1)
      .replace(/\.css$/, ''),
  )
  .sort();

// Kept in sync with the second selector list in reset.css: the UA block
// elements whose margins compete with the gap.
const BLOCK_ELEMENTS = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'ul',
  'ol',
  'menu',
  'dl',
  'figure',
  'blockquote',
  'pre',
  'hr',
];

afterEach(() => {
  document.querySelectorAll('iframe').forEach((frame) => {
    frame.remove();
  });
});

function iframeDocument() {
  const iframe = document.createElement('iframe');
  iframe.style.cssText =
    'position: absolute; visibility: hidden; width: 800px; height: 600px;';
  document.body.append(iframe);
  return iframe.contentDocument;
}

function documentWithStyles(...styles) {
  const doc = iframeDocument();
  for (const css of styles) {
    const style = doc.createElement('style');
    style.textContent = css;
    doc.head.append(style);
  }
  return doc;
}

function documentWithReset() {
  return documentWithStyles(resetCss);
}

function blockMargins(element, doc) {
  const style = doc.defaultView.getComputedStyle(element);
  return [style.marginBlockStart, style.marginBlockEnd];
}

function isZero(value) {
  return Number.parseFloat(value) === 0;
}

function layoutTagsInReset() {
  const match = resetCss.match(/:where\((yk-[^)]*)\)/);
  if (!match) {
    throw new Error('reset.css has no layout selector');
  }
  return match[1]
    .split(',')
    .map((tag) => tag.trim())
    .sort();
}

test('covers every gap-based layout primitive', () => {
  expect(GAP_LAYOUTS.length).toBeGreaterThan(0);
  expect(layoutTagsInReset()).toEqual(GAP_LAYOUTS);
});

test('removes the body margin', () => {
  const doc = documentWithReset();
  const style = doc.defaultView.getComputedStyle(doc.body);
  expect([
    style.marginBlockStart,
    style.marginBlockEnd,
    style.marginInlineStart,
    style.marginInlineEnd,
  ]).toEqual(['0px', '0px', '0px', '0px']);
});

test('removes the block margins of direct children of every gap layout', () => {
  const doc = documentWithReset();

  for (const layoutTag of GAP_LAYOUTS) {
    const layout = doc.createElement(layoutTag);
    doc.body.append(layout);

    for (const childTag of BLOCK_ELEMENTS) {
      const child = doc.createElement(childTag);
      layout.append(child);
      const [start, end] = blockMargins(child, doc);
      expect(isZero(start) && isZero(end), `${layoutTag} > ${childTag}`).toBe(
        true,
      );
    }
  }
});

test('keeps the UA block margins inside a card', () => {
  const doc = documentWithReset();
  const layout = doc.createElement('yk-vstack');
  const card = doc.createElement('yk-card');
  const paragraph = doc.createElement('p');
  card.append(paragraph);
  layout.append(card);
  doc.body.append(layout);

  const [start, end] = blockMargins(paragraph, doc);
  expect(isZero(start) || isZero(end)).toBe(false);
});

test('keeps the UA block margins for nested content', () => {
  const doc = documentWithReset();
  const layout = doc.createElement('yk-vstack');
  const wrapper = doc.createElement('div');
  const paragraph = doc.createElement('p');
  wrapper.append(paragraph);
  layout.append(wrapper);
  doc.body.append(layout);

  const [start, end] = blockMargins(paragraph, doc);
  expect(isZero(start) || isZero(end)).toBe(false);
});

test('leaves typography, list markers, and inline spacing alone', () => {
  const doc = documentWithReset();
  const layout = doc.createElement('yk-vstack');
  const heading = doc.createElement('h1');
  const list = doc.createElement('ul');
  const figure = doc.createElement('figure');
  layout.append(heading, list, figure);
  doc.body.append(layout);

  const view = doc.defaultView;
  expect(view.getComputedStyle(heading).fontSize).not.toBe('16px');

  const listStyle = view.getComputedStyle(list);
  expect(isZero(listStyle.paddingInlineStart)).toBe(false);
  expect(listStyle.listStyleType).not.toBe('none');

  const figureStyle = view.getComputedStyle(figure);
  expect(isZero(figureStyle.marginInlineStart)).toBe(false);
  expect(isZero(figureStyle.marginInlineEnd)).toBe(false);

  expect(view.getComputedStyle(layout).boxSizing).toBe('content-box');
});

test('lets an unlayered consumer element rule override the reset', () => {
  // The consumer rule comes first so only the reset's zero specificity can
  // explain why the consumer still wins.
  const doc = documentWithStyles('p { margin-block: 2rem; }', resetCss);
  const layout = doc.createElement('yk-vstack');
  const paragraph = doc.createElement('p');
  layout.append(paragraph);
  doc.body.append(layout);

  const rootFontSize = Number.parseFloat(
    doc.defaultView.getComputedStyle(doc.documentElement).fontSize,
  );
  const expected = `${rootFontSize * 2}px`;
  expect(blockMargins(paragraph, doc)).toEqual([expected, expected]);
});
