// @ts-check
import { afterEach, expect, test } from 'vitest';
import { runFieldBehaviorSuite } from './helpers/field-suite.js';
import '../src/components/yk-input-email.js';

afterEach(() => {
  document.body.replaceChildren();
});

const EMAIL_PATTERN = '.+@example\\.com';

test('self-registers in the custom element registry', () => {
  expect(customElements.get('yk-input-email')).toBeDefined();
});

runFieldBehaviorSuite('yk-input-email', {
  inputType: 'email',
  shortPrefill: 'ab@example.com',
  shortMinlength: '20',
  fillValue: 'ykamei@example.com',
  pattern: EMAIL_PATTERN,
  invalidPatternValue: 'ykamei@example.org',
  sharedFaceWith: [
    'yk-input-text',
    new URL('../src/components/yk-input-text.js', import.meta.url).href,
  ],
});

test('mirrors the multiple attribute onto the internal input', () => {
  const host = document.createElement('yk-input-email');
  host.setAttribute('multiple', '');
  document.body.appendChild(host);

  expect(host.multiple).toBe(true);
  expect(
    host.shadowRoot.querySelector('input').getAttribute('multiple'),
  ).not.toBeNull();
});

test('exposes the multiple property backed by the internal input', () => {
  const host = document.createElement('yk-input-email');
  host.multiple = true;
  document.body.appendChild(host);

  expect(host.multiple).toBe(true);
  expect(host.shadowRoot.querySelector('input').multiple).toBe(true);
});

test('surfaces typeMismatch and blocks form submission until fixed', () => {
  const form = document.createElement('form');
  const host = document.createElement('yk-input-email');
  host.setAttribute('name', 'email');
  host.value = 'not-an-email';
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

  host.value = 'ykamei@example.com';
  expect(host.validity.typeMismatch).toBe(false);
  expect(host.checkValidity()).toBe(true);
  form.requestSubmit();
  expect(submissions.length).toBe(1);
});

test('does not flag an empty value as a type mismatch', () => {
  const host = document.createElement('yk-input-email');
  document.body.appendChild(host);

  expect(host.validity.typeMismatch).toBe(false);
  expect(host.checkValidity()).toBe(true);
});

test('flags a prefilled invalid address as invalid without user interaction', () => {
  const host = document.createElement('yk-input-email');
  host.setAttribute('value', 'not-an-email');
  document.body.appendChild(host);

  expect(host.validity.typeMismatch).toBe(true);
  expect(host.checkValidity()).toBe(false);
});

test('validates each comma-separated address while multiple is set', () => {
  const single = document.createElement('yk-input-email');
  single.value = 'a@example.com, b@example.com';
  document.body.appendChild(single);
  expect(single.validity.typeMismatch).toBe(true);

  const host = document.createElement('yk-input-email');
  host.multiple = true;
  host.value = 'a@example.com, b@example.com';
  document.body.appendChild(host);
  expect(host.checkValidity()).toBe(true);

  host.value = 'a@example.com, not-an-email';
  expect(host.validity.typeMismatch).toBe(true);
  expect(host.checkValidity()).toBe(false);
});

test('reuses a declarative shadow root and keeps the mirrored attributes', () => {
  const container = document.createElement('div');
  container.setHTMLUnsafe(
    '<yk-input-email value="a@b.co" placeholder="you@example.com" required><template shadowrootmode="open" shadowrootdelegatesfocus><style>:host{--dsd:1px}</style><input type="email" part="input"></template></yk-input-email>',
  );
  document.body.appendChild(container);
  const host = container.querySelector('yk-input-email');
  const input = host.shadowRoot.querySelector('input');

  expect(host.shadowRoot.querySelector('style')).not.toBeNull();
  expect(host.shadowRoot.querySelectorAll('input').length).toBe(1);
  expect(host.shadowRoot.delegatesFocus).toBe(true);
  expect(host.shadowRoot.adoptedStyleSheets.length).toBe(1);
  expect(input.type).toBe('email');
  expect(input.required).toBe(true);
});
