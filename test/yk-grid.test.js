// @ts-check
import { afterEach, expect, test } from 'vitest';
import '../src/layout/yk-grid.js';

afterEach(() => {
  document.body.replaceChildren();
  document.documentElement.style.removeProperty('--yk-space-md');
});

test('self-registers in the custom element registry', () => {
  expect(customElements.get('yk-grid')).toBeDefined();
});

test('adopts its stylesheet as a constructable CSSStyleSheet', () => {
  const host = document.createElement('yk-grid');
  document.body.appendChild(host);

  expect(host.shadowRoot.adoptedStyleSheets[0]).toBeInstanceOf(CSSStyleSheet);
});

test('lays out slotted children as a grid using design tokens', async () => {
  document.documentElement.style.setProperty('--yk-space-md', '3px');
  const host = document.createElement('yk-grid');
  const first = document.createElement('p');
  host.append(first);
  document.body.appendChild(host);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const style = getComputedStyle(host);
  expect(style.display).toBe('grid');
  expect(style.gap).toBe('3px');
  expect(first.assignedSlot).not.toBeNull();
});

test('creates multiple equal-width columns when the container is wide', async () => {
  const host = document.createElement('yk-grid');
  host.style.setProperty('--yk-grid-min', '2rem');
  const first = document.createElement('p');
  const second = document.createElement('p');
  host.append(first, second);
  host.style.width = '600px';
  document.body.appendChild(host);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const firstRect = first.getBoundingClientRect();
  const secondRect = second.getBoundingClientRect();
  expect(firstRect.top).toBe(secondRect.top);
  expect(secondRect.left).toBeGreaterThan(firstRect.right);
});

test('prefers the component-level gap token over the global one', () => {
  document.documentElement.style.setProperty('--yk-space-md', '3px');
  const host = document.createElement('yk-grid');
  host.style.setProperty('--yk-grid-gap', '5px');
  document.body.appendChild(host);

  expect(getComputedStyle(host).gap).toBe('5px');
});
