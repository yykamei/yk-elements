// @ts-check
import { afterEach, expect, test } from 'vitest';
import '../src/layout/yk-cluster.js';

afterEach(() => {
  document.body.replaceChildren();
  document.documentElement.style.removeProperty('--yk-space-md');
});

test('self-registers in the custom element registry', () => {
  expect(customElements.get('yk-cluster')).toBeDefined();
});

test('adopts its stylesheet as a constructable CSSStyleSheet', () => {
  const host = document.createElement('yk-cluster');
  document.body.appendChild(host);

  expect(host.shadowRoot.adoptedStyleSheets[0]).toBeInstanceOf(CSSStyleSheet);
});

test('lays out slotted children as a wrapping, centered flex row', async () => {
  document.documentElement.style.setProperty('--yk-space-md', '3px');
  const host = document.createElement('yk-cluster');
  const first = document.createElement('span');
  host.append(first);
  document.body.appendChild(host);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const style = getComputedStyle(host);
  expect(style.display).toBe('flex');
  expect(style.flexWrap).toBe('wrap');
  expect(style.justifyContent).toBe('center');
  expect(style.alignItems).toBe('center');
  expect(style.gap).toBe('3px');
  expect(first.assignedSlot).not.toBeNull();
});

test('wraps children onto new lines when the container is too narrow', async () => {
  const host = document.createElement('yk-cluster');
  for (let i = 0; i < 5; i += 1) {
    const item = document.createElement('span');
    item.textContent = 'item';
    item.style.flexBasis = '80px';
    host.append(item);
  }
  host.style.width = '120px';
  document.body.appendChild(host);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const first = host.children[0];
  const second = host.children[1];
  expect(first.getBoundingClientRect().top).toBeLessThan(
    second.getBoundingClientRect().top,
  );
});

test('prefers component-level justify and gap tokens over the global one', () => {
  document.documentElement.style.setProperty('--yk-space-md', '3px');
  const host = document.createElement('yk-cluster');
  host.style.setProperty('--yk-cluster-justify', 'flex-start');
  host.style.setProperty('--yk-cluster-align', 'flex-start');
  host.style.setProperty('--yk-cluster-gap', '5px');
  document.body.appendChild(host);

  const style = getComputedStyle(host);
  expect(style.justifyContent).toBe('flex-start');
  expect(style.alignItems).toBe('flex-start');
  expect(style.gap).toBe('5px');
});
