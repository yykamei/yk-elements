/**
 * Single-line text field that renders a native `<input type="text">` kept in
 * Shadow DOM with Bootstrap's form-control face.
 *
 * The host is form-associated: it contributes `name=value` to the owner form,
 * mirrors the internal input's constraint validation (maxlength, minlength,
 * pattern, required) through ElementInternals so invalid values block
 * submission and match `:invalid`, and supports form reset and disabled
 * form/fieldset ancestors. The `value` attribute stays the default restored
 * by reset, while the `value` property holds the live value like a native
 * input. The host is labelable, so `<label for>` focuses it.
 *
 * ```html
 * <script type="module" src="./index.js"></script>
 * <label for="handle">Handle</label>
 * <yk-input-text id="handle" name="handle" minlength="3" placeholder="3+ characters"></yk-input-text>
 * ```
 */
import { YKInputElement } from './input-base.js';

class YKInputText extends YKInputElement {}

if (!customElements.get('yk-input-text')) {
  customElements.define('yk-input-text', YKInputText);
}
