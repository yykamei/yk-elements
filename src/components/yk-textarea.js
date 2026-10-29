/**
 * Multi-line text field that renders a native `<textarea>` kept in Shadow DOM
 * with the shared Bootstrap form-control face.
 *
 * The host carries the same form behavior as the `yk-input-*` fields: it is
 * form-associated, mirrors the internal textarea's constraint validation
 * (maxlength, minlength, required) through ElementInternals, keeps the `value`
 * attribute as the default restored by form reset while the `value` property
 * holds the live value, supports disabled form/fieldset ancestors, and is
 * labelable. `rows` sets the visible height, and there is no `pattern`
 * attribute because a native textarea has no pattern constraint. The field
 * resizes vertically only, so a drag cannot widen it past the width it is
 * given.
 *
 * ```html
 * <script type="module" src="./index.js"></script>
 * <label for="meaning">Meaning</label>
 * <yk-textarea id="meaning" name="meaning" rows="4" placeholder="In English"></yk-textarea>
 * ```
 */
import { YKFieldElement } from './field-base.js';

class YKTextarea extends YKFieldElement {
  static inputAttributes = [
    'value',
    'placeholder',
    'maxlength',
    'minlength',
    'required',
    'readonly',
    'rows',
  ];

  static controlProperties = { value: 'defaultValue' };

  createControl() {
    const textarea = document.createElement('textarea');
    textarea.setAttribute('part', 'textarea');
    return textarea;
  }

  // Read through the shadow root rather than a private field because the base
  // constructor routes pre-upgrade writes through this accessor before
  // subclass fields are installed (see field-base.js).
  get rows() {
    return this.shadowRoot.querySelector('textarea').rows;
  }

  set rows(value) {
    this.setAttribute('rows', String(value));
  }
}

if (!customElements.get('yk-textarea')) {
  customElements.define('yk-textarea', YKTextarea);
}
