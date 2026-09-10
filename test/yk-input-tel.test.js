// @ts-check
import { afterEach, expect, test } from 'vitest';
import { runInputBehaviorSuite } from './helpers/input-suite.js';
import '../src/components/yk-input-tel.js';

afterEach(() => {
  document.body.replaceChildren();
});

test('self-registers in the custom element registry', () => {
  expect(customElements.get('yk-input-tel')).toBeDefined();
});

runInputBehaviorSuite('yk-input-tel', {
  inputType: 'tel',
  shortPrefill: 'ab',
  shortMinlength: '3',
  fillValue: '090-1234-5678',
  pattern: '[0-9\\-]+',
  invalidPatternValue: 'abc!',
});

test('does not syntax-check the value because tel has no native format', () => {
  const host = document.createElement('yk-input-tel');
  host.value = 'not a phone number';
  document.body.appendChild(host);

  expect(host.validity.typeMismatch).toBe(false);
  expect(host.checkValidity()).toBe(true);
});
