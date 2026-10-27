// @ts-check
import { afterEach, expect, test } from 'vitest';
import '../src/components/yk-select.js';

afterEach(() => {
  document.body.replaceChildren();
});

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

function makeSelect(...options) {
  const host = document.createElement('yk-select');
  host.innerHTML = options.join('');
  document.body.appendChild(host);
  return host;
}

const selectOf = (host) => host.shadowRoot.querySelector('select');

test('self-registers in the custom element registry', () => {
  expect(customElements.get('yk-select')).toBeDefined();
});

test('adopts the core and own stylesheets as constructable CSSStyleSheets', () => {
  const host = makeSelect('<option value="noun">noun</option>');

  expect(host.shadowRoot.adoptedStyleSheets.length).toBe(2);
  for (const sheet of host.shadowRoot.adoptedStyleSheets) {
    expect(sheet).toBeInstanceOf(CSSStyleSheet);
  }
});

test('renders an internal select marked as a part', async () => {
  const host = makeSelect('<option value="noun">noun</option>');
  await frame();

  const select = selectOf(host);
  expect(select).not.toBeNull();
  expect(select.tagName).toBe('SELECT');
  expect(select.getAttribute('part')).toBe('select');
});

test('renders an arrow indicator as a part', () => {
  const host = makeSelect('<option value="noun">noun</option>');

  expect(host.shadowRoot.querySelector('[part="arrow"]')).not.toBeNull();
});

test('mirrors the light options into the internal select', () => {
  const host = makeSelect(
    '<option value="">Choose…</option>',
    '<option value="noun">noun</option>',
    '<option value="verb">verb</option>',
  );

  expect(
    [...selectOf(host).options].map((option) => [
      option.value,
      option.textContent,
    ]),
  ).toEqual([
    ['', 'Choose…'],
    ['noun', 'noun'],
    ['verb', 'verb'],
  ]);
});

test('hides the light options because they are data', () => {
  const host = makeSelect('<option value="noun">noun</option>');

  expect(host.querySelector('option').hidden).toBe(true);
});

test('rebuilds the internal options when the light options change', async () => {
  const host = makeSelect('<option value="noun">noun</option>');
  const added = document.createElement('option');
  added.value = 'verb';
  added.textContent = 'verb';
  host.append(added);
  await frame();

  expect(selectOf(host).options.length).toBe(2);
  expect([...selectOf(host).options].map((option) => option.value)).toEqual([
    'noun',
    'verb',
  ]);
});

test('does not mirror optgroups, only direct option children', () => {
  const host = makeSelect(
    '<optgroup label="group"><option value="noun">noun</option></optgroup>',
  );

  expect(selectOf(host).options.length).toBe(0);
});

test('keeps the live selection when the host is disabled', () => {
  const host = makeSelect(
    '<option value="noun">noun</option>',
    '<option value="verb">verb</option>',
  );
  host.value = 'verb';

  host.disabled = true;

  expect(host.value).toBe('verb');
});

test('keeps the live selection when an unrelated option attribute changes', async () => {
  const host = makeSelect(
    '<option value="noun">noun</option>',
    '<option value="verb">verb</option>',
  );
  host.value = 'verb';

  host.querySelector('option').disabled = true;
  await frame();

  expect(host.value).toBe('verb');
});

test('keeps the live selection when an option is added', async () => {
  const host = makeSelect(
    '<option value="noun">noun</option>',
    '<option value="verb">verb</option>',
  );
  host.value = 'verb';
  const added = document.createElement('option');
  added.value = 'adjective';
  added.textContent = 'adjective';
  host.append(added);
  await frame();

  expect(selectOf(host).options.length).toBe(3);
  expect(host.value).toBe('verb');
});

test('moves the selection to the option that gains the selected attribute', async () => {
  const host = makeSelect(
    '<option value="noun">noun</option>',
    '<option value="verb">verb</option>',
  );

  host.querySelector('option[value="verb"]').setAttribute('selected', '');
  await frame();

  expect(host.value).toBe('verb');
});

test('falls back to the first option when the selected option is removed', async () => {
  const host = makeSelect(
    '<option value="noun" selected>noun</option>',
    '<option value="verb">verb</option>',
  );

  host.querySelector('option[value="noun"]').remove();
  await frame();

  expect(host.value).toBe('verb');
});

test('falls back to the new default when the option list is replaced', async () => {
  const host = makeSelect(
    '<option value="noun">noun</option>',
    '<option value="verb">verb</option>',
  );
  host.value = 'verb';

  host.innerHTML = '<option value="adjective" selected>adjective</option>';
  await frame();

  expect(host.value).toBe('adjective');
});

test('selects the option marked selected', () => {
  const host = makeSelect(
    '<option value="noun">noun</option>',
    '<option value="verb" selected>verb</option>',
  );

  expect(host.value).toBe('verb');
  expect(selectOf(host).value).toBe('verb');
});

test('exposes a value property that selects the matching option', () => {
  const host = makeSelect(
    '<option value="noun">noun</option>',
    '<option value="verb">verb</option>',
  );

  host.value = 'noun';

  expect(host.value).toBe('noun');
  expect(selectOf(host).value).toBe('noun');
});

test('selects nothing when the value matches no option', () => {
  const host = makeSelect('<option value="noun">noun</option>');

  host.value = 'missing';

  expect(host.value).toBe('');
});

test('contributes name=value to the owner form', () => {
  const form = document.createElement('form');
  const host = makeSelect(
    '<option value="noun" selected>noun</option>',
    '<option value="verb">verb</option>',
  );
  host.setAttribute('name', 'part');
  form.append(host);
  document.body.appendChild(form);

  expect(new FormData(form).get('part')).toBe('noun');
});

test('updates the form value when the selection changes', async () => {
  const form = document.createElement('form');
  const host = makeSelect(
    '<option value="noun" selected>noun</option>',
    '<option value="verb">verb</option>',
  );
  host.setAttribute('name', 'part');
  form.append(host);
  document.body.appendChild(form);
  await frame();

  const select = selectOf(host);
  select.value = 'verb';
  select.dispatchEvent(new Event('input', { bubbles: true, composed: true }));

  expect(new FormData(form).get('part')).toBe('verb');
});

test('surfaces valueMissing for a required empty selection and blocks submission', () => {
  const form = document.createElement('form');
  const host = makeSelect(
    '<option value="" selected>Choose…</option>',
    '<option value="noun">noun</option>',
  );
  host.setAttribute('name', 'part');
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
  expect(host.matches(':invalid')).toBe(true);

  form.requestSubmit();
  expect(submissions.length).toBe(0);

  host.value = 'noun';
  expect(host.checkValidity()).toBe(true);
  form.requestSubmit();
  expect(submissions.length).toBe(1);
});

test('restores the default selected option when the owner form resets', () => {
  const form = document.createElement('form');
  const host = makeSelect(
    '<option value="noun" selected>noun</option>',
    '<option value="verb">verb</option>',
  );
  host.setAttribute('name', 'part');
  form.append(host);
  document.body.appendChild(form);

  host.value = 'verb';
  form.reset();

  expect(host.value).toBe('noun');
  expect(new FormData(form).get('part')).toBe('noun');
});

test('excludes a disabled select from the owner form', () => {
  const form = document.createElement('form');
  const host = makeSelect('<option value="noun" selected>noun</option>');
  host.setAttribute('name', 'part');
  host.disabled = true;
  form.append(host);
  document.body.appendChild(form);

  expect(new FormData(form).has('part')).toBe(false);
});

test('disables the internal select while a fieldset ancestor is disabled', async () => {
  const form = document.createElement('form');
  const fieldset = document.createElement('fieldset');
  fieldset.disabled = true;
  const host = makeSelect('<option value="noun">noun</option>');
  fieldset.append(host);
  form.append(fieldset);
  document.body.appendChild(form);
  await frame();

  expect(selectOf(host).disabled).toBe(true);

  fieldset.disabled = false;
  expect(selectOf(host).disabled).toBe(false);
});

test('focuses the internal select when the host is focused', async () => {
  const host = makeSelect('<option value="noun">noun</option>');
  await frame();

  host.focus();

  expect(host.shadowRoot.activeElement).toBe(selectOf(host));
});

test('is activated by a label pointing at the host', async () => {
  const label = document.createElement('label');
  label.htmlFor = 'catalog-select';
  const host = makeSelect('<option value="noun">noun</option>');
  host.id = 'catalog-select';
  document.body.append(label);
  await frame();

  expect([...host.labels]).toContain(label);

  label.click();
  expect(host.shadowRoot.activeElement).toBe(selectOf(host));
});

test('ignores a value content attribute like a native select', () => {
  const host = document.createElement('yk-select');
  host.setAttribute('value', 'verb');
  host.innerHTML =
    '<option value="noun" selected>noun</option><option value="verb">verb</option>';
  document.body.appendChild(host);

  expect(host.value).toBe('noun');
});

test('styles the face like the Bootstrap form control', async () => {
  const host = makeSelect('<option value="noun">noun</option>');
  await frame();

  const style = getComputedStyle(selectOf(host));
  expect(style.display).toBe('block');
  expect(style.boxSizing).toBe('border-box');
  expect(style.backgroundColor).toBe('rgb(255, 255, 255)');
  expect(style.borderTopWidth).toBe('1px');
  expect(style.borderTopLeftRadius).toBe('6px');
  expect(style.paddingTop).toBe('6px');
});

test('restyles the face through the component tokens', async () => {
  const host = makeSelect('<option value="noun">noun</option>');
  host.style.setProperty('--yk-input-bg', 'rgb(9, 8, 7)');
  host.style.setProperty('--yk-input-border-color', 'rgb(3, 2, 1)');
  await frame();

  const style = getComputedStyle(selectOf(host));
  expect(style.backgroundColor).toBe('rgb(9, 8, 7)');
  expect(style.borderTopColor).toBe('rgb(3, 2, 1)');
});

test('reuses a declarative shadow root and mirrors the light options', () => {
  const container = document.createElement('div');
  container.setHTMLUnsafe(
    '<yk-select required><template shadowrootmode="open" shadowrootdelegatesfocus><style>:host{--dsd:1px}</style><select part="select"></select></template><option value="noun" selected>noun</option><option value="verb">verb</option></yk-select>',
  );
  document.body.appendChild(container);
  const host = container.querySelector('yk-select');
  const select = host.shadowRoot.querySelector('select');

  expect(host.shadowRoot.querySelector('style')).not.toBeNull();
  expect(host.shadowRoot.querySelectorAll('select').length).toBe(1);
  expect(host.shadowRoot.delegatesFocus).toBe(true);
  expect(host.shadowRoot.adoptedStyleSheets.length).toBe(2);
  expect(host.shadowRoot.querySelectorAll('[part="arrow"]').length).toBe(1);
  expect([...select.options].map((option) => option.value)).toEqual([
    'noun',
    'verb',
  ]);
  expect(host.value).toBe('noun');
  expect(select.required).toBe(true);
});
