// @ts-check
import { afterEach, expect, test, vi } from 'vitest';
import '../src/components/yk-theme-switcher.js';
import { configureTheme, setPreference } from '../src/components/theme.js';

const DEFAULT_KEY = 'yk-theme';

const groupOf = (host) => host.shadowRoot.querySelector('[part="group"]');

const radiosOf = (host) => [...host.shadowRoot.querySelectorAll('input')];

const checkedOf = (host) =>
  radiosOf(host)
    .filter((radio) => radio.checked)
    .map((radio) => radio.value);

const labelsOf = (host) =>
  radiosOf(host).map(
    (radio) => radio.closest('label').querySelector('.label').textContent,
  );

function mount(attributes = {}) {
  const host = document.createElement('yk-theme-switcher');
  for (const [name, value] of Object.entries(attributes)) {
    host.setAttribute(name, value);
  }
  document.body.append(host);
  return host;
}

afterEach(() => {
  document.body.replaceChildren();
  configureTheme({ store: null, persist: true });
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  vi.restoreAllMocks();
});

test('self-registers in the custom element registry', () => {
  expect(customElements.get('yk-theme-switcher')).toBeDefined();
});

test('renders one labelled radio per theme inside a named radiogroup', () => {
  const host = mount();

  const group = groupOf(host);
  expect(group.getAttribute('role')).toBe('radiogroup');
  expect(group.getAttribute('aria-label')).toBe('Theme');

  const radios = radiosOf(host);
  expect(radios.map((radio) => radio.value)).toEqual([
    'system',
    'light',
    'dark',
  ]);
  expect(radios.every((radio) => radio.type === 'radio')).toBe(true);
  expect(new Set(radios.map((radio) => radio.name)).size).toBe(1);
  expect(labelsOf(host)).toEqual(['System', 'Light', 'Dark']);
  expect(
    radios.every((radio) => radio.getAttribute('aria-hidden') === null),
  ).toBe(true);
});

test('sizes every option to at least the minimum target size', () => {
  const host = mount();
  for (const option of host.shadowRoot.querySelectorAll('[part="option"]')) {
    const { width, height } = option.getBoundingClientRect();
    expect(width, 'option width').toBeGreaterThanOrEqual(24);
    expect(height, 'option height').toBeGreaterThanOrEqual(24);
  }
});

test('marks the stored preference as checked and applies it', () => {
  localStorage.setItem(DEFAULT_KEY, 'dark');
  const host = mount();

  expect(checkedOf(host)).toEqual(['dark']);
  expect(document.documentElement.dataset.theme).toBe('dark');
});

test('checks the system option when nothing is stored', () => {
  const host = mount();
  expect(checkedOf(host)).toEqual(['system']);
});

test('ignores an unrecognized stored preference', () => {
  localStorage.setItem(DEFAULT_KEY, 'sepia');
  const host = mount();
  expect(checkedOf(host)).toEqual(['system']);
});

test('stores and applies the picked option', () => {
  const host = mount();

  const light = radiosOf(host).find((radio) => radio.value === 'light');
  light.click();

  expect(localStorage.getItem(DEFAULT_KEY)).toBe('light');
  expect(document.documentElement.dataset.theme).toBe('light');
});

test('forces the theme named by the theme attribute', () => {
  const host = mount({ theme: 'dark' });

  expect(checkedOf(host)).toEqual(['dark']);
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(localStorage.getItem(DEFAULT_KEY)).toBe('dark');
});

test('ignores an unrecognized theme attribute value and normalizes it', () => {
  const host = mount({ theme: 'sepia' });

  expect(checkedOf(host)).toEqual(['system']);
  expect(document.documentElement.dataset.theme).toBe('light');
  expect(host.getAttribute('theme')).toBe('system');
});

test('applies a theme attribute set after connect', () => {
  const host = mount();

  host.setAttribute('theme', 'dark');

  expect(checkedOf(host)).toEqual(['dark']);
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(localStorage.getItem(DEFAULT_KEY)).toBe('dark');
});

test('keeps the applied theme when the theme attribute is removed', () => {
  const host = mount({ theme: 'dark' });

  host.removeAttribute('theme');

  expect(checkedOf(host)).toEqual(['dark']);
  expect(document.documentElement.dataset.theme).toBe('dark');
});

test('reflects the picked option into the theme attribute and storage', () => {
  const host = mount();
  expect(host.hasAttribute('theme')).toBe(false);

  radiosOf(host)
    .find((radio) => radio.value === 'dark')
    .click();

  expect(host.getAttribute('theme')).toBe('dark');
  expect(localStorage.getItem(DEFAULT_KEY)).toBe('dark');
  expect(checkedOf(host)).toEqual(['dark']);
});

test('keeps the theme attribute in sync when the preference changes elsewhere', () => {
  const host = mount({ theme: 'light' });

  setPreference('dark');

  expect(host.getAttribute('theme')).toBe('dark');
  expect(checkedOf(host)).toEqual(['dark']);
});

test('never reads or writes localStorage with ephemeral', () => {
  setPreference('light');
  // The store says system, but an ephemeral page never reads it.
  localStorage.setItem(DEFAULT_KEY, 'system');
  const host = mount({ ephemeral: '' });

  expect(checkedOf(host)).toEqual(['light']);
  expect(document.documentElement.dataset.theme).toBe('light');

  radiosOf(host)
    .find((radio) => radio.value === 'dark')
    .click();

  expect(host.getAttribute('theme')).toBe('dark');
  expect(localStorage.getItem(DEFAULT_KEY)).toBe('system');
});

test('starts persisting again when ephemeral is removed', () => {
  const host = mount({ ephemeral: '' });
  radiosOf(host)
    .find((radio) => radio.value === 'dark')
    .click();
  expect(localStorage.getItem(DEFAULT_KEY)).toBeNull();

  host.removeAttribute('ephemeral');
  expect(checkedOf(host)).toEqual(['system']);

  radiosOf(host)
    .find((radio) => radio.value === 'dark')
    .click();
  expect(localStorage.getItem(DEFAULT_KEY)).toBe('dark');
});

test('keeps the document in memory while an ephemeral instance is connected', () => {
  const ephemeral = mount({ ephemeral: '' });
  const persistent = mount();

  // Persistence is off for the whole page, regardless of connect order.
  radiosOf(persistent)
    .find((radio) => radio.value === 'dark')
    .click();
  expect(localStorage.getItem(DEFAULT_KEY)).toBeNull();

  // Disconnecting the ephemeral instance returns the page to the store.
  ephemeral.remove();
  radiosOf(persistent)
    .find((radio) => radio.value === 'light')
    .click();
  expect(localStorage.getItem(DEFAULT_KEY)).toBe('light');
});

test('keeps the applied theme when an ephemeral instance connects later', () => {
  const persistent = mount({ theme: 'dark' });
  expect(document.documentElement.dataset.theme).toBe('dark');

  const ephemeral = mount({ ephemeral: '' });

  // Switching to memory carries the theme in effect instead of resetting it.
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(persistent.getAttribute('theme')).toBe('dark');
  expect(checkedOf(persistent)).toEqual(['dark']);

  ephemeral.remove();
  expect(document.documentElement.dataset.theme).toBe('dark');
});

test('keeps a custom store installed with configureTheme', () => {
  let value = 'dark';
  const store = {
    read: vi.fn(() => value),
    write: vi.fn((next) => {
      value = next;
    }),
  };
  configureTheme({ store });

  const host = mount();
  expect(checkedOf(host)).toEqual(['dark']);

  radiosOf(host)
    .find((radio) => radio.value === 'light')
    .click();
  expect(store.write).toHaveBeenCalledWith('light');
  expect(checkedOf(host)).toEqual(['light']);
});

test('keeps multiple instances in sync through the theme event', () => {
  const first = mount();
  const second = mount();
  expect(checkedOf(first)).toEqual(['system']);

  setPreference('dark');

  expect(checkedOf(first)).toEqual(['dark']);
  expect(checkedOf(second)).toEqual(['dark']);
});

test('follows a preference changed in another document', () => {
  localStorage.setItem(DEFAULT_KEY, 'dark');
  const host = mount();
  expect(checkedOf(host)).toEqual(['dark']);

  localStorage.setItem(DEFAULT_KEY, 'light');
  window.dispatchEvent(
    new StorageEvent('storage', { key: DEFAULT_KEY, newValue: 'light' }),
  );

  expect(checkedOf(host)).toEqual(['light']);
  expect(document.documentElement.dataset.theme).toBe('light');
});
