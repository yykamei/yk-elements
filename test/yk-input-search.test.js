// @ts-check
import { afterEach, expect, test } from 'vitest';
import { runFieldBehaviorSuite } from './helpers/field-suite.js';
import '../src/components/yk-input-search.js';

afterEach(() => {
  document.body.replaceChildren();
});

test('self-registers in the custom element registry', () => {
  expect(customElements.get('yk-input-search')).toBeDefined();
});

runFieldBehaviorSuite('yk-input-search', {
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

test('reuses a declarative shadow root and keeps the mirrored attributes', () => {
  const container = document.createElement('div');
  container.setHTMLUnsafe(
    '<yk-input-search value="query" required><template shadowrootmode="open" shadowrootdelegatesfocus><style>:host{--dsd:1px}</style><input type="search" part="input"></template></yk-input-search>',
  );
  document.body.appendChild(container);
  const host = container.querySelector('yk-input-search');
  const input = host.shadowRoot.querySelector('input');

  expect(host.shadowRoot.querySelector('style')).not.toBeNull();
  expect(host.shadowRoot.querySelectorAll('input').length).toBe(1);
  expect(host.shadowRoot.delegatesFocus).toBe(true);
  expect(host.shadowRoot.adoptedStyleSheets.length).toBe(1);
  expect(input.type).toBe('search');
  expect(input.required).toBe(true);
});
