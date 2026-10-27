// @ts-check
import { afterEach, expect, test } from 'vitest';
import { runFieldBehaviorSuite } from './helpers/field-suite.js';
import '../src/components/yk-input-url.js';

afterEach(() => {
  document.body.replaceChildren();
});

test('self-registers in the custom element registry', () => {
  expect(customElements.get('yk-input-url')).toBeDefined();
});

runFieldBehaviorSuite('yk-input-url', {
  inputType: 'url',
  shortPrefill: 'https://a.io',
  shortMinlength: '20',
  fillValue: 'https://example.com/yk',
  pattern: 'https://example\\.com/.+',
  invalidPatternValue: 'https://example.org/yk',
});

test('surfaces typeMismatch and blocks form submission until fixed', () => {
  const form = document.createElement('form');
  const host = document.createElement('yk-input-url');
  host.setAttribute('name', 'url');
  host.value = 'not-a-url';
  const submissions = [];
  form.addEventListener('submit', (event) => {
    submissions.push(event);
    event.preventDefault();
  });
  form.append(host);
  document.body.appendChild(form);

  expect(host.validity.typeMismatch).toBe(true);
  expect(host.checkValidity()).toBe(false);
  expect(host.validationMessage).not.toBe('');
  expect(host.matches(':invalid')).toBe(true);

  form.requestSubmit();
  expect(submissions.length).toBe(0);

  host.value = 'https://example.com/yk';
  expect(host.validity.typeMismatch).toBe(false);
  expect(host.checkValidity()).toBe(true);
  form.requestSubmit();
  expect(submissions.length).toBe(1);
});

test('does not flag an empty value as a type mismatch', () => {
  const host = document.createElement('yk-input-url');
  document.body.appendChild(host);

  expect(host.validity.typeMismatch).toBe(false);
  expect(host.checkValidity()).toBe(true);
});

test('flags a prefilled invalid URL as invalid without user interaction', () => {
  const host = document.createElement('yk-input-url');
  host.setAttribute('value', 'not-a-url');
  document.body.appendChild(host);

  expect(host.validity.typeMismatch).toBe(true);
  expect(host.checkValidity()).toBe(false);
});

test('reuses a declarative shadow root and keeps the mirrored attributes', () => {
  const container = document.createElement('div');
  container.setHTMLUnsafe(
    '<yk-input-url value="https://example.com" required><template shadowrootmode="open" shadowrootdelegatesfocus><style>:host{--dsd:1px}</style><input type="url" part="input"></template></yk-input-url>',
  );
  document.body.appendChild(container);
  const host = container.querySelector('yk-input-url');
  const input = host.shadowRoot.querySelector('input');

  expect(host.shadowRoot.querySelector('style')).not.toBeNull();
  expect(host.shadowRoot.querySelectorAll('input').length).toBe(1);
  expect(host.shadowRoot.delegatesFocus).toBe(true);
  expect(host.shadowRoot.adoptedStyleSheets.length).toBe(1);
  expect(input.type).toBe('url');
  expect(input.required).toBe(true);
});
