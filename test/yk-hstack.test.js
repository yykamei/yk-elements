// @ts-check
import { afterEach, expect, test } from 'vitest';
import '../src/layout/yk-hstack.js';

afterEach(() => {
  document.body.replaceChildren();
  document.documentElement.style.removeProperty('--yk-space-md');
});

test('self-registers in the custom element registry', () => {
  expect(customElements.get('yk-hstack')).toBeDefined();
});

test('adopts its stylesheet as a constructable CSSStyleSheet', () => {
  const host = document.createElement('yk-hstack');
  document.body.appendChild(host);

  expect(host.shadowRoot.adoptedStyleSheets[0]).toBeInstanceOf(CSSStyleSheet);
});

test('lays out slotted children as a horizontal flex row using design tokens', async () => {
  document.documentElement.style.setProperty('--yk-space-md', '3px');
  const host = document.createElement('yk-hstack');
  const first = document.createElement('p');
  const second = document.createElement('p');
  host.append(first, second);
  document.body.appendChild(host);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const style = getComputedStyle(host);
  expect(style.display).toBe('flex');
  expect(style.flexDirection).toBe('row');
  expect(style.gap).toBe('3px');
  expect(first.assignedSlot).not.toBeNull();
});

test('prefers the component-level gap token over the global one', () => {
  document.documentElement.style.setProperty('--yk-space-md', '3px');
  const host = document.createElement('yk-hstack');
  host.style.setProperty('--yk-hstack-gap', '5px');
  document.body.appendChild(host);

  expect(getComputedStyle(host).gap).toBe('5px');
});

test('aligns children via the component-level alignment token', () => {
  const host = document.createElement('yk-hstack');
  host.style.setProperty('--yk-hstack-align', 'center');
  document.body.appendChild(host);

  expect(getComputedStyle(host).alignItems).toBe('center');
});

test('keeps the default cross-axis stretch when no alignment token is set', () => {
  const host = document.createElement('yk-hstack');
  document.body.appendChild(host);

  expect(getComputedStyle(host).alignItems).toBe('stretch');
});

test('reuses a declarative shadow root instead of replacing it', () => {
  const container = document.createElement('div');
  container.setHTMLUnsafe(
    '<yk-hstack><template shadowrootmode="open"><style>:host{--dsd:1px}</style><slot></slot></template><p>hi</p></yk-hstack>',
  );
  document.body.appendChild(container);
  const host = container.querySelector('yk-hstack');

  expect(host.shadowRoot.querySelector('style')).not.toBeNull();
  expect(host.shadowRoot.querySelectorAll('slot').length).toBe(1);
  expect(host.shadowRoot.adoptedStyleSheets.length).toBe(1);
  expect(host.querySelector('p').assignedSlot).not.toBeNull();
});
