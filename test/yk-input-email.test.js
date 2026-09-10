// @ts-check
import { afterEach, expect, test } from 'vitest';
import '../src/components/yk-input-email.js';

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
const inputOf = (host) => host.shadowRoot.querySelector('input');

afterEach(() => {
  document.body.replaceChildren();
});

test('self-registers in the custom element registry', () => {
  expect(customElements.get('yk-input-email')).toBeDefined();
});

test('adopts its stylesheet as a constructable CSSStyleSheet', () => {
  const host = document.createElement('yk-input-email');
  document.body.appendChild(host);

  expect(host.shadowRoot.adoptedStyleSheets.length).toBe(1);
  expect(host.shadowRoot.adoptedStyleSheets[0]).toBeInstanceOf(CSSStyleSheet);
});

test('renders an internal email input marked as a part', async () => {
  const host = document.createElement('yk-input-email');
  document.body.appendChild(host);
  await frame();

  const input = inputOf(host);
  expect(input).not.toBeNull();
  expect(input.type).toBe('email');
  expect(input.getAttribute('part')).toBe('input');
});

test('mirrors email-field attributes onto the internal input', () => {
  const host = document.createElement('yk-input-email');
  host.setAttribute('placeholder', 'you@example.com');
  host.setAttribute('maxlength', '10');
  host.setAttribute('minlength', '3');
  host.setAttribute('pattern', '.+@example\\.com');
  host.setAttribute('value', 'prefilled@example.com');
  host.setAttribute('readonly', '');
  host.setAttribute('required', '');
  host.setAttribute('multiple', '');
  document.body.appendChild(host);

  const input = inputOf(host);
  expect(input.getAttribute('placeholder')).toBe('you@example.com');
  expect(input.getAttribute('maxlength')).toBe('10');
  expect(input.getAttribute('minlength')).toBe('3');
  expect(input.getAttribute('pattern')).toBe('.+@example\\.com');
  expect(input.getAttribute('value')).toBe('prefilled@example.com');
  expect(input.readOnly).toBe(true);
  expect(input.required).toBe(true);
  expect(input.multiple).toBe(true);
});

test('keeps mirrored attributes in sync when they change later', () => {
  const host = document.createElement('yk-input-email');
  host.setAttribute('maxlength', '10');
  document.body.appendChild(host);

  const input = inputOf(host);
  host.setAttribute('maxlength', '5');
  host.setAttribute('placeholder', 'Updated');
  expect(input.getAttribute('maxlength')).toBe('5');
  expect(input.getAttribute('placeholder')).toBe('Updated');

  host.removeAttribute('maxlength');
  host.removeAttribute('placeholder');
  expect(input.hasAttribute('maxlength')).toBe(false);
  expect(input.hasAttribute('placeholder')).toBe(false);
});

test('exposes email-field properties backed by the internal input', () => {
  const host = document.createElement('yk-input-email');
  host.value = 'ykamei@example.com';
  host.name = 'email';
  host.placeholder = 'Type here';
  host.maxLength = 12;
  host.pattern = '.+@example\\.com';
  host.required = true;
  host.readOnly = true;
  host.multiple = true;
  document.body.appendChild(host);

  expect(host.value).toBe('ykamei@example.com');
  expect(host.name).toBe('email');
  expect(host.placeholder).toBe('Type here');
  expect(host.maxLength).toBe(12);
  expect(host.pattern).toBe('.+@example\\.com');
  expect(host.required).toBe(true);
  expect(host.readOnly).toBe(true);
  expect(host.multiple).toBe(true);
  expect(host.disabled).toBe(false);
  expect(inputOf(host).readOnly).toBe(true);
  expect(inputOf(host).multiple).toBe(true);
});

test('uses the value attribute as the initial value', () => {
  const host = document.createElement('yk-input-email');
  host.setAttribute('value', 'prefilled@example.com');
  document.body.appendChild(host);

  expect(host.value).toBe('prefilled@example.com');
  expect(inputOf(host).value).toBe('prefilled@example.com');
});

test('contributes name=value to the owner form', () => {
  const form = document.createElement('form');
  const host = document.createElement('yk-input-email');
  host.setAttribute('name', 'email');
  host.value = 'ykamei@example.com';
  form.append(host);
  document.body.appendChild(form);

  expect(new FormData(form).get('email')).toBe('ykamei@example.com');
});

test('excludes a disabled field from the owner form', () => {
  const form = document.createElement('form');
  const host = document.createElement('yk-input-email');
  host.setAttribute('name', 'email');
  host.value = 'ykamei@example.com';
  host.disabled = true;
  form.append(host);
  document.body.appendChild(form);

  expect(new FormData(form).has('email')).toBe(false);
});

test('updates the form value as the user types', async () => {
  const form = document.createElement('form');
  const host = document.createElement('yk-input-email');
  host.setAttribute('name', 'email');
  form.append(host);
  document.body.appendChild(form);
  await frame();

  const input = inputOf(host);
  input.value = 'yk';
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));

  expect(new FormData(form).get('email')).toBe('yk');
});

test('keeps the typed value when the value attribute changes afterwards', () => {
  const host = document.createElement('yk-input-email');
  host.setAttribute('value', 'default@example.com');
  document.body.appendChild(host);

  host.value = 'typed@example.com';
  host.setAttribute('value', 'changed@example.com');

  expect(host.value).toBe('typed@example.com');
});

test('lets the value attribute set a new default after a form reset', () => {
  const form = document.createElement('form');
  const host = document.createElement('yk-input-email');
  host.setAttribute('name', 'email');
  host.setAttribute('value', 'default@example.com');
  form.append(host);
  document.body.appendChild(form);

  host.value = 'edited@example.com';
  form.reset();
  host.setAttribute('value', 'new-default@example.com');

  expect(host.value).toBe('new-default@example.com');
  expect(new FormData(form).get('email')).toBe('new-default@example.com');
});

test('keeps the fresh input wired and focused after a form reset', async () => {
  const form = document.createElement('form');
  const host = document.createElement('yk-input-email');
  host.setAttribute('name', 'email');
  host.setAttribute('value', 'default@example.com');
  form.append(host);
  document.body.appendChild(form);
  await frame();

  host.focus();
  form.reset();

  const input = inputOf(host);
  expect(input.getAttribute('part')).toBe('input');
  expect(host.shadowRoot.activeElement).toBe(input);

  input.value = 'typed@example.com';
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));

  expect(new FormData(form).get('email')).toBe('typed@example.com');
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
  expect(host.checkValidity()).toBe(true);
  expect(host.validity.typeMismatch).toBe(false);
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
  const host = document.createElement('yk-input-email');
  host.setAttribute('multiple', '');
  host.value = 'a@example.com, b@example.com';
  document.body.appendChild(host);

  expect(host.validity.typeMismatch).toBe(false);
  expect(host.checkValidity()).toBe(true);

  const narrower = document.createElement('yk-input-email');
  narrower.value = 'a@example.com, b@example.com';
  document.body.appendChild(narrower);

  expect(narrower.validity.typeMismatch).toBe(true);
  expect(narrower.checkValidity()).toBe(false);
});

test('does not flag a prefilled too-short value as invalid', () => {
  const host = document.createElement('yk-input-email');
  host.setAttribute('minlength', '20');
  host.setAttribute('value', 'ab@example.com');
  document.body.appendChild(host);

  expect(host.validity.tooShort).toBe(false);
  expect(host.validity.typeMismatch).toBe(false);
  expect(host.checkValidity()).toBe(true);
});

test('bars readonly fields from validation', () => {
  const host = document.createElement('yk-input-email');
  host.setAttribute('readonly', '');
  host.required = true;
  document.body.appendChild(host);

  expect(host.willValidate).toBe(false);
  expect(host.checkValidity()).toBe(true);
  expect(host.validity.valueMissing).toBe(false);
});

test('surfaces valueMissing and blocks form submission until filled', () => {
  const form = document.createElement('form');
  const host = document.createElement('yk-input-email');
  host.setAttribute('name', 'email');
  host.required = true;
  const submissions = [];
  form.addEventListener('submit', (event) => {
    submissions.push(event);
    event.preventDefault();
  });
  form.append(host);
  document.body.appendChild(form);

  expect(host.validity.valueMissing).toBe(true);
  expect(host.checkValidity()).toBe(false);
  expect(host.validationMessage).not.toBe('');
  expect(host.matches(':invalid')).toBe(true);

  form.requestSubmit();
  expect(submissions.length).toBe(0);

  host.value = 'ykamei@example.com';
  expect(host.checkValidity()).toBe(true);
  form.requestSubmit();
  expect(submissions.length).toBe(1);
});

test('focuses the internal input when reportValidity reports a violation', async () => {
  const host = document.createElement('yk-input-email');
  host.value = 'not-an-email';
  document.body.appendChild(host);
  await frame();

  expect(host.reportValidity()).toBe(false);
  expect(document.activeElement).toBe(host);
  expect(host.shadowRoot.activeElement).toBe(inputOf(host));
});

test('restores the value attribute default when the owner form resets', () => {
  const form = document.createElement('form');
  const host = document.createElement('yk-input-email');
  host.setAttribute('name', 'email');
  host.setAttribute('value', 'default@example.com');
  form.append(host);
  document.body.appendChild(form);

  host.value = 'edited@example.com';
  form.reset();

  expect(host.value).toBe('default@example.com');
  expect(new FormData(form).get('email')).toBe('default@example.com');
});

test('mirrors the disabled attribute onto the internal input and bars validation', () => {
  const host = document.createElement('yk-input-email');
  host.disabled = true;
  document.body.appendChild(host);

  expect(inputOf(host).disabled).toBe(true);
  expect(host.willValidate).toBe(false);
});

test('disables the internal input while a form or fieldset ancestor is disabled', async () => {
  const form = document.createElement('form');
  const fieldset = document.createElement('fieldset');
  fieldset.disabled = true;
  const host = document.createElement('yk-input-email');
  fieldset.append(host);
  form.append(fieldset);
  document.body.appendChild(form);
  await frame();

  expect(inputOf(host).disabled).toBe(true);

  fieldset.disabled = false;
  expect(inputOf(host).disabled).toBe(false);
});

test('excludes the field from the form while a fieldset ancestor is disabled and restores it after', async () => {
  const form = document.createElement('form');
  const fieldset = document.createElement('fieldset');
  fieldset.disabled = true;
  const host = document.createElement('yk-input-email');
  host.setAttribute('name', 'email');
  host.value = 'ykamei@example.com';
  fieldset.append(host);
  form.append(fieldset);
  document.body.appendChild(form);
  await frame();

  expect(new FormData(form).has('email')).toBe(false);

  fieldset.disabled = false;
  expect(new FormData(form).get('email')).toBe('ykamei@example.com');
});

test('focuses the internal input when the host is focused', async () => {
  const host = document.createElement('yk-input-email');
  document.body.appendChild(host);
  await frame();

  host.focus();
  expect(host.shadowRoot.activeElement).toBe(inputOf(host));
});

test('is activated by a label pointing at the host', async () => {
  const label = document.createElement('label');
  label.htmlFor = 'catalog-email';
  const host = document.createElement('yk-input-email');
  host.id = 'catalog-email';
  document.body.append(label, host);
  await frame();

  expect([...host.labels]).toContain(label);

  label.click();
  expect(host.shadowRoot.activeElement).toBe(inputOf(host));
});

test('styles the face like the Bootstrap form control', async () => {
  const host = document.createElement('yk-input-email');
  document.body.appendChild(host);
  await frame();

  const hostStyle = getComputedStyle(host);
  const style = getComputedStyle(inputOf(host));
  expect(hostStyle.display).toBe('block');
  expect(style.display).toBe('block');
  expect(style.boxSizing).toBe('border-box');
  expect(style.backgroundColor).toBe('rgb(255, 255, 255)');
  expect(style.borderTopWidth).toBe('1px');
  expect(style.borderTopLeftRadius).toBe('6px');
  expect(style.paddingTop).toBe('6px');
});

test('reuses the yk-input-text appearance through the shared stylesheet', async () => {
  const email = document.createElement('yk-input-email');
  const text = document.createElement('yk-input-text');
  document.body.append(email, text);
  await Promise.all([import('../src/components/yk-input-text.js'), frame()]);

  const style = getComputedStyle(inputOf(email));
  expect(style.display).toBe('block');
  expect(style.backgroundColor).toBe('rgb(255, 255, 255)');
  expect(style.borderTopWidth).toBe('1px');
  expect(style.paddingTop).toBe('6px');
});

test('styles the disabled and readonly faces with a muted background', async () => {
  const disabled = document.createElement('yk-input-email');
  disabled.disabled = true;
  const readonly = document.createElement('yk-input-email');
  readonly.readOnly = true;
  document.body.append(disabled, readonly);
  await frame();

  const white = 'rgb(255, 255, 255)';
  expect(getComputedStyle(inputOf(disabled)).backgroundColor).not.toBe(white);
  expect(getComputedStyle(inputOf(readonly)).backgroundColor).not.toBe(white);
});
