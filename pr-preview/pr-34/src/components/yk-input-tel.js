/**
 * Single-line telephone number field that renders a native `<input type="tel">`
 * kept in Shadow DOM with Bootstrap's form-control face.
 *
 * The host is form-associated: it contributes `name=value` to the owner form,
 * mirrors the internal input's constraint validation (maxlength, minlength,
 * pattern, required) through ElementInternals so invalid values block
 * submission and match `:invalid`, and supports form reset and disabled
 * form/fieldset ancestors. Unlike email, `tel` performs no native syntax
 * check, so values that do not look like phone numbers stay valid; use the
 * `pattern` attribute to constrain the format. The `value` attribute stays
 * the default restored by reset, while the `value` property holds the live
 * value like a native input. The host is labelable, so `<label for>` focuses
 * it.
 *
 * ```html
 * <script type="module" src="./index.js"></script>
 * <label for="phone">Phone</label>
 * <yk-input-tel id="phone" name="phone" pattern="[0-9\-]+" placeholder="090-1234-5678"></yk-input-tel>
 * ```
 */
import { YKInputElement } from './input-base.js';

class YKInputTel extends YKInputElement {
  static inputType = 'tel';
}

if (!customElements.get('yk-input-tel')) {
  customElements.define('yk-input-tel', YKInputTel);
}
