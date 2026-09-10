/**
 * Single-line email field that renders a native `<input type="email">` kept in
 * Shadow DOM with Bootstrap's form-control face.
 *
 * The host is form-associated: it contributes `name=value` to the owner form,
 * mirrors the internal input's constraint validation (maxlength, minlength,
 * pattern, required, multiple) through ElementInternals so invalid emails
 * block submission and match `:invalid`, and supports form reset and disabled
 * form/fieldset ancestors. The browser's own email syntax check (including
 * per-address validation of a comma-separated list when `multiple` is set)
 * surfaces as typeMismatch. The `value` attribute stays the default restored
 * by reset, while the `value` property holds the live value like a native
 * input. The host is labelable, so `<label for>` focuses it.
 *
 * ```html
 * <script type="module" src="./index.js"></script>
 * <label for="mail">Email</label>
 * <yk-input-email id="mail" name="email" required placeholder="you@example.com"></yk-input-email>
 * ```
 */
import { YKInputElement } from './input-base.js';

class YKInputEmail extends YKInputElement {
  static inputType = 'email';

  static inputAttributes = [...YKInputElement.inputAttributes, 'multiple'];

  get multiple() {
    return this.hasAttribute('multiple');
  }

  set multiple(value) {
    this.toggleAttribute('multiple', value);
  }
}

if (!customElements.get('yk-input-email')) {
  customElements.define('yk-input-email', YKInputEmail);
}
