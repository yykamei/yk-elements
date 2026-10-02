// @ts-check
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import {
  applyTheme,
  configureTheme,
  getPreference,
  setPreference,
  THEMES,
} from '../src/components/theme.js';

const DEFAULT_KEY = 'yk-theme';

/**
 * Minimal MediaQueryList double: `matches` is mutable and `dispatch` fires the
 * change listeners the controller registered, which is how a browser reports
 * an operating system setting flip.
 */
function fakeMediaQuery() {
  const listeners = new Set();
  return {
    matches: false,
    media: '(prefers-color-scheme: dark)',
    addEventListener(type, listener) {
      if (type === 'change') listeners.add(listener);
    },
    removeEventListener(type, listener) {
      if (type === 'change') listeners.delete(listener);
    },
    dispatch() {
      for (const listener of listeners) listener({ matches: this.matches });
    },
  };
}

/** In-memory store double; the calls are spies for assertions. */
function memoryStore(initial = null) {
  let value = initial;
  return {
    read: vi.fn(() => value),
    write: vi.fn((next) => {
      value = next;
    }),
  };
}

let media;

beforeEach(() => {
  media = fakeMediaQuery();
  vi.spyOn(window, 'matchMedia').mockReturnValue(media);
});

afterEach(() => {
  vi.restoreAllMocks();
  configureTheme({ store: null, persist: true });
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

test('exposes the three preference values', () => {
  expect(THEMES).toEqual(['system', 'light', 'dark']);
});

test('defaults to the system preference when nothing is stored', () => {
  expect(getPreference()).toBe('system');
});

test('persists an explicit preference and applies its resolved theme', () => {
  setPreference('dark');

  expect(localStorage.getItem(DEFAULT_KEY)).toBe('dark');
  expect(getPreference()).toBe('dark');
  expect(document.documentElement.dataset.theme).toBe('dark');

  setPreference('light');
  expect(document.documentElement.dataset.theme).toBe('light');
});

test('ignores a stored value outside the known preferences', () => {
  localStorage.setItem(DEFAULT_KEY, 'sepia');
  expect(getPreference()).toBe('system');
});

test('ignores a preference outside the known values on write', () => {
  localStorage.setItem(DEFAULT_KEY, 'dark');
  setPreference('sepia');
  expect(getPreference()).toBe('dark');
});

test('resolves the system preference through matchMedia', () => {
  media.matches = true;
  applyTheme();
  expect(document.documentElement.dataset.theme).toBe('dark');

  media.matches = false;
  applyTheme();
  expect(document.documentElement.dataset.theme).toBe('light');
});

test('follows the system preference while the preference is system', () => {
  applyTheme();
  expect(document.documentElement.dataset.theme).toBe('light');

  media.matches = true;
  media.dispatch();
  expect(document.documentElement.dataset.theme).toBe('dark');
});

test('keeps an explicit preference when the system preference changes', () => {
  setPreference('light');
  media.matches = true;
  media.dispatch();
  expect(document.documentElement.dataset.theme).toBe('light');
});

test('announces every effective change with preference and resolved theme', () => {
  const changes = [];
  document.documentElement.addEventListener('yk-theme-change', (event) => {
    changes.push(event.detail);
  });

  setPreference('dark');
  expect(changes).toEqual([{ preference: 'dark', resolved: 'dark' }]);

  // Same preference, same resolved theme: nothing changed, no event.
  setPreference('dark');
  expect(changes).toHaveLength(1);

  setPreference('system');
  expect(changes.at(-1)).toEqual({ preference: 'system', resolved: 'light' });
});

test('reads and writes a custom store through configureTheme', () => {
  const store = memoryStore('dark');
  configureTheme({ store });

  expect(getPreference()).toBe('dark');
  expect(document.documentElement.dataset.theme).toBe('dark');

  setPreference('light');
  expect(store.write).toHaveBeenCalledWith('light');
  expect(getPreference()).toBe('light');
});

test('resets to the built-in store when the store is null', () => {
  configureTheme({ store: memoryStore('dark') });
  configureTheme({ store: null });

  localStorage.setItem(DEFAULT_KEY, 'light');
  expect(getPreference()).toBe('light');
});

test('does not read or write the configured store while persistence is off', () => {
  const store = memoryStore('light');
  configureTheme({ store });
  expect(getPreference()).toBe('light');

  configureTheme({ persist: false });
  // The preference in effect is carried into memory, not read back from the
  // store: a value changed behind the controller is not observed.
  store.read.mockReturnValue('dark');
  expect(getPreference()).toBe('light');

  setPreference('system');
  expect(store.write).not.toHaveBeenCalledWith('system');
  expect(getPreference()).toBe('system');
});

test('returns to the configured store when persistence returns', () => {
  const store = memoryStore('dark');
  configureTheme({ store });
  configureTheme({ persist: false });
  setPreference('light');
  expect(store.read()).toBe('dark');

  configureTheme({ persist: true });
  expect(getPreference()).toBe('dark');
});

test('ignores another document while persistence is off', () => {
  setPreference('dark');
  configureTheme({ persist: false });

  localStorage.setItem(DEFAULT_KEY, 'light');
  window.dispatchEvent(
    new StorageEvent('storage', { key: DEFAULT_KEY, newValue: 'light' }),
  );
  expect(document.documentElement.dataset.theme).toBe('dark');
});

test('reapplies the theme when another document changes the stored key', () => {
  setPreference('dark');
  localStorage.setItem(DEFAULT_KEY, 'light');
  window.dispatchEvent(
    new StorageEvent('storage', { key: DEFAULT_KEY, newValue: 'light' }),
  );
  expect(document.documentElement.dataset.theme).toBe('light');
});
