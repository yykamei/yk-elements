/**
 * File picker that renders a native `<input type="file">` kept in Shadow DOM
 * with Bootstrap's form-control face, including the built-in file selector
 * button styled like the default yk-button face.
 *
 * The host is form-associated: selected files are contributed to the owner
 * form as File entries (one entry per file with `multiple`), the internal
 * input's constraint validation (`required`) is mirrored through
 * ElementInternals so an empty required field blocks submission and matches
 * `:invalid`, and disabled form/fieldset ancestors are supported. Selected
 * files are exposed through the read-only `files` property, and `value`
 * behaves like a native file input: it reports the fakepath string and
 * rejects non-empty assignments. The host is labelable, so `<label for>`
 * opens the picker.
 *
 * ```html
 * <script type="module" src="./index.js"></script>
 * <label for="avatar">Avatar</label>
 * <yk-input-file id="avatar" name="avatar" accept="image/*" required></yk-input-file>
 * ```
 */
import { YKInputElement } from './input-base.js';
import fileSheet from './yk-input-file.css' with { type: 'css' };

class YKInputFile extends YKInputElement {
  static inputType = 'file';

  // File inputs have no string value, placeholder, or length/pattern
  // constraints; only picker-related and validation attributes are mirrored.
  static inputAttributes = ['accept', 'multiple', 'required'];

  constructor() {
    super();
    this.shadowRoot.adoptedStyleSheets.push(fileSheet);
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
    return this.shadowRoot.querySelector('input').files;
  }

  formValue() {
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
}

if (!customElements.get('yk-input-file')) {
  customElements.define('yk-input-file', YKInputFile);
}
