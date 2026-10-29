// @ts-check
import { afterEach, expect, test } from 'vitest';
import { runFieldBehaviorSuite } from './helpers/field-suite.js';
import '../src/components/yk-textarea.js';

afterEach(() => {
  document.body.replaceChildren();
});

test('self-registers in the custom element registry', () => {
  expect(customElements.get('yk-textarea')).toBeDefined();
});

runFieldBehaviorSuite('yk-textarea', {
  controlTag: 'textarea',
  controlPart: 'textarea',
  shortPrefill: 'ab',
  shortMinlength: '3',
  fillValue: 'the meaning of a word',
  sharedFaceWith: [
    'yk-input-text',
    new URL('../src/components/yk-input-text.js', import.meta.url).href,
  ],
});

test('mirrors the rows attribute onto the internal textarea', () => {
  const host = document.createElement('yk-textarea');
  host.setAttribute('rows', '5');
  document.body.appendChild(host);

  expect(host.rows).toBe(5);
  expect(host.shadowRoot.querySelector('textarea').rows).toBe(5);

  host.setAttribute('rows', '3');
  expect(host.shadowRoot.querySelector('textarea').rows).toBe(3);

  host.removeAttribute('rows');
  expect(host.shadowRoot.querySelector('textarea').rows).toBe(2);
});

test('exposes a rows property backed by the internal textarea', () => {
  const host = document.createElement('yk-textarea');
  host.rows = 4;
  document.body.appendChild(host);

  expect(host.getAttribute('rows')).toBe('4');
  expect(host.shadowRoot.querySelector('textarea').rows).toBe(4);
});

test('resizes vertically only so the field cannot widen past its container', () => {
  const host = document.createElement('yk-textarea');
  document.body.appendChild(host);

  const textarea = host.shadowRoot.querySelector('textarea');

  expect(getComputedStyle(textarea).resize).toBe('vertical');
});

test('has no pattern constraint because a native textarea has none', () => {
  const host = document.createElement('yk-textarea');
  host.value = 'not a constrained value!';
  document.body.appendChild(host);

  expect(host.validity.patternMismatch).toBe(false);
  expect(host.checkValidity()).toBe(true);
});

test('reuses a declarative shadow root and keeps the mirrored attributes', () => {
  const container = document.createElement('div');
  container.setHTMLUnsafe(
    '<yk-textarea rows="4" placeholder="Write here" required><template shadowrootmode="open" shadowrootdelegatesfocus><style>:host{--dsd:1px}</style><textarea part="textarea"></textarea></template></yk-textarea>',
  );
  document.body.appendChild(container);
  const host = container.querySelector('yk-textarea');
  const textarea = host.shadowRoot.querySelector('textarea');

  expect(host.shadowRoot.querySelector('style')).not.toBeNull();
  expect(host.shadowRoot.querySelectorAll('textarea').length).toBe(1);
  expect(host.shadowRoot.delegatesFocus).toBe(true);
  expect(host.shadowRoot.adoptedStyleSheets.length).toBe(1);
  expect(textarea.rows).toBe(4);
  expect(textarea.placeholder).toBe('Write here');
  expect(textarea.required).toBe(true);
});
