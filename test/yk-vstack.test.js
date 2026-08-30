// @ts-check
import { afterEach, expect, test } from 'vitest';
import '../src/layout/yk-vstack.js';

afterEach(() => {
  document.body.replaceChildren();
  document.documentElement.style.removeProperty('--yk-space-md');
});

test('self-registers in the custom element registry', () => {
  expect(customElements.get('yk-vstack')).toBeDefined();
});

test('adopts its stylesheet as a constructable CSSStyleSheet', () => {
  const host = document.createElement('yk-vstack');
  document.body.appendChild(host);

  expect(host.shadowRoot.adoptedStyleSheets[0]).toBeInstanceOf(CSSStyleSheet);
});

test('lays out slotted children as a vertical flex column using design tokens', async () => {
  document.documentElement.style.setProperty('--yk-space-md', '3px');
  const host = document.createElement('yk-vstack');
  const first = document.createElement('p');
  const second = document.createElement('p');
  host.append(first, second);
  document.body.appendChild(host);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const style = getComputedStyle(host);
  expect(style.display).toBe('flex');
  expect(style.flexDirection).toBe('column');
  expect(style.gap).toBe('3px');
  expect(first.assignedSlot).not.toBeNull();
});

test('prefers the component-level gap token over the global one', () => {
  document.documentElement.style.setProperty('--yk-space-md', '3px');
  const host = document.createElement('yk-vstack');
  host.style.setProperty('--yk-vstack-gap', '5px');
  document.body.appendChild(host);

  expect(getComputedStyle(host).gap).toBe('5px');
});
