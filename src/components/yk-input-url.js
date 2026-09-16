/**
 * Single-line URL field that renders a native `<input type="url">` kept in
 * Shadow DOM with Bootstrap's form-control face.
 *
 * The host is form-associated: it contributes `name=value` to the owner form,
 * mirrors the internal input's constraint validation (maxlength, minlength,
 * pattern, required) through ElementInternals so invalid values block
 * submission and match `:invalid`, and supports form reset and disabled
 * form/fieldset ancestors. The browser's own URL syntax check requires the
 * value to be a valid absolute URL (including its scheme) and surfaces as
 * typeMismatch, while an empty value stays valid. The `value` attribute stays
 * the default restored by reset, while the `value` property holds the live
 * value like a native input. The host is labelable, so `<label for>` focuses
 * it.
 *
 * ```html
 * <script type="module" src="./index.js"></script>
 * <label for="url">Website</label>
 * <yk-input-url id="url" name="url" required placeholder="https://example.com"></yk-input-url>
 * ```
 */
import { YKInputElement } from './input-base.js';

class YKInputUrl extends YKInputElement {
  static inputType = 'url';
}

if (!customElements.get('yk-input-url')) {
  customElements.define('yk-input-url', YKInputUrl);
}
