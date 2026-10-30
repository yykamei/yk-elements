// @ts-check
import { afterEach, expect, test } from 'vitest';
import '../src/components/yk-footer.js';
import '../src/components/yk-footer-links.js';

afterEach(() => {
  document.body.replaceChildren();
});

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

function makeFooter(innerHTML = '') {
  const host = document.createElement('yk-footer');
  host.innerHTML = innerHTML;
  document.body.appendChild(host);
  return host;
}

const partOf = (host, part) =>
  host.shadowRoot.querySelector(`[part="${part}"]`);

const DSD_SHADOW =
  '<template shadowrootmode="open"><style>:host{--dsd:1px}</style><footer part="footer"><div part="inner"><div part="header"><div part="brand"><slot name="brand"></slot></div><div part="secondary"><slot name="secondary"></slot></div></div><div part="main"><slot></slot></div><div part="bottom"><div part="copyright"><slot name="copyright"></slot></div><div part="legal"><slot name="legal"></slot></div></div></div></footer></template>';

function makeDSDFooter(content = '') {
  const container = document.createElement('div');
  container.setHTMLUnsafe(`<yk-footer>${DSD_SHADOW}${content}</yk-footer>`);
  document.body.appendChild(container);
  return container.querySelector('yk-footer');
}

test('self-registers in the custom element registry', () => {
  expect(customElements.get('yk-footer')).toBeDefined();
});

test('adopts the shared and component stylesheets', () => {
  const host = makeFooter();

  expect(host.shadowRoot.adoptedStyleSheets.length).toBe(2);
  for (const sheet of host.shadowRoot.adoptedStyleSheets) {
    expect(sheet).toBeInstanceOf(CSSStyleSheet);
  }
});

test('renders a footer landmark with the five slot regions', () => {
  const host = makeFooter();

  expect(host.shadowRoot.querySelector('footer[part="footer"]')).not.toBeNull();
  expect(partOf(host, 'header')).not.toBeNull();
  expect(partOf(host, 'main')).not.toBeNull();
  expect(partOf(host, 'bottom')).not.toBeNull();
  expect(host.shadowRoot.querySelectorAll('slot').length).toBe(5);
});

test('assigns the brand, secondary, link, copyright, and legal content', () => {
  const host = makeFooter(`
    <a slot="brand" href="/">Brand</a>
    <yk-theme-switcher slot="secondary"></yk-theme-switcher>
    <yk-footer-links heading="Learn"><a href="/guide">Guide</a></yk-footer-links>
    <span slot="copyright">Copyright</span>
    <a slot="legal" href="/terms">Terms</a>
  `);

  const assigned = (name) =>
    host.shadowRoot.querySelector(`slot[name="${name}"]`).assignedElements();
  expect(assigned('brand')).toEqual([host.querySelector('a[slot="brand"]')]);
  expect(assigned('secondary')).toEqual([
    host.querySelector('yk-theme-switcher'),
  ]);
  expect(assigned('copyright')).toEqual([
    host.querySelector('span[slot="copyright"]'),
  ]);
  expect(assigned('legal')).toEqual([host.querySelector('a[slot="legal"]')]);
  expect(
    host.shadowRoot.querySelector('slot:not([name])').assignedElements(),
  ).toEqual([host.querySelector('yk-footer-links')]);
});

test('collapses the empty regions once slot assignment settles', async () => {
  const host = makeFooter();
  await frame();

  expect(host.hasAttribute('empty-header')).toBe(true);
  expect(host.hasAttribute('empty-main')).toBe(true);
  expect(host.hasAttribute('empty-bottom')).toBe(true);
  expect(getComputedStyle(partOf(host, 'header')).display).toBe('none');
  expect(getComputedStyle(partOf(host, 'main')).display).toBe('none');
  expect(getComputedStyle(partOf(host, 'bottom')).display).toBe('none');
  expect(getComputedStyle(host).display).toBe('none');
});

test('shows a region once it receives content', async () => {
  const host = makeFooter();
  await frame();
  expect(host.hasAttribute('empty-header')).toBe(true);

  host.innerHTML =
    '<a slot="brand" href="/">Brand</a><yk-footer-links heading="Learn"><a href="/guide">Guide</a></yk-footer-links><span slot="copyright">Copyright</span>';
  await frame();

  expect(host.hasAttribute('empty-header')).toBe(false);
  expect(host.hasAttribute('empty-main')).toBe(false);
  expect(host.hasAttribute('empty-bottom')).toBe(false);
  expect(getComputedStyle(partOf(host, 'header')).display).not.toBe('none');
  expect(getComputedStyle(partOf(host, 'main')).display).not.toBe('none');
  expect(getComputedStyle(partOf(host, 'bottom')).display).not.toBe('none');
  expect(getComputedStyle(host).display).toBe('block');
});

test('keeps bare text content in the main region', async () => {
  const host = makeFooter('Plain footer text');
  await frame();

  expect(host.hasAttribute('empty-main')).toBe(false);
  expect(getComputedStyle(host).display).toBe('block');
  expect(getComputedStyle(partOf(host, 'main')).display).not.toBe('none');
});

test('collapses a region again when its content is removed', async () => {
  const host = makeFooter('<a slot="brand" href="/">Brand</a>');
  await frame();
  expect(host.hasAttribute('empty-header')).toBe(false);

  host.querySelector('a[slot="brand"]').remove();
  await frame();

  expect(host.hasAttribute('empty-header')).toBe(true);
  expect(getComputedStyle(partOf(host, 'header')).display).toBe('none');
});

test('stacks link columns on narrow hosts and lays them out in a row when wide', async () => {
  const host = makeFooter(`
    <yk-footer-links heading="Learn"><a href="/guide">Guide</a></yk-footer-links>
    <yk-footer-links heading="Project"><a href="/source">Source</a></yk-footer-links>
  `);
  host.style.inlineSize = '300px';
  await frame();

  const [first, second] = host.querySelectorAll('yk-footer-links');
  expect(second.getBoundingClientRect().top).toBeGreaterThan(
    first.getBoundingClientRect().top,
  );

  host.style.inlineSize = '800px';
  await frame();

  expect(second.getBoundingClientRect().top).toBe(
    first.getBoundingClientRect().top,
  );
});

test('styles direct legal anchors through the footer link tokens', async () => {
  const host = makeFooter('<a slot="legal" href="/terms">Terms</a>');
  host.style.setProperty('--yk-footer-link-color', 'rgb(9, 8, 7)');
  await frame();

  const linkStyle = getComputedStyle(host.querySelector('a[slot="legal"]'));
  expect(linkStyle.color).toBe('rgb(9, 8, 7)');
  expect(linkStyle.fontSize).toBe('14px');
  expect(linkStyle.textDecorationLine).toBe('none');
});

test('keeps brand anchors at the footer text style', async () => {
  const host = makeFooter('<a slot="brand" href="/">Brand</a>');
  host.style.setProperty('--yk-footer-color', 'rgb(6, 5, 4)');
  host.style.setProperty('--yk-footer-link-color', 'rgb(9, 8, 7)');
  await frame();

  const brandStyle = getComputedStyle(host.querySelector('a[slot="brand"]'));
  expect(brandStyle.color).toBe('rgb(6, 5, 4)');
  expect(brandStyle.fontSize).toBe('16px');
  expect(brandStyle.lineHeight).toBe('normal');
});

test('restyles the copyright through its token', async () => {
  const host = makeFooter('<span slot="copyright">Copyright</span>');
  host.style.setProperty('--yk-footer-copyright-color', 'rgb(1, 2, 3)');
  await frame();

  expect(getComputedStyle(partOf(host, 'copyright')).color).toBe(
    'rgb(1, 2, 3)',
  );
});

test('restyles the surface and layout through component tokens', async () => {
  const host = makeFooter(
    '<yk-footer-links heading="Learn"><a href="/guide">Guide</a></yk-footer-links>',
  );
  host.style.setProperty('--yk-footer-bg', 'rgb(9, 8, 7)');
  host.style.setProperty('--yk-footer-color', 'rgb(6, 5, 4)');
  host.style.setProperty('--yk-footer-border-color', 'rgb(3, 2, 1)');
  host.style.setProperty('--yk-footer-max', '480px');
  host.style.setProperty('--yk-footer-padding-block', '21px');
  host.style.setProperty('--yk-footer-padding-inline', '13px');
  host.style.setProperty('--yk-footer-gap', '17px');
  await frame();

  const hostStyle = getComputedStyle(host);
  const innerStyle = getComputedStyle(partOf(host, 'inner'));
  expect(hostStyle.backgroundColor).toBe('rgb(9, 8, 7)');
  expect(hostStyle.color).toBe('rgb(6, 5, 4)');
  expect(hostStyle.borderTopColor).toBe('rgb(3, 2, 1)');
  expect(innerStyle.maxWidth).toBe('480px');
  expect(innerStyle.paddingTop).toBe('21px');
  expect(innerStyle.paddingLeft).toBe('13px');
  expect(innerStyle.rowGap).toBe('17px');
});

test('reuses a declarative shadow root and keeps the regions visible', async () => {
  const host = makeDSDFooter(
    '<a slot="brand" href="/">Brand</a><p>Main</p><span slot="copyright">Copyright</span><a slot="legal" href="/terms">Terms</a>',
  );
  await frame();

  expect(host.shadowRoot.querySelector('style')).not.toBeNull();
  expect(host.shadowRoot.adoptedStyleSheets.length).toBe(2);
  expect(host.hasAttribute('empty-header')).toBe(false);
  expect(host.hasAttribute('empty-main')).toBe(false);
  expect(host.hasAttribute('empty-bottom')).toBe(false);
  expect(getComputedStyle(partOf(host, 'main')).display).not.toBe('none');
});

test('collapses empty regions in a hydrated declarative root', async () => {
  const host = makeDSDFooter('<a slot="brand" href="/">Brand</a>');
  await frame();

  expect(host.hasAttribute('empty-header')).toBe(false);
  expect(host.hasAttribute('empty-main')).toBe(true);
  expect(host.hasAttribute('empty-bottom')).toBe(true);
  expect(getComputedStyle(partOf(host, 'main')).display).toBe('none');
});
