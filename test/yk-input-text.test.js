// @ts-check
import { afterEach, expect, test } from 'vitest';
import { runInputBehaviorSuite } from './helpers/input-suite.js';
import '../src/components/yk-input-text.js';

afterEach(() => {
  document.body.replaceChildren();
});

test('self-registers in the custom element registry', () => {
  expect(customElements.get('yk-input-text')).toBeDefined();
});

runInputBehaviorSuite('yk-input-text', {
  inputType: 'text',
  shortPrefill: 'ab',
  shortMinlength: '3',
  fillValue: 'ykamei',
  pattern: '[a-z]+',
  invalidPatternValue: 'ab1',
});
