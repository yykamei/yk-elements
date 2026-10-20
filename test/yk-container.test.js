// @ts-check
import { afterEach, expect, test } from 'vitest';
import '../src/layout/yk-container.js';

afterEach(() => {
  document.body.replaceChildren();
  document.documentElement.style.removeProperty('--yk-space-md');
  document.documentElement.style.removeProperty('--yk-container-max');
  document.documentElement.style.removeProperty('--yk-container-padding');
});

test('self-registers in the custom element registry', () => {
  expect(customElements.get('yk-container')).toBeDefined();
});

test('adopts its stylesheet as a constructable CSSStyleSheet', () => {
  const host = document.createElement('yk-container');
  document.body.appendChild(host);

  expect(host.shadowRoot.adoptedStyleSheets[0]).toBeInstanceOf(CSSStyleSheet);
});

test('constrains width with centered margins and side gutters', async () => {
  document.documentElement.style.setProperty('--yk-space-md', '3px');
  const host = document.createElement('yk-container');
  const child = document.createElement('p');
  host.appendChild(child);
  document.body.appendChild(host);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const style = getComputedStyle(host);
  expect(style.display).toBe('block');
  expect(style.paddingInline).toBe('3px');
  expect(style.maxInlineSize).not.toBe('none');
  const rules = [...host.shadowRoot.adoptedStyleSheets[0].cssRules]
    .map((rule) => rule.cssText)
    .join('\n');
  expect(rules).toContain('margin-inline: auto');
  expect(child.assignedSlot).not.toBeNull();
});

test('prefers the container-level tokens over the global one', () => {
  document.documentElement.style.setProperty('--yk-space-md', '3px');
  const host = document.createElement('yk-container');
  host.style.setProperty('--yk-container-max', '10px');
  host.style.setProperty('--yk-container-padding', '5px');
  document.body.appendChild(host);

  const style = getComputedStyle(host);
  expect(style.maxInlineSize).toBe('10px');
  expect(style.paddingInline).toBe('5px');
});
