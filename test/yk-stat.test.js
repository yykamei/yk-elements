// @ts-check
import { afterEach, expect, test } from 'vitest';
import '../src/components/yk-stat.js';

afterEach(() => {
  document.body.replaceChildren();
  document.documentElement.style.removeProperty('--yk-color-text-muted');
  document.documentElement.style.removeProperty('--yk-color-text');
});

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

function makeStat() {
  const host = document.createElement('yk-stat');
  host.innerHTML =
    '<span slot="label">Learning targets</span><span slot="value">128</span>';
  document.body.appendChild(host);
  return host;
}

const listOf = (host) => host.shadowRoot.querySelector('dl[part="stat"]');
const labelOf = (host) => host.shadowRoot.querySelector('dt[part="label"]');
const valueElement = (host) =>
  host.shadowRoot.querySelector('dd[part="value"]');

test('self-registers in the custom element registry', () => {
  expect(customElements.get('yk-stat')).toBeDefined();
});

test('adopts its stylesheet as a constructable CSSStyleSheet', () => {
  const host = makeStat();

  expect(host.shadowRoot.adoptedStyleSheets.length).toBe(1);
  expect(host.shadowRoot.adoptedStyleSheets[0]).toBeInstanceOf(CSSStyleSheet);
});

test('renders a description list with label and value parts', () => {
  const host = makeStat();

  expect(listOf(host)).not.toBeNull();
  expect(labelOf(host)).not.toBeNull();
  expect(valueElement(host)).not.toBeNull();
});

test('assigns the light DOM label and value to their named slots', () => {
  const host = makeStat();
  const label = host.querySelector('[slot="label"]');
  const value = host.querySelector('[slot="value"]');

  expect(label?.assignedSlot).toBe(
    labelOf(host)?.querySelector('slot[name="label"]'),
  );
  expect(value?.assignedSlot).toBe(
    valueElement(host)?.querySelector('slot[name="value"]'),
  );
});

test('styles the label and value through the component tokens', async () => {
  const host = makeStat();
  host.style.setProperty('--yk-stat-gap', '7px');
  host.style.setProperty('--yk-stat-label-font-size', '10px');
  host.style.setProperty('--yk-stat-label-color', 'rgb(1, 2, 3)');
  host.style.setProperty('--yk-stat-value-font-size', '30px');
  host.style.setProperty('--yk-stat-value-font-weight', '400');
  host.style.setProperty('--yk-stat-value-color', 'rgb(4, 5, 6)');
  await frame();

  expect(getComputedStyle(listOf(host)).gap).toBe('7px');
  expect(getComputedStyle(labelOf(host)).fontSize).toBe('10px');
  expect(getComputedStyle(labelOf(host)).color).toBe('rgb(1, 2, 3)');
  expect(getComputedStyle(valueElement(host)).fontSize).toBe('30px');
  expect(getComputedStyle(valueElement(host)).fontWeight).toBe('400');
  expect(getComputedStyle(valueElement(host)).color).toBe('rgb(4, 5, 6)');
});

test('uses muted and regular text tokens as the default colors', async () => {
  document.documentElement.style.setProperty(
    '--yk-color-text-muted',
    'rgb(9, 8, 7)',
  );
  document.documentElement.style.setProperty('--yk-color-text', 'rgb(6, 5, 4)');
  const host = makeStat();
  await frame();

  expect(getComputedStyle(labelOf(host)).color).toBe('rgb(9, 8, 7)');
  expect(getComputedStyle(valueElement(host)).color).toBe('rgb(6, 5, 4)');
});

test('reuses a declarative shadow root and adopts the stylesheet', () => {
  const container = document.createElement('div');
  container.setHTMLUnsafe(
    '<yk-stat><template shadowrootmode="open"><style>:host{--dsd:1px}</style><dl part="stat"><dt part="label"><slot name="label"></slot></dt><dd part="value"><slot name="value"></slot></dd></dl></template><span slot="label">Label</span><span slot="value">42</span></yk-stat>',
  );
  document.body.appendChild(container);
  const host = container.querySelector('yk-stat');

  expect(host?.shadowRoot?.querySelector('style')).not.toBeNull();
  expect(host?.shadowRoot?.querySelectorAll('dl')).toHaveLength(1);
  expect(host?.shadowRoot?.adoptedStyleSheets.length).toBe(1);
  expect(host?.querySelector('[slot="value"]')?.assignedSlot).not.toBeNull();
});
