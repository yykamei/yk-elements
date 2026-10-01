// @ts-check
import { afterEach, expect, test } from 'vitest';

const DEFAULT_KEY = 'yk-theme';

afterEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

// The module is imported for its side effect, so it is kept to one test: a
// second import in the same realm would not run again. System resolution is
// covered by the controller tests.
test('applies the stored theme as soon as it loads', async () => {
  localStorage.setItem(DEFAULT_KEY, 'dark');
  expect(document.documentElement.dataset.theme).toBeUndefined();

  await import('../src/components/yk-theme-init.js');

  expect(document.documentElement.dataset.theme).toBe('dark');
});
