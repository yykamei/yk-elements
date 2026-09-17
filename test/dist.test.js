// @ts-check
import { expect, test } from 'vitest';

test('minified dist entry point self-registers components', async () => {
  await import('/dist/index.js');
  expect(customElements.get('yk-vstack')).toBeDefined();
  expect(customElements.get('yk-hstack')).toBeDefined();
  expect(customElements.get('yk-cluster')).toBeDefined();
  expect(customElements.get('yk-grid')).toBeDefined();
  expect(customElements.get('yk-pad')).toBeDefined();
  expect(customElements.get('yk-button')).toBeDefined();
  expect(customElements.get('yk-link')).toBeDefined();
  expect(customElements.get('yk-badge')).toBeDefined();
  expect(customElements.get('yk-soft-nav')).toBeDefined();
  expect(customElements.get('yk-input-text')).toBeDefined();
  expect(customElements.get('yk-input-email')).toBeDefined();
  expect(customElements.get('yk-input-tel')).toBeDefined();
  expect(customElements.get('yk-input-url')).toBeDefined();
  expect(customElements.get('yk-input-password')).toBeDefined();
  expect(customElements.get('yk-input-search')).toBeDefined();
  expect(customElements.get('yk-input-file')).toBeDefined();
  expect(customElements.get('yk-input-checkbox')).toBeDefined();
});

test('dist mirrors the source tree with minified CSS', async () => {
  const tokens = await fetch('/dist/tokens.css');
  expect(tokens.ok).toBe(true);
  expect(await tokens.text()).toContain('{--yk-space');

  const component = await fetch('/dist/src/layout/yk-vstack.js');
  expect(component.ok).toBe(true);
});
