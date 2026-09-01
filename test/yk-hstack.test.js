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
