// @ts-check
import { afterEach, expect, test } from 'vitest';
import { runFieldBehaviorSuite } from './helpers/field-suite.js';
import '../src/components/yk-input-text.js';

afterEach(() => {
  document.body.replaceChildren();
});

test('self-registers in the custom element registry', () => {
  expect(customElements.get('yk-input-text')).toBeDefined();
});

runFieldBehaviorSuite('yk-input-text', {
  inputType: 'text',
  shortPrefill: 'ab',
  shortMinlength: '3',
  fillValue: 'ykamei',
  pattern: '[a-z]+',
  invalidPatternValue: 'ab1',
});

test('reuses a declarative shadow root and keeps the mirrored attributes', () => {
  const container = document.createElement('div');
  container.setHTMLUnsafe(
    '<yk-input-text value="prefill" placeholder="Type here" required><template shadowrootmode="open" shadowrootdelegatesfocus><style>:host{--dsd:1px}</style><input type="text" part="input"></template></yk-input-text>',
  );
  document.body.appendChild(container);
  const host = container.querySelector('yk-input-text');
  const input = host.shadowRoot.querySelector('input');

  expect(host.shadowRoot.querySelector('style')).not.toBeNull();
  expect(host.shadowRoot.querySelectorAll('input').length).toBe(1);
  expect(host.shadowRoot.delegatesFocus).toBe(true);
  expect(host.shadowRoot.adoptedStyleSheets.length).toBe(1);
  expect(input.type).toBe('text');
  expect(input.required).toBe(true);
});

test('creates its own control when the declarative root has none', () => {
  const container = document.createElement('div');
  container.setHTMLUnsafe(
    '<yk-input-text value="prefill"><template shadowrootmode="open" shadowrootdelegatesfocus><style>:host{--dsd:1px}</style></template></yk-input-text>',
  );
  document.body.appendChild(container);
  const host = container.querySelector('yk-input-text');
  const input = host.shadowRoot.querySelector('input');

  expect(host.shadowRoot.querySelector('style')).not.toBeNull();
  expect(host.shadowRoot.querySelectorAll('input').length).toBe(1);
  expect(input.type).toBe('text');
  expect(input.value).toBe('prefill');
});
