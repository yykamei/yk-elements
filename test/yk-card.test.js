// @ts-check
import { afterEach, expect, test } from 'vitest';
import '../src/components/yk-card.js';

afterEach(() => {
  document.body.replaceChildren();
});

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

function makeCard(innerHTML = '') {
  const host = document.createElement('yk-card');
  host.innerHTML = innerHTML;
  document.body.appendChild(host);
  return host;
}

const regionOf = (host, part) =>
  host.shadowRoot.querySelector(`[part="${part}"]`);

test('self-registers in the custom element registry', () => {
  expect(customElements.get('yk-card')).toBeDefined();
});

test('adopts its stylesheet as a constructable CSSStyleSheet', () => {
  const host = makeCard();

  expect(host.shadowRoot.adoptedStyleSheets.length).toBe(1);
  expect(host.shadowRoot.adoptedStyleSheets[0]).toBeInstanceOf(CSSStyleSheet);
});

test('renders header, body, and footer regions', () => {
  const host = makeCard('<p>Body</p>');

  expect(regionOf(host, 'header')).not.toBeNull();
  expect(regionOf(host, 'body')).not.toBeNull();
  expect(regionOf(host, 'footer')).not.toBeNull();
});

test('uses neutral elements so it adds no page-level landmarks', () => {
  const host = makeCard(
    '<h2 slot="header">Title</h2><p>Body</p><span slot="footer">Footer</span>',
  );

  // A shadow <header>/<footer> would surface as a banner/contentinfo landmark
  // on the page, which must stay unique.
  expect(host.shadowRoot.querySelector('header, footer')).toBeNull();
});

test('renders the default slot content in the body', () => {
  const host = makeCard('<p>Body content</p>');

  const slot = regionOf(host, 'body').querySelector('slot:not([name])');
  expect(slot.assignedElements()).toEqual([host.querySelector('p')]);
});

test('hides the header and footer regions while they are empty', () => {
  const host = makeCard('<p>Body</p>');

  expect(getComputedStyle(regionOf(host, 'header')).display).toBe('none');
  expect(getComputedStyle(regionOf(host, 'footer')).display).toBe('none');
});

test('shows the header and footer regions once content is assigned', async () => {
  const host = makeCard(`
    <h2 slot="header">Title</h2>
    <p>Body</p>
    <span slot="footer">Footer</span>
  `);
  await frame();

  expect(host.hasAttribute('has-header')).toBe(true);
  expect(host.hasAttribute('has-footer')).toBe(true);
  expect(getComputedStyle(regionOf(host, 'header')).display).not.toBe('none');
  expect(getComputedStyle(regionOf(host, 'footer')).display).not.toBe('none');
});

test('leaves the header and footer regions hidden until content arrives later', async () => {
  const host = makeCard('<p>Body</p>');
  await frame();
  expect(host.hasAttribute('has-header')).toBe(false);

  const heading = document.createElement('h2');
  heading.setAttribute('slot', 'header');
  heading.textContent = 'Title';
  host.append(heading);
  await frame();

  expect(host.hasAttribute('has-header')).toBe(true);
  expect(getComputedStyle(regionOf(host, 'header')).display).not.toBe('none');
});

test('hides a region again when its content is removed', async () => {
  const host = makeCard('<h2 slot="header">Title</h2><p>Body</p>');
  await frame();
  expect(host.hasAttribute('has-header')).toBe(true);

  host.querySelector('h2').remove();
  await frame();

  expect(host.hasAttribute('has-header')).toBe(false);
  expect(getComputedStyle(regionOf(host, 'header')).display).toBe('none');
});

test('restyles the surface through the component tokens', async () => {
  const host = makeCard('<p>Body</p>');
  host.style.setProperty('--yk-card-bg', 'rgb(9, 8, 7)');
  host.style.setProperty('--yk-card-color', 'rgb(6, 5, 4)');
  host.style.setProperty('--yk-card-border-color', 'rgb(3, 2, 1)');
  host.style.setProperty('--yk-card-radius', '2px');
  host.style.setProperty('--yk-card-padding', '20px');
  await frame();

  const hostStyle = getComputedStyle(host);
  const bodyStyle = getComputedStyle(regionOf(host, 'body'));
  expect(hostStyle.backgroundColor).toBe('rgb(9, 8, 7)');
  expect(hostStyle.color).toBe('rgb(6, 5, 4)');
  expect(hostStyle.borderTopColor).toBe('rgb(3, 2, 1)');
  expect(hostStyle.borderTopLeftRadius).toBe('2px');
  expect(bodyStyle.paddingTop).toBe('20px');
});

test('applies an elevation through the shadow token', async () => {
  const host = makeCard('<p>Body</p>');
  host.style.setProperty('--yk-card-shadow', '0 0 0 4px rgb(1, 2, 3)');
  await frame();

  expect(getComputedStyle(host).boxShadow).toContain('rgb(1, 2, 3)');
});
