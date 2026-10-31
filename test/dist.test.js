// @ts-check
import { expect, test } from 'vitest';

test('minified dist entry point self-registers components', async () => {
  await import('/dist/index.js');
  expect(customElements.get('yk-vstack')).toBeDefined();
  expect(customElements.get('yk-hstack')).toBeDefined();
  expect(customElements.get('yk-cluster')).toBeDefined();
  expect(customElements.get('yk-grid')).toBeDefined();
  expect(customElements.get('yk-pad')).toBeDefined();
  expect(customElements.get('yk-container')).toBeDefined();
  expect(customElements.get('yk-button')).toBeDefined();
  expect(customElements.get('yk-link')).toBeDefined();
  expect(customElements.get('yk-badge')).toBeDefined();
  expect(customElements.get('yk-card')).toBeDefined();
  expect(customElements.get('yk-field-list-item')).toBeDefined();
  expect(customElements.get('yk-field-list')).toBeDefined();
  expect(customElements.get('yk-alert')).toBeDefined();
  expect(customElements.get('yk-dialog')).toBeDefined();
  expect(customElements.get('yk-progress')).toBeDefined();
  expect(customElements.get('yk-audio')).toBeDefined();
  expect(customElements.get('yk-footer')).toBeDefined();
  expect(customElements.get('yk-footer-links')).toBeDefined();
  expect(customElements.get('yk-soft-nav')).toBeDefined();
  expect(customElements.get('yk-input-text')).toBeDefined();
  expect(customElements.get('yk-input-email')).toBeDefined();
  expect(customElements.get('yk-input-tel')).toBeDefined();
  expect(customElements.get('yk-input-url')).toBeDefined();
  expect(customElements.get('yk-input-password')).toBeDefined();
  expect(customElements.get('yk-input-search')).toBeDefined();
  expect(customElements.get('yk-input-file')).toBeDefined();
  expect(customElements.get('yk-input-checkbox')).toBeDefined();
  expect(customElements.get('yk-textarea')).toBeDefined();
  expect(customElements.get('yk-select')).toBeDefined();
  expect(customElements.get('yk-combobox')).toBeDefined();
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

  const fouc = await fetch('/dist/fouc.css');
  expect(fouc.ok).toBe(true);
  const foucText = await fouc.text();
  expect(foucText).toContain('yk-vstack:not(:defined)');
  expect(foucText).toContain('yk-container:not(:defined)');

  const reset = await fetch('/dist/reset.css');
  expect(reset.ok).toBe(true);
  const resetText = await reset.text();
  expect(resetText).toContain(':where(body)');
  for (const tag of ['yk-vstack', 'yk-hstack', 'yk-cluster', 'yk-grid']) {
    expect(resetText).toContain(tag);
  }
  expect(resetText).toContain('margin-block');

  const base = await fetch('/dist/src/base.js');
  expect(base.ok).toBe(true);

  const normalize = await fetch('/dist/src/normalize.css');
  expect(normalize.ok).toBe(true);
  const normalizeText = await normalize.text();
  expect(normalizeText).toContain('yk-container');
  expect(normalizeText).toContain('box-sizing');
  expect(normalizeText).toContain('margin-block');

  const component = await fetch('/dist/src/layout/yk-vstack.js');
  expect(component.ok).toBe(true);

  const theme = await fetch('/dist/src/components/yk-theme-init.js');
  expect(theme.ok).toBe(true);
});
