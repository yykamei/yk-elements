// @ts-check
import { expect, test } from 'vitest';

test('minified dist entry point self-registers components', async () => {
  await import('/dist/index.js');
  expect(customElements.get('yk-vstack')).toBeDefined();
  expect(customElements.get('yk-hstack')).toBeDefined();
  expect(customElements.get('yk-cluster')).toBeDefined();
});

test('dist mirrors the source tree with minified CSS', async () => {
  const tokens = await fetch('/dist/tokens.css');
  expect(tokens.ok).toBe(true);
  expect(await tokens.text()).toContain('{--yk-space');

  const component = await fetch('/dist/src/layout/yk-vstack.js');
  expect(component.ok).toBe(true);
});
