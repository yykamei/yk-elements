// @ts-check
import { afterEach, expect, test } from 'vitest';
import { runInputBehaviorSuite } from './helpers/input-suite.js';
import '../src/components/yk-input-search.js';

afterEach(() => {
  document.body.replaceChildren();
});

test('self-registers in the custom element registry', () => {
  expect(customElements.get('yk-input-search')).toBeDefined();
});

runInputBehaviorSuite('yk-input-search', {
  inputType: 'search',
  shortPrefill: 'ab',
  shortMinlength: '3',
  fillValue: 'web components',
  pattern: '[a-z ]+',
  invalidPatternValue: 'web components!',
});

test('does not syntax-check the value because search has no native format', () => {
  const host = document.createElement('yk-input-search');
  host.value = 'not a search constraint';
  document.body.appendChild(host);

  expect(host.validity.typeMismatch).toBe(false);
  expect(host.checkValidity()).toBe(true);
});
