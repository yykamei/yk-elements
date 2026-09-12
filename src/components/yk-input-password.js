/**
 * Single-line password field that renders a native `<input type="password">`
 * kept in Shadow DOM with Bootstrap's form-control face.
 *
 * The host is form-associated: it contributes `name=value` to the owner form,
 * mirrors the internal input's constraint validation (maxlength, minlength,
 * pattern, required) through ElementInternals so invalid values block
 * submission and match `:invalid`, and supports form reset and disabled
 * form/fieldset ancestors. Like the native password input, no syntax check
 * constrains the value (use `pattern` instead) and CR/LF characters are
 * stripped from the value. The `autocomplete` attribute (for example
 * `current-password` or `new-password`) and the `inputmode` attribute (for
 * example `numeric` for a PIN) are mirrored so password managers and virtual
 * keyboards react as they do on a native password field. The `value`
 * attribute stays the default restored by reset, while the `value` property
 * holds the live value like a native input. The host is labelable, so
 * `<label for>` focuses it.
 *
 * ```html
 * <script type="module" src="./index.js"></script>
 * <label for="secret">Password</label>
 * <yk-input-password id="secret" name="password" minlength="8" autocomplete="current-password" required></yk-input-password>
 * ```
 */
import { YKInputElement } from './input-base.js';

class YKInputPassword extends YKInputElement {
  static inputType = 'password';

  static inputAttributes = [
    ...YKInputElement.inputAttributes,
    'autocomplete',
    'inputmode',
  ];

  get autocomplete() {
    return this.getAttribute('autocomplete') ?? '';
  }

  set autocomplete(value) {
    this.setAttribute('autocomplete', value);
  }

  get inputMode() {
    return this.getAttribute('inputmode') ?? '';
  }

  set inputMode(value) {
    this.setAttribute('inputmode', value);
  }
}

if (!customElements.get('yk-input-password')) {
  customElements.define('yk-input-password', YKInputPassword);
}
