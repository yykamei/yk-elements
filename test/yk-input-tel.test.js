// @ts-check
import { afterEach, expect, test } from 'vitest';
import { runFieldBehaviorSuite } from './helpers/field-suite.js';
import '../src/components/yk-input-tel.js';

afterEach(() => {
  document.body.replaceChildren();
});

test('self-registers in the custom element registry', () => {
  expect(customElements.get('yk-input-tel')).toBeDefined();
});

runFieldBehaviorSuite('yk-input-tel', {
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

test('reuses a declarative shadow root and keeps the mirrored attributes', () => {
  const container = document.createElement('div');
  container.setHTMLUnsafe(
    '<yk-input-tel value="090-1234-5678" required><template shadowrootmode="open" shadowrootdelegatesfocus><style>:host{--dsd:1px}</style><input type="tel" part="input"></template></yk-input-tel>',
  );
  document.body.appendChild(container);
  const host = container.querySelector('yk-input-tel');
  const input = host.shadowRoot.querySelector('input');

  expect(host.shadowRoot.querySelector('style')).not.toBeNull();
  expect(host.shadowRoot.querySelectorAll('input').length).toBe(1);
  expect(host.shadowRoot.delegatesFocus).toBe(true);
  expect(host.shadowRoot.adoptedStyleSheets.length).toBe(1);
  expect(input.type).toBe('tel');
  expect(input.required).toBe(true);
});
