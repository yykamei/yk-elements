// @ts-check
import { afterEach, expect, test } from 'vitest';
import '../src/components/yk-combobox.js';

afterEach(() => {
  document.body.replaceChildren();
});

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const SAMPLE = `
  <option value="noun" data-description="A naming word">noun</option>
  <option value="verb" data-description="An action word">verb</option>
  <option value="adjective">adjective</option>
`;

function makeCombobox(options = SAMPLE) {
  const host = document.createElement('yk-combobox');
  host.innerHTML = options;
  document.body.appendChild(host);
  return host;
}

const inputOf = (host) => host.shadowRoot.querySelector('[part="input"]');
const fieldOf = (host) => host.shadowRoot.querySelector('[part="field"]');
const popupOf = (host) => host.shadowRoot.querySelector('[part="popup"]');
const listboxOf = (host) => host.shadowRoot.querySelector('[part="listbox"]');
const emptyOf = (host) => host.shadowRoot.querySelector('[part="empty"]');
const rowsOf = (host) => [...listboxOf(host).children];
const visibleRowsOf = (host) => rowsOf(host).filter((row) => !row.hidden);
const isOpen = (host) => popupOf(host).matches(':popover-open');
const activeOf = (host) => host.shadowRoot.querySelector('[data-active]');

function type(host, text) {
  const input = inputOf(host);
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
}

function press(host, key) {
  inputOf(host).dispatchEvent(
    new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      composed: true,
    }),
  );
}

test('self-registers in the custom element registry', () => {
  expect(customElements.get('yk-combobox')).toBeDefined();
});

test('adopts its stylesheet as a constructable CSSStyleSheet', () => {
  const host = makeCombobox();

  expect(host.shadowRoot.adoptedStyleSheets.length).toBe(1);
  expect(host.shadowRoot.adoptedStyleSheets[0]).toBeInstanceOf(CSSStyleSheet);
});

test('renders an internal input marked as a combobox', () => {
  const host = makeCombobox();
  const input = inputOf(host);

  expect(input).not.toBeNull();
  expect(input.getAttribute('part')).toBe('input');
  expect(input.getAttribute('role')).toBe('combobox');
  expect(input.getAttribute('autocomplete')).toBe('off');
  expect(input.getAttribute('aria-autocomplete')).toBe('list');
});

test('renders the field, arrow, and listbox parts', () => {
  const host = makeCombobox();

  expect(fieldOf(host)).not.toBeNull();
  expect(host.shadowRoot.querySelector('[part="arrow"]')).not.toBeNull();
  expect(listboxOf(host).getAttribute('role')).toBe('listbox');
  expect(popupOf(host).getAttribute('popover')).toBe('manual');
});

test('points aria-controls at the listbox and starts collapsed', () => {
  const host = makeCombobox();
  const input = inputOf(host);

  expect(input.getAttribute('aria-expanded')).toBe('false');
  expect(input.getAttribute('aria-controls')).toBe(listboxOf(host).id);
  expect(isOpen(host)).toBe(false);
});

test('mirrors the light options into rows with a label and description', () => {
  const host = makeCombobox();
  const rows = rowsOf(host);

  expect(rows.map((row) => row.dataset.value)).toEqual([
    'noun',
    'verb',
    'adjective',
  ]);
  expect(rows[0].querySelector('[part="option-label"]').textContent).toBe(
    'noun',
  );
  expect(rows[0].querySelector('[part="option-description"]').textContent).toBe(
    'A naming word',
  );
  expect(rows[2].querySelector('[part="option-description"]')).toBeNull();
});

test('hides the light options because they are data', () => {
  const host = makeCombobox();

  for (const option of host.querySelectorAll('option')) {
    expect(option.hidden).toBe(true);
  }
});

test('reads only direct option children and ignores optgroups', () => {
  const host = makeCombobox(
    '<optgroup label="group"><option value="noun">noun</option></optgroup>',
  );

  expect(rowsOf(host).length).toBe(0);
});

test('marks disabled options through aria-disabled', () => {
  const host = makeCombobox(
    '<option value="noun" disabled>noun</option><option value="verb">verb</option>',
  );

  expect(rowsOf(host)[0].getAttribute('aria-disabled')).toBe('true');
  expect(rowsOf(host)[1].hasAttribute('aria-disabled')).toBe(false);
});

test('opens the listbox on a click and reflects it on aria-expanded', () => {
  const host = makeCombobox();

  inputOf(host).click();

  expect(isOpen(host)).toBe(true);
  expect(inputOf(host).getAttribute('aria-expanded')).toBe('true');
});

test('opens on ArrowDown and moves the active row with the arrow keys', () => {
  const host = makeCombobox();

  press(host, 'ArrowDown');
  expect(isOpen(host)).toBe(true);
  expect(activeOf(host).dataset.value).toBe('noun');

  press(host, 'ArrowDown');
  expect(activeOf(host).dataset.value).toBe('verb');

  press(host, 'ArrowUp');
  expect(activeOf(host).dataset.value).toBe('noun');
});

test('opens at the last row on ArrowUp from a closed popup', () => {
  const host = makeCombobox();

  press(host, 'ArrowUp');

  expect(isOpen(host)).toBe(true);
  expect(activeOf(host).dataset.value).toBe('adjective');
});

test('activates the selected row when the popup opens', () => {
  const host = makeCombobox();
  host.value = 'verb';

  press(host, 'ArrowDown');

  expect(activeOf(host).dataset.value).toBe('verb');
});

test('filters rows by a case-insensitive substring of the label', () => {
  const host = makeCombobox();

  type(host, 'NO');

  expect(isOpen(host)).toBe(true);
  expect(visibleRowsOf(host).map((row) => row.dataset.value)).toEqual(['noun']);
});

test('filters rows by the description as well as the label', () => {
  const host = makeCombobox();

  type(host, 'action');

  expect(visibleRowsOf(host).map((row) => row.dataset.value)).toEqual(['verb']);
});

test('shows the empty state and clears the active row when nothing matches', () => {
  const host = makeCombobox();

  press(host, 'ArrowDown');
  type(host, 'zzz');

  expect(visibleRowsOf(host).length).toBe(0);
  expect(emptyOf(host).hidden).toBe(false);
  expect(inputOf(host).hasAttribute('aria-activedescendant')).toBe(false);
});

test('shows the full list when reopening after a selection', () => {
  const host = makeCombobox();
  host.value = 'verb';

  inputOf(host).click();

  expect(visibleRowsOf(host).map((row) => row.dataset.value)).toEqual([
    'noun',
    'verb',
    'adjective',
  ]);
});

test('drops the query when the popup closes and reopens', () => {
  const host = makeCombobox();
  inputOf(host).click();
  type(host, 'verb');
  expect(visibleRowsOf(host).length).toBe(1);

  press(host, 'Escape');
  inputOf(host).click();

  expect(visibleRowsOf(host).length).toBe(3);
});

test('types into the input without changing the value until an option is chosen', () => {
  const host = makeCombobox();

  type(host, 'ver');

  expect(host.value).toBe('');
});

test('commits the active option on Enter and closes the popup', () => {
  const host = makeCombobox();
  const changes = [];
  host.addEventListener('change', (event) => changes.push(event));

  press(host, 'ArrowDown');
  press(host, 'ArrowDown');
  press(host, 'Enter');

  expect(host.value).toBe('verb');
  expect(inputOf(host).value).toBe('verb');
  expect(isOpen(host)).toBe(false);
  expect(inputOf(host).getAttribute('aria-expanded')).toBe('false');
  expect(changes.length).toBe(1);
});

test('commits an option on a click and closes the popup', () => {
  const host = makeCombobox();

  inputOf(host).click();
  rowsOf(host)[2].click();

  expect(host.value).toBe('adjective');
  expect(inputOf(host).value).toBe('adjective');
  expect(isOpen(host)).toBe(false);
});

test('closes on Escape without changing the selection and restores the label', () => {
  const host = makeCombobox();
  host.value = 'noun';

  inputOf(host).click();
  type(host, 'verb');
  press(host, 'Escape');

  expect(isOpen(host)).toBe(false);
  expect(host.value).toBe('noun');
  expect(inputOf(host).value).toBe('noun');
});

test('closes when a pointer goes down outside the component', () => {
  const host = makeCombobox();

  inputOf(host).click();
  document.body.dispatchEvent(
    new PointerEvent('pointerdown', { bubbles: true, composed: true }),
  );

  expect(isOpen(host)).toBe(false);
});

test('does not choose or activate a disabled option', () => {
  const host = makeCombobox(
    '<option value="noun" disabled>noun</option><option value="verb">verb</option>',
  );

  inputOf(host).click();
  expect(activeOf(host).dataset.value).toBe('verb');

  rowsOf(host)[0].click();
  expect(host.value).toBe('');

  rowsOf(host)[1].click();
  expect(host.value).toBe('verb');
});

test('skips a disabled option in the middle while moving with the arrows', () => {
  const host = makeCombobox(
    '<option value="noun">noun</option><option value="verb" disabled>verb</option><option value="adjective">adjective</option>',
  );

  press(host, 'ArrowDown');
  expect(activeOf(host).dataset.value).toBe('noun');

  press(host, 'ArrowDown');
  expect(activeOf(host).dataset.value).toBe('adjective');
});

test('jumps to the first and last option with Home and End', () => {
  const host = makeCombobox();

  press(host, 'ArrowDown');
  press(host, 'End');
  expect(activeOf(host).dataset.value).toBe('adjective');

  press(host, 'Home');
  expect(activeOf(host).dataset.value).toBe('noun');
});

test('does not fire change when the current option is committed again', () => {
  const host = makeCombobox();
  host.value = 'noun';
  const changes = [];
  host.addEventListener('change', () => changes.push(true));

  inputOf(host).click();
  rowsOf(host)[0].click();

  expect(host.value).toBe('noun');
  expect(changes.length).toBe(0);
});

test('selects the option matching the value property', () => {
  const host = makeCombobox();

  host.value = 'noun';

  expect(host.value).toBe('noun');
  expect(inputOf(host).value).toBe('noun');
  expect(rowsOf(host)[0].getAttribute('aria-selected')).toBe('true');
});

test('selects nothing when the value matches no option', () => {
  const host = makeCombobox();

  host.value = 'missing';

  expect(host.value).toBe('');
});

test('contributes name=value to the owner form', () => {
  const form = document.createElement('form');
  const host = makeCombobox();
  host.setAttribute('name', 'part');
  host.value = 'noun';
  form.append(host);
  document.body.appendChild(form);

  expect(new FormData(form).get('part')).toBe('noun');
});

test('surfaces valueMissing for a required empty selection and blocks submission', () => {
  const form = document.createElement('form');
  const host = makeCombobox();
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

test('restores the option marked selected when the owner form resets', () => {
  const form = document.createElement('form');
  const host = makeCombobox(
    '<option value="noun" selected>noun</option><option value="verb">verb</option>',
  );
  host.setAttribute('name', 'part');
  form.append(host);
  document.body.appendChild(form);

  expect(host.value).toBe('noun');

  host.value = 'verb';
  form.reset();

  expect(host.value).toBe('noun');
  expect(new FormData(form).get('part')).toBe('noun');
});

test('excludes a disabled combobox from the owner form', () => {
  const form = document.createElement('form');
  const host = makeCombobox();
  host.setAttribute('name', 'part');
  host.value = 'noun';
  host.disabled = true;
  form.append(host);
  document.body.appendChild(form);

  expect(new FormData(form).has('part')).toBe(false);
  expect(inputOf(host).disabled).toBe(true);
});

test('does not open while disabled', () => {
  const host = makeCombobox();
  host.disabled = true;

  inputOf(host).click();

  expect(isOpen(host)).toBe(false);
});

test('disables the internal input while a fieldset ancestor is disabled', async () => {
  const form = document.createElement('form');
  const fieldset = document.createElement('fieldset');
  fieldset.disabled = true;
  const host = makeCombobox();
  fieldset.append(host);
  form.append(fieldset);
  document.body.appendChild(form);
  await frame();

  expect(inputOf(host).disabled).toBe(true);

  fieldset.disabled = false;
  expect(inputOf(host).disabled).toBe(false);
});

test('bars validation while readonly but still opens for selection', () => {
  const host = makeCombobox();
  host.readOnly = true;
  host.required = true;

  expect(host.willValidate).toBe(false);
  expect(host.checkValidity()).toBe(true);

  inputOf(host).click();
  expect(isOpen(host)).toBe(true);
});

test('selects the shown label on focus so typing starts a new search', () => {
  const host = makeCombobox();
  host.value = 'noun';
  const input = inputOf(host);

  input.focus();

  expect(input.selectionStart).toBe(0);
  expect(input.selectionEnd).toBe(input.value.length);
});

test('focuses the internal input when the host is focused', async () => {
  const host = makeCombobox();
  await frame();

  host.focus();

  expect(host.shadowRoot.activeElement).toBe(inputOf(host));
});

test('is activated by a label pointing at the host', async () => {
  const label = document.createElement('label');
  label.htmlFor = 'catalog-combobox';
  const host = makeCombobox();
  host.id = 'catalog-combobox';
  document.body.append(label);
  await frame();

  expect([...host.labels]).toContain(label);

  label.click();
  expect(host.shadowRoot.activeElement).toBe(inputOf(host));
});

test('builds the rows when the light options change', async () => {
  const host = makeCombobox('<option value="noun">noun</option>');
  const added = document.createElement('option');
  added.value = 'verb';
  added.textContent = 'verb';
  host.append(added);
  await frame();

  expect(rowsOf(host).map((row) => row.dataset.value)).toEqual([
    'noun',
    'verb',
  ]);
});

test('positions the popup when it opens', () => {
  const host = makeCombobox();

  inputOf(host).click();

  expect(popupOf(host).style.left).not.toBe('');
  expect(popupOf(host).style.width).not.toBe('');
});

test('shows the empty slot default when there are no options', () => {
  const host = makeCombobox('');

  inputOf(host).click();

  const slot = emptyOf(host).querySelector('slot');
  expect(slot.name).toBe('empty');
  expect(slot.textContent).toBe('No options');
  expect(emptyOf(host).hidden).toBe(false);
});

const MULTI = `
  <option value="noun">noun</option>
  <option value="verb">verb</option>
  <option value="adjective">adjective</option>
`;

function makeMultipleCombobox(options = MULTI) {
  const host = document.createElement('yk-combobox');
  host.setAttribute('multiple', '');
  host.innerHTML = options;
  document.body.appendChild(host);
  return host;
}

const chipsOf = (host) => host.shadowRoot.querySelector('[part="chips"]');
const chipValues = (host) =>
  [...chipsOf(host).querySelectorAll('[part="chip"]')].map(
    (chip) => chip.dataset.value,
  );
const chipRemoveOf = (host, value) =>
  chipsOf(host).querySelector(
    `[part="chip"][data-value="${value}"] [part="chip-remove"]`,
  );

test('marks the listbox as multiselectable when multiple', () => {
  const host = makeMultipleCombobox();

  expect(listboxOf(host).getAttribute('aria-multiselectable')).toBe('true');
});

test('renders a chip for each selected option', () => {
  const host = makeMultipleCombobox(
    '<option value="noun" selected>noun</option><option value="verb">verb</option>',
  );

  expect(chipValues(host)).toEqual(['noun']);
  expect(chipRemoveOf(host, 'noun').getAttribute('aria-label')).toBe(
    'Remove noun',
  );
});

test('adds and removes chips while the popup stays open', () => {
  const host = makeMultipleCombobox();

  inputOf(host).click();
  rowsOf(host)[0].click();
  expect(chipValues(host)).toEqual(['noun']);
  expect(isOpen(host)).toBe(true);

  rowsOf(host)[1].click();
  expect(chipValues(host)).toEqual(['noun', 'verb']);

  rowsOf(host)[0].click();
  expect(chipValues(host)).toEqual(['verb']);
});

test('toggles options with Enter and keeps the popup open', () => {
  const host = makeMultipleCombobox();

  press(host, 'ArrowDown');
  press(host, 'Enter');
  expect(chipValues(host)).toEqual(['noun']);

  press(host, 'ArrowDown');
  press(host, 'Enter');
  expect(chipValues(host)).toEqual(['noun', 'verb']);
  expect(isOpen(host)).toBe(true);
});

test('reads and writes an array through the value property', () => {
  const host = makeMultipleCombobox();

  host.value = ['noun', 'adjective'];

  expect(host.value).toEqual(['noun', 'adjective']);
  expect(chipValues(host)).toEqual(['noun', 'adjective']);
});

test('submits one entry per selected value in option order', () => {
  const form = document.createElement('form');
  const host = makeMultipleCombobox();
  host.setAttribute('name', 'part');
  host.value = ['adjective', 'noun'];
  form.append(host);
  document.body.appendChild(form);

  expect(new FormData(form).getAll('part')).toEqual(['noun', 'adjective']);
});

test('surfaces valueMissing for a required multiple with no selection', () => {
  const host = makeMultipleCombobox();
  host.required = true;

  expect(host.validity.valueMissing).toBe(true);

  host.value = ['noun'];

  expect(host.checkValidity()).toBe(true);
});

test('removes a chip through its remove button', () => {
  const host = makeMultipleCombobox();
  host.value = ['noun', 'verb'];
  const changes = [];
  host.addEventListener('change', () => changes.push(true));

  chipRemoveOf(host, 'noun').click();

  expect(chipValues(host)).toEqual(['verb']);
  expect(host.value).toEqual(['verb']);
  expect(changes.length).toBe(1);
});

test('removes the last chip on Backspace while the input is empty', () => {
  const host = makeMultipleCombobox();
  host.value = ['noun', 'verb'];
  inputOf(host).focus();

  press(host, 'Backspace');

  expect(chipValues(host)).toEqual(['noun']);
});

test('restores the options marked selected when the form resets', () => {
  const form = document.createElement('form');
  const host = makeMultipleCombobox(
    '<option value="noun" selected>noun</option><option value="verb">verb</option><option value="adjective">adjective</option>',
  );
  host.setAttribute('name', 'part');
  form.append(host);
  document.body.appendChild(form);

  host.value = ['verb', 'adjective'];
  form.reset();

  expect(host.value).toEqual(['noun']);
});

test('is activated by a label pointing at the host in multiple mode', async () => {
  const label = document.createElement('label');
  label.htmlFor = 'catalog-combobox-multi';
  const host = makeMultipleCombobox();
  host.id = 'catalog-combobox-multi';
  host.value = ['noun'];
  document.body.append(label);
  await frame();

  label.click();

  expect(host.shadowRoot.activeElement).toBe(inputOf(host));
});

test('rebuilds the form payload when the name changes after a selection', () => {
  const form = document.createElement('form');
  const host = makeMultipleCombobox();
  host.value = ['noun', 'verb'];
  form.append(host);
  document.body.appendChild(form);

  host.setAttribute('name', 'parts');

  expect(new FormData(form).getAll('parts')).toEqual(['noun', 'verb']);
});

test('marks only one row when several options share a value', () => {
  const host = makeMultipleCombobox(
    '<option value="noun">noun</option><option value="noun">noun again</option><option value="verb">verb</option>',
  );

  host.value = ['noun'];

  expect(chipValues(host)).toEqual(['noun']);
  expect(
    rowsOf(host).filter((row) => row.getAttribute('aria-selected') === 'true')
      .length,
  ).toBe(1);
});

test('keeps the current selection when multiple is added', () => {
  const host = makeCombobox();
  host.value = 'verb';

  host.multiple = true;

  expect(host.value).toEqual(['verb']);
  expect(chipValues(host)).toEqual(['verb']);
});

test('does not mirror required onto the query input in multiple mode', () => {
  const host = makeMultipleCombobox();
  host.required = true;

  expect(inputOf(host).required).toBe(false);
  expect(host.validity.valueMissing).toBe(true);

  host.value = ['noun'];

  expect(inputOf(host).required).toBe(false);
  expect(host.checkValidity()).toBe(true);
});

test('keeps required on the input in single mode', () => {
  const host = makeCombobox();
  host.required = true;

  expect(inputOf(host).required).toBe(true);
});

test('does not mirror required onto the input in multiple mode after reset', () => {
  const form = document.createElement('form');
  const host = makeMultipleCombobox(
    '<option value="noun" selected>noun</option><option value="verb">verb</option>',
  );
  host.setAttribute('name', 'part');
  host.required = true;
  form.append(host);
  document.body.appendChild(form);

  form.reset();

  expect(inputOf(host).required).toBe(false);
  expect(host.value).toEqual(['noun']);
  expect(host.checkValidity()).toBe(true);
});

test('localizes the chip remove label through the remove-label slot', () => {
  const host = makeMultipleCombobox();
  const localized = document.createElement('span');
  localized.slot = 'remove-label';
  localized.textContent = '삭제';
  host.append(localized);

  host.value = ['noun'];

  expect(chipRemoveOf(host, 'noun').getAttribute('aria-label')).toBe(
    '삭제 noun',
  );
});

test('shows an overflow affordance when the chips exceed the field', async () => {
  const options = Array.from(
    { length: 12 },
    (_, index) => `<option value="o${index}">option ${index}</option>`,
  ).join('');
  const host = makeMultipleCombobox(options);
  host.style.setProperty('--yk-combobox-chips-max-height', '0.5rem');
  host.value = Array.from({ length: 12 }, (_, index) => `o${index}`);
  await frame();

  expect(chipsOf(host).hasAttribute('data-overflow')).toBe(true);
});

test('keeps the first selection and drops the chips when multiple is removed', () => {
  const host = makeMultipleCombobox();
  host.value = ['noun', 'verb'];

  host.removeAttribute('multiple');

  expect(host.value).toBe('noun');
  expect(chipValues(host)).toEqual([]);
});

function makeExternalCombobox(options = MULTI) {
  const host = document.createElement('yk-combobox');
  host.setAttribute('filter', 'external');
  host.innerHTML = options;
  document.body.appendChild(host);
  return host;
}

test('does not filter rows when external filtering is requested', () => {
  const host = makeExternalCombobox();

  inputOf(host).click();
  type(host, 'zzz');

  expect(visibleRowsOf(host).map((row) => row.dataset.value)).toEqual([
    'noun',
    'verb',
    'adjective',
  ]);
});

test('dispatches yk-combobox-filter with the query as the user types', () => {
  const host = makeExternalCombobox();
  const queries = [];
  host.addEventListener('yk-combobox-filter', (event) =>
    queries.push(event.detail.query),
  );

  inputOf(host).click();
  type(host, 'ver');

  expect(queries.at(-1)).toBe('ver');
});

test('dispatches yk-combobox-filter with an empty query when it opens', () => {
  const host = makeExternalCombobox();
  const queries = [];
  host.addEventListener('yk-combobox-filter', (event) =>
    queries.push(event.detail.query),
  );

  inputOf(host).click();

  expect(queries).toEqual(['']);
});

test('keeps the popup open with the empty state while results load', async () => {
  const host = makeExternalCombobox('<option value="noun">noun</option>');
  inputOf(host).click();
  const filtered = [];
  host.addEventListener('yk-combobox-filter', (event) => {
    filtered.push(event.detail.query);
    host.replaceChildren();
  });
  type(host, 'xyz');
  await frame();

  expect(rowsOf(host).length).toBe(0);
  expect(emptyOf(host).hidden).toBe(false);
  expect(isOpen(host)).toBe(true);
  expect(filtered).toEqual(['xyz']);
});

test('shows options the consumer adds while external filtering is active', async () => {
  const host = makeExternalCombobox('<option value="noun">noun</option>');
  host.addEventListener('yk-combobox-filter', () => {
    const option = document.createElement('option');
    option.value = 'verb';
    option.textContent = 'verb';
    host.append(option);
  });
  inputOf(host).click();
  type(host, 'v');
  await frame();

  expect(visibleRowsOf(host).map((row) => row.dataset.value)).toContain('verb');
});

test('reports the current value in the filter event so it can be kept', () => {
  const host = makeExternalCombobox();
  const details = [];
  host.addEventListener('yk-combobox-filter', (event) =>
    details.push(event.detail),
  );
  inputOf(host).click();
  rowsOf(host)[0].click();

  type(host, 'v');

  expect(details.at(-1)).toEqual({ query: 'v', value: 'noun' });
});

test('notifies the consumer when external filtering is switched on while open', () => {
  const host = makeCombobox();
  inputOf(host).click();
  type(host, 'no');
  const queries = [];
  host.addEventListener('yk-combobox-filter', (event) =>
    queries.push(event.detail.query),
  );

  host.filter = 'external';

  expect(queries).toEqual(['no']);
});

test('normalizes an unknown filter value to client', () => {
  const host = makeCombobox();

  host.filter = 'bogus';

  expect(host.filter).toBe('client');
  expect(host.getAttribute('filter')).toBe('client');
});

test('exposes the filter mode through a property', () => {
  const host = makeExternalCombobox();

  expect(host.filter).toBe('external');

  host.filter = 'client';

  expect(host.filter).toBe('client');
  expect(host.getAttribute('filter')).toBe('client');
});

test('toggles options under external filtering when multiple', () => {
  const host = makeMultipleCombobox();
  host.filter = 'external';

  inputOf(host).click();
  type(host, 'noun');
  rowsOf(host)[0].click();

  expect(chipValues(host)).toEqual(['noun']);
  expect(visibleRowsOf(host).length).toBe(3);
});

test('styles the face like the Bootstrap form control', async () => {
  const host = makeCombobox();
  await frame();

  const style = getComputedStyle(fieldOf(host));
  expect(style.display).toBe('flex');
  expect(style.boxSizing).toBe('border-box');
  expect(style.backgroundColor).toBe('rgb(255, 255, 255)');
  expect(style.borderTopWidth).toBe('1px');
  expect(style.borderTopLeftRadius).toBe('6px');
  expect(style.paddingTop).toBe('6px');
});

test('restyles the face through the component tokens', async () => {
  const host = makeCombobox();
  host.style.setProperty('--yk-input-bg', 'rgb(9, 8, 7)');
  host.style.setProperty('--yk-input-border-color', 'rgb(3, 2, 1)');
  await frame();

  const style = getComputedStyle(fieldOf(host));
  expect(style.backgroundColor).toBe('rgb(9, 8, 7)');
  expect(style.borderTopColor).toBe('rgb(3, 2, 1)');
});
