/**
 * File picker that renders a bordered drag-and-drop area backed by a native
 * `<input type="file">` kept in Shadow DOM, following the DADS file-upload
 * pattern: clicking the zone (except its remove buttons) opens the picker,
 * files dropped
 * anywhere in the zone are selected, and chosen files are listed with
 * per-file remove buttons. The native input stays in the tree for keyboard
 * focus, label activation, and form semantics but is visually hidden.
 *
 * The host is form-associated: selected files are contributed to the owner
 * form as File entries (one entry per file with `multiple`), the internal
 * input's constraint validation (`required`) is mirrored through
 * ElementInternals so an empty required field blocks submission and matches
 * `:invalid`, and disabled form/fieldset ancestors are supported. Selected
 * files are exposed through the read-only `files` property, and `value`
 * behaves like a native file input: it reports the fakepath string and
 * rejects non-empty assignments. The host is labelable, so `<label for>`
 * opens the picker. The `accept` filter applies to drops as well as to the
 * picker. On a single-select field a new selection or drop replaces the
 * previous files, like a native input.
 *
 * Button, hint, and remove-verb labels localize through the `browse`, `hint`,
 * and `remove-label` slots.
 *
 * ```html
 * <script type="module" src="./index.js"></script>
 * <label for="avatar">Avatar</label>
 * <yk-input-file id="avatar" name="avatar" accept="image/*" required></yk-input-file>
 * ```
 *
 * ```html
 * <yk-input-file name="docs" multiple>
 *   <span slot="browse">ファイルを選択</span>
 *   <span slot="hint">またはここにドロップ</span>
 *   <span slot="remove-label">削除</span>
 * </yk-input-file>
 * ```
 */
import { YKInputElement } from './input-base.js';
import fileSheet from './yk-input-file.css' with { type: 'css' };

class YKInputFile extends YKInputElement {
  static inputType = 'file';

  // File inputs have no string value, placeholder, or length/pattern
  // constraints; only picker-related and validation attributes are mirrored.
  static inputAttributes = ['accept', 'multiple', 'required'];

  #zone;

  #dragDepth = 0;

  constructor() {
    super();
    const shadowRoot = this.shadowRoot;
    shadowRoot.adoptedStyleSheets.push(fileSheet);
    this.#zone = this.#buildZone();
    shadowRoot.append(this.#zone);
    // The base swaps in a fresh input on form reset, so the change listener
    // rides on the shadow root instead of one input instance.
    shadowRoot.addEventListener('change', () => this.#renderFileList());
    this.#wireDropzone();
  }

  // Static markup only; slotted light DOM and file names are added later.
  // The remove-label slot is hidden — it is a label data source, not a
  // visible element.
  #buildZone() {
    const template = document.createElement('template');
    template.innerHTML = `
      <div part="dropzone">
        <slot name="browse">Choose file</slot>
        <slot name="hint">or drag and drop files here</slot>
        <slot name="remove-label" hidden>Remove</slot>
        <ul part="file-list"></ul>
      </div>
    `;
    return template.content.firstElementChild;
  }

  get accept() {
    return this.getAttribute('accept') ?? '';
  }

  set accept(value) {
    this.setAttribute('accept', value);
  }

  get multiple() {
    return this.hasAttribute('multiple');
  }

  set multiple(value) {
    this.toggleAttribute('multiple', value);
  }

  get files() {
    return this.#internalInput.files;
  }

  // The getter must be overridden together with the setter: a setter-only
  // override shadows the base getter and value reads would return undefined.
  // The setter re-renders because programmatic clearing fires no change
  // event for the shadow-root listener to catch.
  get value() {
    return super.value;
  }

  set value(value) {
    super.value = value;
    this.#renderFileList();
  }

  formValue() {
    // Subclass private members are not installed while the base constructor
    // runs, so this must not read through the #internalInput getter.
    const files = this.shadowRoot.querySelector('input').files;
    // Like a native nameless control, a nameless host contributes no entry,
    // even with files selected.
    if (files.length === 0 || this.name === '') {
      return null;
    }
    if (files.length === 1) {
      return files[0];
    }
    const data = new FormData();
    for (const file of files) {
      data.append(this.name, file);
    }
    return data;
  }

  formResetCallback() {
    super.formResetCallback();
    this.#renderFileList();
  }

  get #internalInput() {
    return this.shadowRoot.querySelector('input');
  }

  // Drag listeners live on the zone. dragenter/dragleave pair with a depth
  // counter because they fire on the zone's descendants too; a plain toggle
  // would flicker as the pointer crosses child elements. Only file drags
  // count: text or element drags neither highlight nor reset the counter.
  #wireDropzone() {
    const zone = this.#zone;
    zone.addEventListener('click', (event) => {
      if (event.target.closest('button')) return;
      this.#internalInput.click();
    });
    zone.addEventListener('dragenter', (event) => {
      if (this.#internalInput.disabled || !this.#carriesFiles(event)) return;
      this.#dragDepth += 1;
      zone.classList.add('dragover');
    });
    zone.addEventListener('dragover', (event) => {
      // Preventing the default is what stops the browser from navigating to
      // the dropped file, so it stays on even for rejected drops.
      event.preventDefault();
      if (this.#carriesFiles(event)) {
        event.dataTransfer.dropEffect = 'copy';
      }
    });
    zone.addEventListener('dragleave', () => {
      this.#dragDepth -= 1;
      if (this.#dragDepth <= 0) {
        this.#dragDepth = 0;
        zone.classList.remove('dragover');
      }
    });
    zone.addEventListener('drop', (event) => {
      event.preventDefault();
      this.#dragDepth = 0;
      zone.classList.remove('dragover');
      if (this.#internalInput.disabled) return;
      const files = event.dataTransfer?.files;
      if (files && files.length > 0) {
        this.#setFiles(files);
      }
    });
  }

  #carriesFiles(event) {
    return event.dataTransfer?.types.includes('Files') ?? false;
  }

  // Replaces the whole selection — the native behavior for picker picks and,
  // per DADS-style drop areas, for drops on both single and multiple fields.
  // Drops fire input and change, the same pair a picker selection fires.
  #setFiles(fileList) {
    const accepted = Array.from(fileList).filter((file) =>
      this.#acceptsFile(file),
    );
    if (accepted.length === 0) return;
    const transfer = new DataTransfer();
    if (this.multiple) {
      for (const file of accepted) {
        transfer.items.add(file);
      }
    } else {
      transfer.items.add(accepted[0]);
    }
    this.#internalInput.files = transfer.files;
    this.#emitSelectionEvents();
  }

  // The platform does not enforce accept on programmatic files assignment,
  // so the zone re-applies the picker dialog's own rule to dropped files:
  // an entry matches on exact extension, exact MIME type, or wildcard type.
  #acceptsFile(file) {
    const accept = this.#internalInput.accept;
    if (!accept) return true;
    const types = accept.split(',').map((type) => type.trim().toLowerCase());
    const extension = file.name.includes('.')
      ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
      : '';
    const mime = file.type.toLowerCase();
    return types.some(
      (type) =>
        type === extension ||
        type === mime ||
        (type.endsWith('/*') && mime.startsWith(type.slice(0, -1))),
    );
  }

  #emitSelectionEvents() {
    for (const type of ['input', 'change']) {
      this.#internalInput.dispatchEvent(
        new Event(type, { bubbles: true, composed: true }),
      );
    }
  }

  // Rebuilds the file list from the internal input's FileList. The list
  // markup is regenerated wholesale: file entries hold no local state beyond
  // the name, so reconciliation would only add bookkeeping. The guard is
  // defensive insurance: no caller should reach this before the subclass
  // fields are initialized.
  #renderFileList() {
    if (!(#zone in this) || !this.#zone) return;
    const list = this.#zone.querySelector('ul');
    list.replaceChildren();
    for (const file of this.#internalInput.files) {
      const item = document.createElement('li');
      item.setAttribute('part', 'file-item');
      const name = document.createElement('span');
      name.setAttribute('part', 'file-name');
      name.textContent = file.name;
      const remove = document.createElement('button');
      remove.setAttribute('part', 'remove');
      remove.type = 'button';
      remove.setAttribute('aria-label', `${this.#removeLabel()} ${file.name}`);
      remove.textContent = '×';
      remove.addEventListener('click', () => {
        const transfer = new DataTransfer();
        for (const kept of this.#internalInput.files) {
          if (kept !== file) {
            transfer.items.add(kept);
          }
        }
        this.#internalInput.files = transfer.files;
        this.#emitSelectionEvents();
      });
      item.append(name, remove);
      list.append(item);
    }
  }

  // The remove verb localizes through the remove-label slot; assigned light
  // DOM text wins over the fallback text.
  #removeLabel() {
    const slot = this.#zone.querySelector('slot[name=remove-label]');
    const assigned = slot.assignedNodes().find((node) => node.textContent);
    return (assigned?.textContent ?? slot.textContent).trim();
  }
}

if (!customElements.get('yk-input-file')) {
  customElements.define('yk-input-file', YKInputFile);
}
