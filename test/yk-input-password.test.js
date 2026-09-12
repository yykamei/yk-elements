// @ts-check
import { afterEach, expect, test } from 'vitest';
import { runInputBehaviorSuite } from './helpers/input-suite.js';
import '../src/components/yk-input-password.js';

afterEach(() => {
  document.body.replaceChildren();
});

test('self-registers in the custom element registry', () => {
  expect(customElements.get('yk-input-password')).toBeDefined();
});

runInputBehaviorSuite('yk-input-password', {
  inputType: 'password',
  shortPrefill: 'ab',
  shortMinlength: '8',
  fillValue: 'yksecret',
  pattern: '[a-z]{8,}',
  invalidPatternValue: 'yk-secret',
  sharedFaceWith: [
    'yk-input-text',
    new URL('../src/components/yk-input-text.js', import.meta.url).href,
  ],
});

test('mirrors the autocomplete attribute onto the internal input', () => {
  const host = document.createElement('yk-input-password');
  host.setAttribute('autocomplete', 'current-password');
  document.body.appendChild(host);

  expect(host.autocomplete).toBe('current-password');
  expect(
    host.shadowRoot.querySelector('input').getAttribute('autocomplete'),
  ).toBe('current-password');

  host.setAttribute('autocomplete', 'new-password');
  expect(
    host.shadowRoot.querySelector('input').getAttribute('autocomplete'),
  ).toBe('new-password');

  host.removeAttribute('autocomplete');
  expect(
    host.shadowRoot.querySelector('input').hasAttribute('autocomplete'),
  ).toBe(false);
});

test('exposes an autocomplete property backed by the internal input', () => {
  const host = document.createElement('yk-input-password');
  host.autocomplete = 'new-password';
  document.body.appendChild(host);

  expect(host.getAttribute('autocomplete')).toBe('new-password');
  expect(host.shadowRoot.querySelector('input').autocomplete).toBe(
    'new-password',
  );
});

test('mirrors the inputmode attribute onto the internal input', () => {
  const host = document.createElement('yk-input-password');
  host.setAttribute('inputmode', 'numeric');
  document.body.appendChild(host);

  const input = host.shadowRoot.querySelector('input');
  expect(host.inputMode).toBe('numeric');
  expect(input.getAttribute('inputmode')).toBe('numeric');
  expect(input.inputMode).toBe('numeric');

  host.removeAttribute('inputmode');
  expect(input.hasAttribute('inputmode')).toBe(false);
});

test('exposes an inputMode property backed by the internal input', () => {
  const host = document.createElement('yk-input-password');
  host.inputMode = 'numeric';
  document.body.appendChild(host);

  expect(host.getAttribute('inputmode')).toBe('numeric');
  expect(host.shadowRoot.querySelector('input').inputMode).toBe('numeric');
});

test('strips CR and LF characters from the value like the native password input', () => {
  const host = document.createElement('yk-input-password');
  document.body.appendChild(host);

  host.value = 'pass\r\nword';
  expect(host.value).toBe('password');

  host.value = 'lengthy\rpassword';
  expect(host.value).toBe('lengthypassword');
});

test('does not syntax-check the value because password has no native format', () => {
  const host = document.createElement('yk-input-password');
  host.value = ' ';
  document.body.appendChild(host);

  expect(host.validity.typeMismatch).toBe(false);
  expect(host.checkValidity()).toBe(true);
});
