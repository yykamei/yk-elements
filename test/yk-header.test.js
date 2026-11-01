// @ts-check
import { afterEach, expect, test } from 'vitest';
import '../src/components/yk-button.js';
import '../src/components/yk-header.js';
import '../src/components/yk-link.js';
import '../src/components/yk-theme-switcher.js';

afterEach(() => {
  document.body.replaceChildren();
  localStorage.removeItem('yk-theme');
});

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

function makeHeader(innerHTML = '') {
  const host = document.createElement('yk-header');
  host.innerHTML = innerHTML;
  document.body.appendChild(host);
  return host;
}

const partOf = (host, part) =>
  host.shadowRoot.querySelector(`[part="${part}"]`);

const DSD_SHADOW =
  '<template shadowrootmode="open"><style>:host{--dsd:1px}</style><header part="header"><div part="bar"><div part="brand"><a part="brand-link"><slot name="brand"></slot></a></div><nav part="nav" aria-label="Main navigation"><slot></slot></nav><div part="actions"><slot name="actions"></slot></div></div></header></template>';

function makeDSDHeader(content = '') {
  const container = document.createElement('div');
  container.setHTMLUnsafe(`<yk-header>${DSD_SHADOW}${content}</yk-header>`);
  document.body.appendChild(container);
  return container.querySelector('yk-header');
}

const NAV_LINKS = `
  <a href="#">Docs</a>
  <a href="#">Pricing</a>
`;

test('self-registers in the custom element registry', () => {
  expect(customElements.get('yk-header')).toBeDefined();
});

test('adopts the component stylesheet', () => {
  const host = makeHeader();

  expect(host.shadowRoot.adoptedStyleSheets.length).toBe(1);
  expect(host.shadowRoot.adoptedStyleSheets[0]).toBeInstanceOf(CSSStyleSheet);
});

test('renders the header landmark with three slot regions', () => {
  const host = makeHeader();

  expect(host.shadowRoot.querySelector('header[part="header"]')).not.toBeNull();
  expect(partOf(host, 'bar')).not.toBeNull();
  expect(partOf(host, 'brand')).not.toBeNull();
  expect(partOf(host, 'brand-link')).not.toBeNull();
  expect(partOf(host, 'nav')).not.toBeNull();
  expect(partOf(host, 'actions')).not.toBeNull();
  expect(host.shadowRoot.querySelectorAll('slot').length).toBe(3);
});

test('assigns the brand, primary links, and actions', () => {
  const host = makeHeader(`
    <img slot="brand" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="Brand" />
    ${NAV_LINKS}
    <yk-theme-switcher slot="actions"></yk-theme-switcher>
  `);

  const assigned = (name) =>
    host.shadowRoot.querySelector(`slot[name="${name}"]`).assignedElements();
  expect(assigned('brand')).toEqual([host.querySelector('img[slot="brand"]')]);
  expect(assigned('actions')).toEqual([
    host.querySelector('yk-theme-switcher'),
  ]);
  expect(
    host.shadowRoot.querySelector('slot:not([name])').assignedElements(),
  ).toEqual([...host.querySelectorAll('a:not([slot])')]);
});

test('keeps existing components in the actions slot intact', async () => {
  const host = makeHeader(`
    <yk-button slot="actions">Save</yk-button>
    <yk-link slot="actions" href="/login">Sign in</yk-link>
    <yk-theme-switcher slot="actions"></yk-theme-switcher>
  `);
  await frame();

  const button = host.querySelector('yk-button');
  const link = host.querySelector('yk-link');
  expect(getComputedStyle(button).display).not.toBe('none');
  expect(getComputedStyle(link).display).not.toBe('none');
  expect(button.getBoundingClientRect().height).toBeGreaterThan(0);
  expect(link.getBoundingClientRect().height).toBeGreaterThan(0);
  expect(host.hasAttribute('empty-actions')).toBe(false);
});

test('links the brand through brand-href', () => {
  const host = makeHeader(
    '<img slot="brand" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="Brand" />',
  );
  const link = partOf(host, 'brand-link');
  expect(link.hasAttribute('href')).toBe(false);

  host.setAttribute('brand-href', '/home');
  expect(link.getAttribute('href')).toBe('/home');

  host.removeAttribute('brand-href');
  expect(link.hasAttribute('href')).toBe(false);
});

test('drops an unsafe, disguised, or blank brand-href', () => {
  const host = makeHeader(
    '<img slot="brand" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="Brand" />',
  );
  const link = partOf(host, 'brand-link');
  const unsafe = [
    'javascript:alert(1)',
    ' JaVaScRiPt:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    '   ',
  ];

  for (const href of unsafe) {
    host.setAttribute('brand-href', href);
    expect(link.hasAttribute('href'), href).toBe(false);
  }

  host.setAttribute('brand-href', 'myapp://open');
  expect(link.getAttribute('href')).toBe('myapp://open');
});

test('collapses empty regions once slot assignment settles', async () => {
  const host = makeHeader();
  await frame();

  expect(host.hasAttribute('empty-brand')).toBe(true);
  expect(host.hasAttribute('empty-nav')).toBe(true);
  expect(host.hasAttribute('empty-actions')).toBe(true);
  expect(getComputedStyle(partOf(host, 'brand')).display).toBe('none');
  expect(getComputedStyle(partOf(host, 'nav')).display).toBe('none');
  expect(getComputedStyle(partOf(host, 'actions')).display).toBe('none');
  expect(getComputedStyle(host).display).toBe('none');
});

test('keeps bare text content in the navigation region', async () => {
  const host = makeHeader('Plain header text');
  await frame();

  expect(host.hasAttribute('empty-nav')).toBe(false);
  expect(getComputedStyle(host).display).toBe('block');
});

test('shows a region once it receives content and collapses it again', async () => {
  const host = makeHeader();
  await frame();
  expect(host.hasAttribute('empty-nav')).toBe(true);

  host.innerHTML =
    '<img slot="brand" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="" /><a href="#">Docs</a><yk-button slot="actions">Save</yk-button>';
  await frame();

  expect(host.hasAttribute('empty-brand')).toBe(false);
  expect(host.hasAttribute('empty-nav')).toBe(false);
  expect(host.hasAttribute('empty-actions')).toBe(false);
  expect(getComputedStyle(partOf(host, 'nav')).display).not.toBe('none');

  host.querySelector('a:not([slot])').remove();
  host.querySelector('img[slot="brand"]').remove();
  host.querySelector('yk-button').remove();
  await frame();

  expect(host.hasAttribute('empty-brand')).toBe(true);
  expect(host.hasAttribute('empty-nav')).toBe(true);
  expect(host.hasAttribute('empty-actions')).toBe(true);
});

test('names the navigation landmark from nav-label', () => {
  const host = makeHeader(NAV_LINKS);
  const nav = partOf(host, 'nav');

  expect(nav.getAttribute('aria-label')).toBe('Main navigation');

  host.setAttribute('nav-label', 'Primary');
  expect(nav.getAttribute('aria-label')).toBe('Primary');

  host.setAttribute('nav-label', '   ');
  expect(nav.getAttribute('aria-label')).toBe('Main navigation');
});

test('sticks to the top when the sticky attribute is present', async () => {
  const host = makeHeader();
  await frame();

  expect(getComputedStyle(host).position).toBe('static');

  host.setAttribute('sticky', '');
  await frame();

  expect(getComputedStyle(host).position).toBe('sticky');
  expect(getComputedStyle(host).top).toBe('0px');
  expect(getComputedStyle(host).zIndex).toBe('10');
});

test('sizes the slotted logo through its token', async () => {
  const host = makeHeader(
    '<img slot="brand" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="Brand" />',
  );
  await frame();

  const image = host.querySelector('img');
  expect(getComputedStyle(image).maxHeight).toBe('32px');
  expect(getComputedStyle(image).display).toBe('block');

  host.style.setProperty('--yk-header-brand-height', '3rem');
  await frame();
  expect(getComputedStyle(image).maxHeight).toBe('48px');
});

test('restyles the surface and spacing through component tokens', async () => {
  const host = makeHeader(NAV_LINKS);
  host.style.setProperty('--yk-header-bg', 'rgb(9, 8, 7)');
  host.style.setProperty('--yk-header-color', 'rgb(6, 5, 4)');
  host.style.setProperty('--yk-header-border-color', 'rgb(3, 2, 1)');
  host.style.setProperty('--yk-header-max', '480px');
  host.style.setProperty('--yk-header-padding-block', '21px');
  host.style.setProperty('--yk-header-padding-inline', '13px');
  host.style.setProperty('--yk-header-gap', '17px');
  host.style.setProperty('--yk-header-link-color', 'rgb(1, 2, 3)');
  host.style.setProperty('--yk-header-link-radius', '9px');
  await frame();

  const hostStyle = getComputedStyle(host);
  const barStyle = getComputedStyle(partOf(host, 'bar'));
  expect(hostStyle.backgroundColor).toBe('rgb(9, 8, 7)');
  expect(hostStyle.color).toBe('rgb(6, 5, 4)');
  expect(hostStyle.borderBottomColor).toBe('rgb(3, 2, 1)');
  expect(barStyle.maxWidth).toBe('480px');
  expect(barStyle.paddingTop).toBe('21px');
  expect(barStyle.paddingLeft).toBe('13px');
  expect(barStyle.columnGap).toBe('17px');
  const linkStyle = getComputedStyle(host.querySelector('a'));
  expect(linkStyle.color).toBe('rgb(1, 2, 3)');
  expect(linkStyle.borderRadius).toBe('9px');
});

test('reuses a declarative shadow root', async () => {
  const host = makeDSDHeader(
    '<img slot="brand" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="" /><a href="#">Docs</a><yk-button slot="actions">Sign in</yk-button>',
  );
  await frame();

  expect(host.shadowRoot.querySelector('style')).not.toBeNull();
  expect(host.shadowRoot.adoptedStyleSheets.length).toBe(1);
  expect(host.hasAttribute('empty-brand')).toBe(false);
  expect(host.hasAttribute('empty-nav')).toBe(false);
  expect(host.hasAttribute('empty-actions')).toBe(false);
  expect(getComputedStyle(partOf(host, 'nav')).display).not.toBe('none');
});
