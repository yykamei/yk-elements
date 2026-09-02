// @ts-check
import { afterEach, expect, test } from 'vitest';
import '../src/layout/yk-pad.js';

afterEach(() => {
  document.body.replaceChildren();
  document.documentElement.style.removeProperty('--yk-space-md');
  document.documentElement.style.removeProperty('--yk-pad-padding');
  document.documentElement.style.removeProperty('--yk-pad-padding-block');
  document.documentElement.style.removeProperty('--yk-pad-padding-inline');
});

test('self-registers in the custom element registry', () => {
  expect(customElements.get('yk-pad')).toBeDefined();
});

test('adopts its stylesheet as a constructable CSSStyleSheet', () => {
  const host = document.createElement('yk-pad');
  document.body.appendChild(host);

  expect(host.shadowRoot.adoptedStyleSheets[0]).toBeInstanceOf(CSSStyleSheet);
});

test('pads slotted children with the default global space token', async () => {
  document.documentElement.style.setProperty('--yk-space-md', '3px');
  const host = document.createElement('yk-pad');
  const child = document.createElement('p');
  host.appendChild(child);
  document.body.appendChild(host);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const style = getComputedStyle(host);
  expect(style.display).toBe('block');
  expect(style.paddingBlock).toBe('3px');
  expect(style.paddingInline).toBe('3px');
  expect(child.assignedSlot).not.toBeNull();
});

test('prefers the pad-level padding token over the global one', () => {
  document.documentElement.style.setProperty('--yk-space-md', '3px');
  const host = document.createElement('yk-pad');
  host.style.setProperty('--yk-pad-padding', '5px');
  document.body.appendChild(host);

  const style = getComputedStyle(host);
  expect(style.paddingBlock).toBe('5px');
  expect(style.paddingInline).toBe('5px');
});

test('applies per-axis tokens independently with a shared fallback', () => {
  document.documentElement.style.setProperty('--yk-space-md', '3px');
  const host = document.createElement('yk-pad');
  host.style.setProperty('--yk-pad-padding', '5px');
  host.style.setProperty('--yk-pad-padding-block', '7px');
  document.body.appendChild(host);

  const style = getComputedStyle(host);
  expect(style.paddingBlock).toBe('7px');
  expect(style.paddingInline).toBe('5px');
});
