// @ts-check
import { afterEach, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../src/components/yk-pagination.js';

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const TOKENS = [
  '--yk-color-primary',
  '--yk-color-surface',
  '--yk-color-text',
  '--yk-color-border',
  '--yk-color-on-tone',
];

afterEach(() => {
  document.body.replaceChildren();
  for (const name of TOKENS) {
    document.documentElement.style.removeProperty(name);
  }
});

function makePagination() {
  const host = document.createElement('yk-pagination');
  host.innerHTML = `
    <a href="?page=1">Previous</a>
    <a href="?page=1">1</a>
    <span aria-current="page">2</span>
    <a href="?page=3">3</a>
    <a href="?page=3">Next</a>
  `;
  document.body.appendChild(host);
  return host;
}

const navOf = (host) => host.shadowRoot.querySelector('nav[part="nav"]');

test('self-registers in the custom element registry', () => {
  expect(customElements.get('yk-pagination')).toBeDefined();
});

test('adopts its stylesheet as a constructable CSSStyleSheet', () => {
  const host = makePagination();

  expect(host.shadowRoot.adoptedStyleSheets.length).toBe(1);
  expect(host.shadowRoot.adoptedStyleSheets[0]).toBeInstanceOf(CSSStyleSheet);
});

test('renders a navigation landmark with a slot for the page links', () => {
  const host = makePagination();
  const nav = navOf(host);
  const slot = nav?.querySelector('slot');

  expect(nav).not.toBeNull();
  expect(slot).not.toBeNull();
  expect(host.querySelector('a')?.assignedSlot).toBe(slot);
  expect(host.querySelector('[aria-current="page"]')?.assignedSlot).toBe(slot);
});

test('names the navigation landmark with a default label', () => {
  const host = makePagination();

  expect(navOf(host)?.getAttribute('aria-label')).toBe('Pagination');
});

test('mirrors the host aria-label onto the navigation landmark', () => {
  const host = makePagination();
  const nav = navOf(host);

  host.setAttribute('aria-label', 'ページネーション');
  expect(nav?.getAttribute('aria-label')).toBe('ページネーション');

  host.setAttribute('aria-label', '  ');
  expect(nav?.getAttribute('aria-label')).toBe('Pagination');

  host.removeAttribute('aria-label');
  expect(nav?.getAttribute('aria-label')).toBe('Pagination');
});

test('lays the page links in a centered wrapping row with a gap', async () => {
  const host = makePagination();
  host.style.setProperty('--yk-pagination-gap', '7px');
  await frame();

  const style = getComputedStyle(navOf(host));
  expect(style.display).toBe('flex');
  expect(style.flexWrap).toBe('wrap');
  expect(style.justifyContent).toBe('center');
  expect(style.gap).toBe('7px');
});

test('styles slotted links through the pagination tokens', async () => {
  const host = makePagination();
  host.style.setProperty('--yk-pagination-item-min-size', '44px');
  host.style.setProperty('--yk-pagination-bg', 'rgb(1, 2, 3)');
  host.style.setProperty('--yk-pagination-color', 'rgb(4, 5, 6)');
  host.style.setProperty('--yk-pagination-border-color', 'rgb(7, 8, 9)');
  host.style.setProperty('--yk-pagination-radius', '5px');
  await frame();

  const style = getComputedStyle(host.querySelector('a'));
  expect(style.backgroundColor).toBe('rgb(1, 2, 3)');
  expect(style.color).toBe('rgb(4, 5, 6)');
  expect(style.borderColor).toBe('rgb(7, 8, 9)');
  expect(style.borderRadius).toBe('5px');
  expect(style.minInlineSize).toBe('44px');
  expect(style.textDecorationLine).toBe('none');
});

test('highlights the current page with the current-page tokens', async () => {
  const host = makePagination();
  host.style.setProperty('--yk-pagination-current-bg', 'rgb(1, 2, 3)');
  host.style.setProperty('--yk-pagination-current-color', 'rgb(4, 5, 6)');
  await frame();

  const style = getComputedStyle(host.querySelector('[aria-current="page"]'));
  expect(style.backgroundColor).toBe('rgb(1, 2, 3)');
  expect(style.color).toBe('rgb(4, 5, 6)');
});

test('keeps the current-page face when a current-page anchor is hovered', async () => {
  document.documentElement.style.setProperty(
    '--yk-color-primary',
    'rgb(1, 2, 3)',
  );
  document.documentElement.style.setProperty(
    '--yk-color-on-tone',
    'rgb(4, 5, 6)',
  );
  const host = makePagination();
  host.innerHTML = '<a href="?page=2" aria-current="page">2</a>';
  await frame();
  const link = host.querySelector('a');

  await userEvent.hover(link);
  const style = getComputedStyle(link);
  expect(style.backgroundColor).toBe('rgb(1, 2, 3)');
  expect(style.color).toBe('rgb(4, 5, 6)');
  await userEvent.unhover(link);
});

test('tints an ordinary page link on hover', async () => {
  const host = makePagination();
  host.innerHTML = '<a href="?page=1">1</a>';
  await frame();
  const link = host.querySelector('a');
  const before = getComputedStyle(link).backgroundColor;

  await userEvent.hover(link);
  expect(getComputedStyle(link).backgroundColor).not.toBe(before);
  await userEvent.unhover(link);
});

test('dims a disabled control and keeps a disabled anchor inert on hover', async () => {
  const host = makePagination();
  host.style.setProperty('--yk-pagination-disabled-opacity', '0.4');
  host.innerHTML =
    '<span aria-disabled="true" aria-hidden="true">Previous</span><a role="link" aria-disabled="true">Next</a>';
  await frame();

  const spanStyle = getComputedStyle(host.querySelector('span'));
  expect(spanStyle.opacity).toBe('0.4');
  expect(spanStyle.borderTopWidth).toBe('1px');

  const link = host.querySelector('a');
  const before = getComputedStyle(link).backgroundColor;
  await userEvent.hover(link);
  const style = getComputedStyle(link);
  expect(style.backgroundColor).toBe(before);
  expect(style.cursor).toBe('default');
  await userEvent.unhover(link);
});

test('collapses when hidden', async () => {
  const host = makePagination();
  host.setAttribute('hidden', '');
  await frame();

  expect(getComputedStyle(host).display).toBe('none');
});

test('leaves a plain span without the link face for an ellipsis', async () => {
  const host = makePagination();
  host.innerHTML = '<a href="?page=1">1</a><span aria-hidden="true">…</span>';
  await frame();

  const style = getComputedStyle(host.querySelector('span'));
  expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
  expect(style.borderTopWidth).toBe('0px');
});

test('reuses a declarative shadow root instead of replacing it', () => {
  const container = document.createElement('div');
  container.setHTMLUnsafe(
    '<yk-pagination aria-label="Pages"><template shadowrootmode="open"><style>:host{--dsd:1px}</style><nav part="nav"><slot></slot></nav></template><a href="?page=1">1</a><span aria-current="page">2</span></yk-pagination>',
  );
  document.body.appendChild(container);
  const host = container.querySelector('yk-pagination');
  const nav = navOf(host);

  expect(host.shadowRoot.querySelector('style')).not.toBeNull();
  expect(nav).not.toBeNull();
  expect(host.shadowRoot.adoptedStyleSheets.length).toBe(1);
  expect(host.querySelector('a')?.assignedSlot).not.toBeNull();
  expect(nav?.getAttribute('aria-label')).toBe('Pages');
});
