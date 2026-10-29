// @ts-check
import { afterEach, expect, test } from 'vitest';
import '../src/components/yk-footer-links.js';

afterEach(() => {
  document.body.replaceChildren();
});

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

function makeGroup({ heading, innerHTML = '' } = {}) {
  const host = document.createElement('yk-footer-links');
  if (heading !== undefined) host.setAttribute('heading', heading);
  host.innerHTML = innerHTML;
  document.body.appendChild(host);
  return host;
}

const partOf = (host, part) =>
  host.shadowRoot.querySelector(`[part="${part}"]`);

test('self-registers in the custom element registry', () => {
  expect(customElements.get('yk-footer-links')).toBeDefined();
});

test('adopts the shared and component stylesheets', () => {
  const host = makeGroup({ heading: 'Resources' });

  expect(host.shadowRoot.adoptedStyleSheets.length).toBe(2);
  for (const sheet of host.shadowRoot.adoptedStyleSheets) {
    expect(sheet).toBeInstanceOf(CSSStyleSheet);
  }
});

test('renders a nav labelled by its heading and a slot for the links', () => {
  const host = makeGroup({ heading: 'Resources' });

  const nav = host.shadowRoot.querySelector('nav');
  const heading = partOf(host, 'heading');
  expect(nav).not.toBeNull();
  expect(nav.getAttribute('aria-labelledby')).toBe(heading.id);
  expect(heading.localName).toBe('h2');
  expect(heading.textContent).toBe('Resources');
  expect(host.shadowRoot.querySelector('slot').assignedElements()).toEqual([]);
});

test('places direct anchors in the link list', () => {
  const host = makeGroup({
    heading: 'Resources',
    innerHTML: '<a href="/docs">Docs</a><a href="/support">Support</a>',
  });

  const slot = host.shadowRoot.querySelector('slot');
  expect(slot.assignedElements()).toEqual([
    host.querySelector('a[href="/docs"]'),
    host.querySelector('a[href="/support"]'),
  ]);
});

test('hides the heading and drops the label when the heading is absent', () => {
  const host = makeGroup();

  const heading = partOf(host, 'heading');
  expect(heading.hidden).toBe(true);
  expect(
    host.shadowRoot.querySelector('nav').hasAttribute('aria-labelledby'),
  ).toBe(false);
});

test('updates the heading and its label when the attribute changes', async () => {
  const host = makeGroup({ heading: 'Resources' });
  const heading = partOf(host, 'heading');

  host.setAttribute('heading', 'Project');
  await frame();

  expect(heading.textContent).toBe('Project');
  expect(
    host.shadowRoot.querySelector('nav').getAttribute('aria-labelledby'),
  ).toBe(heading.id);

  host.removeAttribute('heading');
  await frame();

  expect(heading.textContent).toBe('');
  expect(heading.hidden).toBe(true);
  expect(
    host.shadowRoot.querySelector('nav').hasAttribute('aria-labelledby'),
  ).toBe(false);
});

test('renders the heading as plain text', () => {
  const host = makeGroup({ heading: '<img src=x onerror=alert(1)>' });
  const heading = partOf(host, 'heading');

  expect(heading.querySelector('img')).toBeNull();
  expect(heading.childElementCount).toBe(0);
  expect(heading.textContent).toBe('<img src=x onerror=alert(1)>');
});

test('treats a whitespace-only heading as absent', () => {
  const host = makeGroup({ heading: '   ' });

  expect(partOf(host, 'heading').hidden).toBe(true);
  expect(
    host.shadowRoot.querySelector('nav').hasAttribute('aria-labelledby'),
  ).toBe(false);
});

test('styles slotted anchors through the footer link tokens', async () => {
  const host = makeGroup({
    heading: 'Resources',
    innerHTML: '<a href="/docs">Docs</a>',
  });
  host.style.setProperty('--yk-footer-link-color', 'rgb(9, 8, 7)');
  host.style.setProperty('--yk-footer-link-font-size', '17px');
  await frame();

  const linkStyle = getComputedStyle(host.querySelector('a'));
  expect(linkStyle.color).toBe('rgb(9, 8, 7)');
  expect(linkStyle.fontSize).toBe('17px');
  expect(linkStyle.textDecorationLine).toBe('none');
});

test('restyles the heading and the link list through component tokens', async () => {
  const host = makeGroup({
    heading: 'Resources',
    innerHTML: '<a href="/docs">Docs</a>',
  });
  host.style.setProperty('--yk-footer-links-heading-color', 'rgb(6, 5, 4)');
  host.style.setProperty('--yk-footer-links-heading-size', '19px');
  host.style.setProperty('--yk-footer-links-gap', '13px');
  await frame();

  const headingStyle = getComputedStyle(partOf(host, 'heading'));
  expect(headingStyle.color).toBe('rgb(6, 5, 4)');
  expect(headingStyle.fontSize).toBe('19px');
  expect(getComputedStyle(partOf(host, 'links')).rowGap).toBe('13px');
});

test('reuses a declarative shadow root and syncs the heading', async () => {
  const container = document.createElement('div');
  container.setHTMLUnsafe(
    '<yk-footer-links heading="Docs"><template shadowrootmode="open"><style>:host{--dsd:1px}</style><nav part="nav" aria-labelledby="heading"><h2 part="heading" id="heading"></h2><div part="links"><slot></slot></div></nav></template><a href="/docs">Docs</a></yk-footer-links>',
  );
  document.body.appendChild(container);
  const host = container.querySelector('yk-footer-links');
  await frame();

  expect(host.shadowRoot.querySelector('style')).not.toBeNull();
  expect(host.shadowRoot.adoptedStyleSheets.length).toBe(2);
  expect(partOf(host, 'heading').textContent).toBe('Docs');
  expect(host.shadowRoot.querySelector('slot').assignedElements()).toEqual([
    host.querySelector('a'),
  ]);
});
