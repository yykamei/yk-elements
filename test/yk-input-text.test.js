// @ts-check
import { afterEach, expect, test } from 'vitest';
import '../src/components/yk-input-text.js';

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
const inputOf = (host) => host.shadowRoot.querySelector('input');

afterEach(() => {
  document.body.replaceChildren();
});

test('self-registers in the custom element registry', () => {
  expect(customElements.get('yk-input-text')).toBeDefined();
});

test('adopts its stylesheet as a constructable CSSStyleSheet', () => {
  const host = document.createElement('yk-input-text');
  document.body.appendChild(host);

  expect(host.shadowRoot.adoptedStyleSheets.length).toBe(1);
  expect(host.shadowRoot.adoptedStyleSheets[0]).toBeInstanceOf(CSSStyleSheet);
});

test('renders an internal text input marked as a part', async () => {
  const host = document.createElement('yk-input-text');
  document.body.appendChild(host);
  await frame();

  const input = inputOf(host);
  expect(input).not.toBeNull();
  expect(input.type).toBe('text');
  expect(input.getAttribute('part')).toBe('input');
});

test('mirrors text-field attributes onto the internal input', () => {
  const host = document.createElement('yk-input-text');
  host.setAttribute('placeholder', 'Your name');
  host.setAttribute('maxlength', '10');
  host.setAttribute('minlength', '3');
  host.setAttribute('pattern', '[a-z]+');
  host.setAttribute('value', 'prefilled');
  host.setAttribute('readonly', '');
  host.setAttribute('required', '');
  document.body.appendChild(host);

  const input = inputOf(host);
  expect(input.getAttribute('placeholder')).toBe('Your name');
  expect(input.getAttribute('maxlength')).toBe('10');
  expect(input.getAttribute('minlength')).toBe('3');
  expect(input.getAttribute('pattern')).toBe('[a-z]+');
  expect(input.getAttribute('value')).toBe('prefilled');
  expect(input.readOnly).toBe(true);
  expect(input.required).toBe(true);
});

test('keeps mirrored attributes in sync when they change later', () => {
  const host = document.createElement('yk-input-text');
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

test('exposes text-field properties backed by the internal input', () => {
  const host = document.createElement('yk-input-text');
  host.value = 'ykamei';
  host.name = 'handle';
  host.placeholder = 'Type here';
  host.maxLength = 12;
  host.pattern = '[a-z]+';
  host.required = true;
  host.readOnly = true;
  document.body.appendChild(host);

  expect(host.value).toBe('ykamei');
  expect(host.name).toBe('handle');
  expect(host.placeholder).toBe('Type here');
  expect(host.maxLength).toBe(12);
  expect(host.pattern).toBe('[a-z]+');
  expect(host.required).toBe(true);
  expect(host.readOnly).toBe(true);
  expect(inputOf(host).readOnly).toBe(true);
});

test('uses the value attribute as the initial value', () => {
  const host = document.createElement('yk-input-text');
  host.setAttribute('value', 'prefilled');
  document.body.appendChild(host);

  expect(host.value).toBe('prefilled');
  expect(inputOf(host).value).toBe('prefilled');
});

test('contributes name=value to the owner form', () => {
  const form = document.createElement('form');
  const host = document.createElement('yk-input-text');
  host.setAttribute('name', 'handle');
  host.value = 'ykamei';
  form.append(host);
  document.body.appendChild(form);

  expect(new FormData(form).get('handle')).toBe('ykamei');
});

test('excludes a disabled field from the owner form', () => {
  const form = document.createElement('form');
  const host = document.createElement('yk-input-text');
  host.setAttribute('name', 'handle');
  host.value = 'ykamei';
  host.disabled = true;
  form.append(host);
  document.body.appendChild(form);

  expect(new FormData(form).has('handle')).toBe(false);
});

test('updates the form value as the user types', async () => {
  const form = document.createElement('form');
  const host = document.createElement('yk-input-text');
  host.setAttribute('name', 'handle');
  form.append(host);
  document.body.appendChild(form);
  await frame();

  const input = inputOf(host);
  input.value = 'yk';
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));

  expect(new FormData(form).get('handle')).toBe('yk');
});

test('keeps the typed value when the value attribute changes afterwards', () => {
  const host = document.createElement('yk-input-text');
  host.setAttribute('value', 'default');
  document.body.appendChild(host);

  host.value = 'typed';
  host.setAttribute('value', 'changed');

  expect(host.value).toBe('typed');
});

test('lets the value attribute set a new default after a form reset', () => {
  const form = document.createElement('form');
  const host = document.createElement('yk-input-text');
  host.setAttribute('name', 'handle');
  host.setAttribute('value', 'default');
  form.append(host);
  document.body.appendChild(form);

  host.value = 'edited';
  form.reset();
  host.setAttribute('value', 'new-default');

  expect(host.value).toBe('new-default');
  expect(new FormData(form).get('handle')).toBe('new-default');
});

test('keeps the fresh input wired and focused after a form reset', async () => {
  const form = document.createElement('form');
  const host = document.createElement('yk-input-text');
  host.setAttribute('name', 'handle');
  host.setAttribute('value', 'default');
  form.append(host);
  document.body.appendChild(form);
  await frame();

  host.focus();
  form.reset();

  const input = inputOf(host);
  expect(input.getAttribute('part')).toBe('input');
  expect(host.shadowRoot.activeElement).toBe(input);

  input.value = 'typed';
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));

  expect(new FormData(form).get('handle')).toBe('typed');
});

test('surfaces pattern violations and blocks form submission until fixed', () => {
  const form = document.createElement('form');
  const host = document.createElement('yk-input-text');
  host.setAttribute('name', 'code');
  host.setAttribute('pattern', '[a-z]{3}');
  host.value = 'ab1';
  const submissions = [];
  form.addEventListener('submit', (event) => {
    submissions.push(event);
    event.preventDefault();
  });
  form.append(host);
  document.body.appendChild(form);

  expect(host.validity.patternMismatch).toBe(true);
  expect(host.checkValidity()).toBe(false);
  expect(host.validationMessage).not.toBe('');
  expect(host.matches(':invalid')).toBe(true);

  form.requestSubmit();
  expect(submissions.length).toBe(0);

  host.value = 'abc';
  expect(host.checkValidity()).toBe(true);
  form.requestSubmit();
  expect(submissions.length).toBe(1);
});

test('does not flag a prefilled too-short value as invalid', () => {
  const host = document.createElement('yk-input-text');
  host.setAttribute('minlength', '3');
  host.setAttribute('value', 'ab');
  document.body.appendChild(host);

  expect(host.validity.tooShort).toBe(false);
  expect(host.checkValidity()).toBe(true);
});

test('bars readonly fields from validation', () => {
  const host = document.createElement('yk-input-text');
  host.setAttribute('readonly', '');
  host.required = true;
  document.body.appendChild(host);

  expect(host.willValidate).toBe(false);
  expect(host.checkValidity()).toBe(true);
  expect(host.validity.valueMissing).toBe(false);
});

test('surfaces valueMissing and blocks form submission until filled', () => {
  const form = document.createElement('form');
  const host = document.createElement('yk-input-text');
  host.setAttribute('name', 'handle');
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

  host.value = 'ykamei';
  expect(host.checkValidity()).toBe(true);
  form.requestSubmit();
  expect(submissions.length).toBe(1);
});

test('focuses the internal input when reportValidity reports a violation', async () => {
  const host = document.createElement('yk-input-text');
  host.setAttribute('pattern', '[a-z]{3}');
  host.value = 'ab1';
  document.body.appendChild(host);
  await frame();

  expect(host.reportValidity()).toBe(false);
  expect(document.activeElement).toBe(host);
  expect(host.shadowRoot.activeElement).toBe(inputOf(host));
});

test('restores the value attribute default when the owner form resets', () => {
  const form = document.createElement('form');
  const host = document.createElement('yk-input-text');
  host.setAttribute('name', 'handle');
  host.setAttribute('value', 'default');
  form.append(host);
  document.body.appendChild(form);

  host.value = 'edited';
  form.reset();

  expect(host.value).toBe('default');
  expect(new FormData(form).get('handle')).toBe('default');
});

test('mirrors the disabled attribute onto the internal input and bars validation', () => {
  const host = document.createElement('yk-input-text');
  host.disabled = true;
  document.body.appendChild(host);

  expect(inputOf(host).disabled).toBe(true);
  expect(host.willValidate).toBe(false);
});

test('disables the internal input while a form or fieldset ancestor is disabled', async () => {
  const form = document.createElement('form');
  const fieldset = document.createElement('fieldset');
  fieldset.disabled = true;
  const host = document.createElement('yk-input-text');
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
  const host = document.createElement('yk-input-text');
  host.setAttribute('name', 'handle');
  host.value = 'ykamei';
  fieldset.append(host);
  form.append(fieldset);
  document.body.appendChild(form);
  await frame();

  expect(new FormData(form).has('handle')).toBe(false);

  fieldset.disabled = false;
  expect(new FormData(form).get('handle')).toBe('ykamei');
});

test('focuses the internal input when the host is focused', async () => {
  const host = document.createElement('yk-input-text');
  document.body.appendChild(host);
  await frame();

  host.focus();
  expect(host.shadowRoot.activeElement).toBe(inputOf(host));
});

test('is activated by a label pointing at the host', async () => {
  const label = document.createElement('label');
  label.htmlFor = 'catalog-handle';
  const host = document.createElement('yk-input-text');
  host.id = 'catalog-handle';
  document.body.append(label, host);
  await frame();

  expect([...host.labels]).toContain(label);

  label.click();
  expect(host.shadowRoot.activeElement).toBe(inputOf(host));
});

test('styles the face like the Bootstrap form control', async () => {
  const host = document.createElement('yk-input-text');
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

test('restyles the face through the component tokens', async () => {
  const host = document.createElement('yk-input-text');
  host.style.setProperty('--yk-input-bg', 'rgb(9, 8, 7)');
  host.style.setProperty('--yk-input-color', 'rgb(6, 5, 4)');
  host.style.setProperty('--yk-input-border-color', 'rgb(3, 2, 1)');
  host.style.setProperty('--yk-input-radius', '2px');
  document.body.appendChild(host);
  await frame();

  const style = getComputedStyle(inputOf(host));
  expect(style.backgroundColor).toBe('rgb(9, 8, 7)');
  expect(style.color).toBe('rgb(6, 5, 4)');
  expect(style.borderTopColor).toBe('rgb(3, 2, 1)');
  expect(style.borderTopLeftRadius).toBe('2px');
});

test('styles the disabled and readonly faces with a muted background', async () => {
  const disabled = document.createElement('yk-input-text');
  disabled.disabled = true;
  const readonly = document.createElement('yk-input-text');
  readonly.readOnly = true;
  document.body.append(disabled, readonly);
  await frame();

  const white = 'rgb(255, 255, 255)';
  expect(getComputedStyle(inputOf(disabled)).backgroundColor).not.toBe(white);
  expect(getComputedStyle(inputOf(readonly)).backgroundColor).not.toBe(white);
});
