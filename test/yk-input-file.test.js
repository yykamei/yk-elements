// @ts-check
import { afterEach, expect, test } from 'vitest';
import '../src/components/yk-input-file.js';

afterEach(() => {
  document.body.replaceChildren();
});

// Native file inputs reject programmatic value assignment, so tests select
// files through DataTransfer, the same channel a drop event uses.
const fileOf = (name, type = 'text/plain') =>
  new File(['content'], name, { type });

const selectFiles = (input, files) => {
  const transfer = new DataTransfer();
  for (const file of files) {
    transfer.items.add(file);
  }
  input.files = transfer.files;
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
};

const hostOf = () => document.createElement('yk-input-file');
const inputOf = (host) => host.shadowRoot.querySelector('input');

test('self-registers in the custom element registry', () => {
  expect(customElements.get('yk-input-file')).toBeDefined();
});

test('renders an internal file input marked as a part', async () => {
  const host = hostOf();
  document.body.appendChild(host);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const input = inputOf(host);
  expect(input).not.toBeNull();
  expect(input.type).toBe('file');
  expect(input.getAttribute('part')).toBe('input');
});

test('mirrors the accept attribute onto the internal input', () => {
  const host = hostOf();
  host.setAttribute('accept', 'image/png,image/jpeg');
  document.body.appendChild(host);

  expect(inputOf(host).getAttribute('accept')).toBe('image/png,image/jpeg');

  host.removeAttribute('accept');
  expect(inputOf(host).hasAttribute('accept')).toBe(false);
});

test('exposes the accept property backed by the internal input', () => {
  const host = hostOf();
  host.accept = 'application/pdf';
  document.body.appendChild(host);

  expect(host.accept).toBe('application/pdf');
  expect(host.getAttribute('accept')).toBe('application/pdf');
  expect(inputOf(host).accept).toBe('application/pdf');
});

test('mirrors the multiple attribute onto the internal input', () => {
  const host = hostOf();
  host.setAttribute('multiple', '');
  document.body.appendChild(host);

  expect(host.multiple).toBe(true);
  expect(inputOf(host).multiple).toBe(true);
});

test('exposes the multiple property backed by the internal input', () => {
  const host = hostOf();
  host.multiple = true;
  document.body.appendChild(host);

  expect(host.multiple).toBe(true);
  expect(inputOf(host).multiple).toBe(true);
});

test('exposes the selected files through the files property', async () => {
  const host = hostOf();
  document.body.appendChild(host);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  expect(host.files.length).toBe(0);

  selectFiles(inputOf(host), [fileOf('a.txt')]);
  expect(host.files.length).toBe(1);
  expect(host.files[0].name).toBe('a.txt');
});

test('reports the fakepath string as the value like a native file input', async () => {
  const host = hostOf();
  document.body.appendChild(host);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  expect(host.value).toBe('');

  selectFiles(inputOf(host), [fileOf('a.txt')]);
  expect(host.value).toBe('C:\\fakepath\\a.txt');
});

test('rejects a non-empty value assignment like a native file input', async () => {
  const host = hostOf();
  document.body.appendChild(host);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  expect(() => {
    host.value = 'not-allowed';
  }).toThrow();
  expect(host.value).toBe('');
});

test('clears the selection when an empty string is assigned to value', async () => {
  const host = hostOf();
  document.body.appendChild(host);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  selectFiles(inputOf(host), [fileOf('a.txt')]);
  host.value = '';
  expect(host.value).toBe('');
  expect(host.files.length).toBe(0);
});

test('contributes the selected File to the owner form', async () => {
  const form = document.createElement('form');
  const host = hostOf();
  host.setAttribute('name', 'attachment');
  form.append(host);
  document.body.appendChild(form);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const file = fileOf('a.txt');
  selectFiles(inputOf(host), [file]);

  const submitted = new FormData(form).getAll('attachment');
  expect(submitted.length).toBe(1);
  expect(submitted[0]).toBeInstanceOf(File);
  expect(submitted[0].name).toBe('a.txt');
});

test('contributes one entry per selected file while multiple is set', async () => {
  const form = document.createElement('form');
  const host = hostOf();
  host.setAttribute('name', 'attachment');
  host.setAttribute('multiple', '');
  form.append(host);
  document.body.appendChild(form);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  selectFiles(inputOf(host), [fileOf('a.txt'), fileOf('b.txt')]);

  const submitted = new FormData(form).getAll('attachment');
  expect(submitted.map((file) => file.name)).toEqual(['a.txt', 'b.txt']);
});

test('contributes the File even when a multiple field holds exactly one file', async () => {
  const form = document.createElement('form');
  const host = hostOf();
  host.setAttribute('name', 'attachment');
  host.setAttribute('multiple', '');
  form.append(host);
  document.body.appendChild(form);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  selectFiles(inputOf(host), [fileOf('a.txt')]);

  const submitted = new FormData(form).getAll('attachment');
  expect(submitted.map((file) => file.name)).toEqual(['a.txt']);
});

test('contributes no entry while the host has no name even with files selected', async () => {
  const form = document.createElement('form');
  const host = hostOf();
  host.setAttribute('multiple', '');
  form.append(host);
  document.body.appendChild(form);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  selectFiles(inputOf(host), [fileOf('a.txt'), fileOf('b.txt')]);

  expect(new FormData(form).entries().next().done).toBe(true);
});

test('excludes the field from the owner form while nothing is selected', async () => {
  const form = document.createElement('form');
  const host = hostOf();
  host.setAttribute('name', 'attachment');
  form.append(host);
  document.body.appendChild(form);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  expect(new FormData(form).has('attachment')).toBe(false);
});

test('clears the selection when the owner form resets', async () => {
  const form = document.createElement('form');
  const host = hostOf();
  host.setAttribute('name', 'attachment');
  form.append(host);
  document.body.appendChild(form);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  selectFiles(inputOf(host), [fileOf('a.txt')]);
  form.reset();

  expect(host.files.length).toBe(0);
  expect(new FormData(form).has('attachment')).toBe(false);
});

test('surfaces valueMissing and blocks form submission until a file is selected', async () => {
  const form = document.createElement('form');
  const host = hostOf();
  host.setAttribute('name', 'attachment');
  host.required = true;
  const submissions = [];
  form.addEventListener('submit', (event) => {
    submissions.push(event);
    event.preventDefault();
  });
  form.append(host);
  document.body.appendChild(form);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  expect(host.validity.valueMissing).toBe(true);
  expect(host.checkValidity()).toBe(false);
  expect(host.matches(':invalid')).toBe(true);

  form.requestSubmit();
  expect(submissions.length).toBe(0);

  selectFiles(inputOf(host), [fileOf('a.txt')]);
  expect(host.checkValidity()).toBe(true);
  form.requestSubmit();
  expect(submissions.length).toBe(1);
});

test('bars a readonly attribute from being mirrored because file inputs have none', () => {
  const host = hostOf();
  host.setAttribute('readonly', '');
  document.body.appendChild(host);

  expect(inputOf(host).hasAttribute('readonly')).toBe(false);
});

test('mirrors the disabled attribute onto the internal input', () => {
  const host = hostOf();
  host.disabled = true;
  document.body.appendChild(host);

  expect(inputOf(host).disabled).toBe(true);
});

test('excludes a disabled field from the owner form', async () => {
  const form = document.createElement('form');
  const host = hostOf();
  host.setAttribute('name', 'attachment');
  host.disabled = true;
  form.append(host);
  document.body.appendChild(form);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  selectFiles(inputOf(host), [fileOf('a.txt')]);
  expect(new FormData(form).has('attachment')).toBe(false);
});

test('excludes the field from the form while a fieldset ancestor is disabled', async () => {
  const form = document.createElement('form');
  const fieldset = document.createElement('fieldset');
  fieldset.disabled = true;
  const host = hostOf();
  host.setAttribute('name', 'attachment');
  fieldset.append(host);
  form.append(fieldset);
  document.body.appendChild(form);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  selectFiles(inputOf(host), [fileOf('a.txt')]);
  expect(new FormData(form).has('attachment')).toBe(false);

  fieldset.disabled = false;
  expect(new FormData(form).getAll('attachment').length).toBe(1);
});

test('focuses the internal input when the host is focused', async () => {
  const host = hostOf();
  document.body.appendChild(host);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  host.focus();
  expect(host.shadowRoot.activeElement).toBe(inputOf(host));
});

test('is activated by a label pointing at the host', async () => {
  const label = document.createElement('label');
  label.htmlFor = 'yk-file-labelable';
  const host = hostOf();
  host.id = 'yk-file-labelable';
  document.body.append(label, host);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  expect([...host.labels]).toContain(label);

  label.click();
  expect(host.shadowRoot.activeElement).toBe(inputOf(host));
});

test('styles the face like the shared form control with a file selector button', async () => {
  const host = hostOf();
  document.body.appendChild(host);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const style = getComputedStyle(inputOf(host));
  expect(style.display).toBe('block');
  expect(style.boxSizing).toBe('border-box');
  expect(style.backgroundColor).toBe('rgb(255, 255, 255)');
  expect(style.borderTopWidth).toBe('1px');
  expect(style.borderTopLeftRadius).toBe('6px');
  expect(style.paddingTop).toBe('6px');
  expect(style.cursor).toBe('pointer');

  const button = getComputedStyle(inputOf(host), '::file-selector-button');
  expect(button.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(button.marginRight).not.toBe('0px');
});

test('reuses the shared input face with yk-input-text', async () => {
  const host = hostOf();
  const sibling = document.createElement('yk-input-text');
  document.body.append(host, sibling);
  await Promise.all([
    import('../src/components/yk-input-text.js'),
    new Promise((resolve) => requestAnimationFrame(resolve)),
  ]);

  const style = getComputedStyle(inputOf(host));
  expect(style.backgroundColor).toBe('rgb(255, 255, 255)');
  expect(style.borderTopWidth).toBe('1px');
  expect(style.paddingTop).toBe('6px');
});

test('keeps the muted disabled background despite the read-only override', async () => {
  const enabled = hostOf();
  const disabled = hostOf();
  disabled.disabled = true;
  document.body.append(enabled, disabled);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const white = 'rgb(255, 255, 255)';
  expect(getComputedStyle(inputOf(enabled)).backgroundColor).toBe(white);
  expect(getComputedStyle(inputOf(disabled)).backgroundColor).not.toBe(white);
});

test('restyles the face through the component tokens', async () => {
  const host = hostOf();
  host.style.setProperty('--yk-input-bg', 'rgb(9, 8, 7)');
  host.style.setProperty('--yk-input-color', 'rgb(6, 5, 4)');
  host.style.setProperty('--yk-input-border-color', 'rgb(3, 2, 1)');
  host.style.setProperty('--yk-input-radius', '2px');
  document.body.appendChild(host);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const style = getComputedStyle(inputOf(host));
  expect(style.backgroundColor).toBe('rgb(9, 8, 7)');
  expect(style.color).toBe('rgb(6, 5, 4)');
  expect(style.borderTopColor).toBe('rgb(3, 2, 1)');
  expect(style.borderTopLeftRadius).toBe('2px');
});
