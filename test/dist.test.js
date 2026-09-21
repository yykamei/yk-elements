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
  expect(customElements.get('yk-theme-switcher')).toBeDefined();
});

test('dist mirrors the source tree with minified CSS', async () => {
  const tokens = await fetch('/dist/tokens.css');
  expect(tokens.ok).toBe(true);
  const text = await tokens.text();
  // Vite wraps a requested .css in a JS module here, so the assertions match
  // token names rather than their position; that keeps them independent of
  // declaration order.
  expect(text).toContain('--yk-space-sm');
  expect(text).toContain('--yk-color-surface');
  expect(text).toContain('color-scheme');

  const component = await fetch('/dist/src/layout/yk-vstack.js');
  expect(component.ok).toBe(true);

  const theme = await fetch('/dist/src/components/yk-theme-init.js');
  expect(theme.ok).toBe(true);
});
