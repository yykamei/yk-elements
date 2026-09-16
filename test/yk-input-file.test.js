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
  // A real picker fires both events per file selection.
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
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
  // Programmatic clearing fires no change event, so the setter itself must
  // keep the list in step.
  expect(host.shadowRoot.querySelectorAll('[part=file-item]').length).toBe(0);
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

test('dims the dropzone while the field is disabled', async () => {
  const enabled = hostOf();
  const disabled = hostOf();
  disabled.disabled = true;
  const fieldsetDisabled = hostOf();
  const fieldset = document.createElement('fieldset');
  fieldset.disabled = true;
  fieldset.append(fieldsetDisabled);
  document.body.append(enabled, disabled, fieldset);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  // Both the disabled attribute and a disabled fieldset ancestor go through
  // the internal input's disabled state.
  expect(getComputedStyle(zoneOf(enabled)).opacity).toBe('1');
  expect(getComputedStyle(zoneOf(disabled)).opacity).not.toBe('1');
  expect(getComputedStyle(zoneOf(fieldsetDisabled)).opacity).not.toBe('1');
});

test('restyles the file items through the component tokens', async () => {
  const host = hostOf();
  host.style.setProperty('--yk-input-color', 'rgb(6, 5, 4)');
  host.style.setProperty('--yk-input-border-color', 'rgb(3, 2, 1)');
  host.style.setProperty('--yk-input-radius', '2px');
  document.body.appendChild(host);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  selectFiles(inputOf(host), [fileOf('a.txt')]);
  const style = getComputedStyle(
    host.shadowRoot.querySelector('[part=file-item]'),
  );
  expect(style.color).toBe('rgb(6, 5, 4)');
  expect(style.borderTopColor).toBe('rgb(3, 2, 1)');
  expect(style.borderTopLeftRadius).toBe('2px');
});

// --- dropzone ---

const zoneOf = (host) => host.shadowRoot.querySelector('[part=dropzone]');

const fileTransfer = () => {
  const transfer = new DataTransfer();
  transfer.items.add(fileOf('drag.txt'));
  return transfer;
};

const dragOver = (zone) => {
  zone.dispatchEvent(
    new DragEvent('dragenter', { bubbles: true, dataTransfer: fileTransfer() }),
  );
  zone.dispatchEvent(
    new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
      dataTransfer: fileTransfer(),
    }),
  );
};

const dropTransfer = (files) => {
  const transfer = new DataTransfer();
  for (const file of files) {
    transfer.items.add(file);
  }
  return transfer;
};

const dropFiles = (zone, files) => {
  zone.dispatchEvent(
    new DragEvent('drop', {
      bubbles: true,
      cancelable: true,
      dataTransfer: dropTransfer(files),
    }),
  );
};

const dragText = (zone, type) => {
  const transfer = new DataTransfer();
  transfer.setData('text/plain', 'not a file');
  zone.dispatchEvent(
    new DragEvent(type, { bubbles: true, dataTransfer: transfer }),
  );
};

test('visually hides the native input and renders the dropzone', async () => {
  const host = hostOf();
  document.body.appendChild(host);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const zone = zoneOf(host);
  expect(zone).not.toBeNull();
  const inputStyle = getComputedStyle(inputOf(host));
  expect(inputStyle.position).toBe('absolute');
  expect(inputStyle.clipPath).not.toBe('none');
  expect(zone.querySelector('slot[name=browse]')).not.toBeNull();
  expect(zone.querySelector('slot[name=hint]')).not.toBeNull();
  expect(zone.querySelector('[part=file-list]')).not.toBeNull();
});

test('renders default English labels when the slots are empty', async () => {
  const host = hostOf();
  document.body.appendChild(host);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const zone = zoneOf(host);
  expect(zone.querySelector('slot[name=browse]').textContent).toContain(
    'Choose file',
  );
  expect(zone.querySelector('slot[name=hint]').textContent).toContain(
    'or drag and drop',
  );
});

test('renders slotted label text for localization', async () => {
  const host = hostOf();
  const browse = document.createElement('span');
  browse.slot = 'browse';
  browse.textContent = 'ファイルを選択';
  const hint = document.createElement('span');
  hint.slot = 'hint';
  hint.textContent = 'またはここにファイルをドロップ';
  host.append(browse, hint);
  document.body.appendChild(host);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const zone = zoneOf(host);
  expect(zone.querySelector('slot[name=browse]').assignedNodes()[0]).toBe(
    browse,
  );
  expect(zone.querySelector('slot[name=hint]').assignedNodes()[0]).toBe(hint);
});

test('clicking the dropzone opens the file picker', async () => {
  const host = hostOf();
  document.body.appendChild(host);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  let opened = false;
  inputOf(host).addEventListener('click', (event) => {
    // Chromium would otherwise surface a file dialog in headed runs.
    event.preventDefault();
    opened = true;
  });
  zoneOf(host).querySelector('slot[name=browse]').click();

  expect(opened).toBe(true);
});

test('clicking a remove button does not open the picker', async () => {
  const host = hostOf();
  host.setAttribute('multiple', '');
  document.body.appendChild(host);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  selectFiles(inputOf(host), [fileOf('a.txt'), fileOf('b.txt')]);
  let opened = false;
  inputOf(host).addEventListener('click', (event) => {
    event.preventDefault();
    opened = true;
  });

  host.shadowRoot
    .querySelectorAll('[part=file-item]')[0]
    .querySelector('button')
    .click();

  expect(opened).toBe(false);
  expect(host.files.length).toBe(1);
  expect(host.files[0].name).toBe('b.txt');
});

test('drops set the files like a selection', async () => {
  const form = document.createElement('form');
  const host = hostOf();
  host.setAttribute('name', 'attachment');
  form.append(host);
  document.body.appendChild(form);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  dropFiles(zoneOf(host), [fileOf('dropped.txt')]);

  expect(host.files.length).toBe(1);
  expect(host.files[0].name).toBe('dropped.txt');
  const submitted = new FormData(form).getAll('attachment');
  expect(submitted.map((file) => file.name)).toEqual(['dropped.txt']);
});

test('lists each selected file with a remove button', async () => {
  const host = hostOf();
  host.setAttribute('multiple', '');
  document.body.appendChild(host);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  selectFiles(inputOf(host), [fileOf('a.txt'), fileOf('b.txt')]);

  const items = [...host.shadowRoot.querySelectorAll('[part=file-item]')];
  expect(
    items.map((item) =>
      item.querySelector('[part=file-name]').textContent.trim(),
    ),
  ).toEqual(['a.txt', 'b.txt']);
  for (const item of items) {
    expect(item.querySelector('button')).not.toBeNull();
  }
});

test('the remove button clears that file and updates the form value', async () => {
  const form = document.createElement('form');
  const host = hostOf();
  host.setAttribute('name', 'attachment');
  host.setAttribute('multiple', '');
  form.append(host);
  document.body.appendChild(form);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  selectFiles(inputOf(host), [fileOf('a.txt'), fileOf('b.txt')]);
  const items = [...host.shadowRoot.querySelectorAll('[part=file-item]')];
  items[0].querySelector('button').click();

  expect(host.files.length).toBe(1);
  expect(host.files[0].name).toBe('b.txt');
  expect(new FormData(form).getAll('attachment').map((f) => f.name)).toEqual([
    'b.txt',
  ]);
});

test('removing the last file empties the field and restores valueMissing', async () => {
  const form = document.createElement('form');
  const host = hostOf();
  host.setAttribute('name', 'attachment');
  host.required = true;
  form.append(host);
  document.body.appendChild(form);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  selectFiles(inputOf(host), [fileOf('a.txt')]);
  expect(host.checkValidity()).toBe(true);

  const item = host.shadowRoot.querySelector('[part=file-item]');
  item.querySelector('button').click();

  expect(host.files.length).toBe(0);
  expect(host.validity.valueMissing).toBe(true);
  expect(new FormData(form).has('attachment')).toBe(false);
});

test('a drop on a single-select field replaces the previous selection', async () => {
  const host = hostOf();
  document.body.appendChild(host);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  selectFiles(inputOf(host), [fileOf('first.txt')]);
  dropFiles(zoneOf(host), [fileOf('second.txt')]);

  expect(host.files.length).toBe(1);
  expect(host.files[0].name).toBe('second.txt');
});

test('a drop while multiple replaces the whole selection too', async () => {
  const host = hostOf();
  host.setAttribute('multiple', '');
  document.body.appendChild(host);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  selectFiles(inputOf(host), [fileOf('a.txt')]);
  dropFiles(zoneOf(host), [fileOf('b.txt'), fileOf('c.txt')]);

  expect([...host.files].map((file) => file.name)).toEqual(['b.txt', 'c.txt']);
});

test('dragover highlights the dropzone and drop clears it', async () => {
  const host = hostOf();
  document.body.appendChild(host);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const zone = zoneOf(host);
  dragOver(zone);
  expect(zone.classList.contains('dragover')).toBe(true);

  dropFiles(zone, [fileOf('a.txt')]);
  expect(zone.classList.contains('dragover')).toBe(false);
});

test('dragleave clears the highlight without dropping', async () => {
  const host = hostOf();
  document.body.appendChild(host);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const zone = zoneOf(host);
  dragOver(zone);
  zone.dispatchEvent(new DragEvent('dragleave', { bubbles: true }));
  expect(zone.classList.contains('dragover')).toBe(false);
  expect(host.files.length).toBe(0);
});

test('does not accept drops while disabled', async () => {
  const host = hostOf();
  host.disabled = true;
  document.body.appendChild(host);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  dropFiles(zoneOf(host), [fileOf('a.txt')]);

  expect(host.files.length).toBe(0);
  expect(zoneOf(host).classList.contains('dragover')).toBe(false);
});

test('does not highlight or accept drags that carry no files', async () => {
  const host = hostOf();
  document.body.appendChild(host);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const zone = zoneOf(host);
  dragText(zone, 'dragenter');
  dragText(zone, 'dragover');
  expect(zone.classList.contains('dragover')).toBe(false);

  dragText(zone, 'drop');
  expect(host.files.length).toBe(0);
});

test('keeps the highlight while the pointer crosses child elements', async () => {
  const host = hostOf();
  document.body.appendChild(host);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const zone = zoneOf(host);
  zone.dispatchEvent(
    new DragEvent('dragenter', { bubbles: true, dataTransfer: fileTransfer() }),
  );
  const child = zone.querySelector('slot[name=hint]');
  child.dispatchEvent(
    new DragEvent('dragenter', { bubbles: true, dataTransfer: fileTransfer() }),
  );
  child.dispatchEvent(new DragEvent('dragleave', { bubbles: true }));
  expect(zone.classList.contains('dragover')).toBe(true);

  zone.dispatchEvent(new DragEvent('dragleave', { bubbles: true }));
  expect(zone.classList.contains('dragover')).toBe(false);
});

test('applies the accept filter to dropped files', async () => {
  const host = hostOf();
  host.setAttribute('accept', 'image/*');
  document.body.appendChild(host);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const zone = zoneOf(host);
  dropFiles(zone, [fileOf('notes.txt')]);
  expect(host.files.length).toBe(0);

  dropFiles(zone, [fileOf('photo.png', 'image/png')]);
  expect(host.files.length).toBe(1);
  expect(host.files[0].name).toBe('photo.png');
});

test('localizes the remove verb through the remove-label slot', async () => {
  const host = hostOf();
  const label = document.createElement('span');
  label.slot = 'remove-label';
  label.textContent = '削除';
  host.append(label);
  document.body.appendChild(host);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  selectFiles(inputOf(host), [fileOf('a.txt')]);
  const remove = host.shadowRoot.querySelector('[part=remove]');
  expect(remove.getAttribute('aria-label')).toBe('削除 a.txt');
});

test('labels the remove buttons with the default verb', async () => {
  const host = hostOf();
  document.body.appendChild(host);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  selectFiles(inputOf(host), [fileOf('a.txt')]);
  const remove = host.shadowRoot.querySelector('[part=remove]');
  expect(remove.getAttribute('aria-label')).toBe('Remove a.txt');
});

test('form reset clears the list and selection', async () => {
  const form = document.createElement('form');
  const host = hostOf();
  host.setAttribute('name', 'attachment');
  form.append(host);
  document.body.appendChild(form);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  selectFiles(inputOf(host), [fileOf('a.txt')]);
  form.reset();

  expect(host.files.length).toBe(0);
  expect(host.shadowRoot.querySelectorAll('[part=file-item]').length).toBe(0);
});

test('the dropzone face is styleable through component tokens', async () => {
  const host = hostOf();
  host.style.setProperty('--yk-input-dropzone-bg', 'rgb(1, 2, 3)');
  host.style.setProperty('--yk-input-dropzone-border-color', 'rgb(4, 5, 6)');
  host.style.setProperty('--yk-input-dropzone-radius', '8px');
  document.body.appendChild(host);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const style = getComputedStyle(zoneOf(host));
  expect(style.backgroundColor).toBe('rgb(1, 2, 3)');
  expect(style.borderTopColor).toBe('rgb(4, 5, 6)');
  expect(style.borderTopLeftRadius).toBe('8px');
});

test('the dragover face is styleable through a component token', async () => {
  const host = hostOf();
  host.style.setProperty('--yk-input-dropzone-dragover-bg', 'rgb(7, 8, 9)');
  document.body.appendChild(host);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const zone = zoneOf(host);
  dragOver(zone);
  // The face transitions its background, so wait for the transition to end
  // before reading the settled computed value.
  await new Promise((resolve) =>
    zone.addEventListener('transitionend', resolve, { once: true }),
  );
  expect(getComputedStyle(zone).backgroundColor).toBe('rgb(7, 8, 9)');
});
