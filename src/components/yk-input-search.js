/**
 * Single-line search field that renders a native `<input type="search">` kept
 * in Shadow DOM with Bootstrap's form-control face.
 *
 * The host is form-associated: it contributes `name=value` to the owner form,
 * mirrors the internal input's constraint validation (maxlength, minlength,
 * pattern, required) through ElementInternals so invalid values block
 * submission and match `:invalid`, and supports form reset and disabled
 * form/fieldset ancestors. Like the native search input, CR/LF characters are
 * stripped from the value, the browser supplies the search affordances
 * (a clear button once the user types, and a magnifying-glass icon on some
 * platforms), and no syntax check constrains the value (use `pattern`
 * instead). The `value` attribute stays the default restored by reset, while
 * the `value` property holds the live value like a native input. The host is
 * labelable, so `<label for>` focuses it.
 *
 * ```html
 * <script type="module" src="./index.js"></script>
 * <label for="query">Search</label>
 * <yk-input-search id="query" name="q" placeholder="Search articles..."></yk-input-search>
 * ```
 */
import { YKInputElement } from './input-base.js';

class YKInputSearch extends YKInputElement {
  static inputType = 'search';
}

if (!customElements.get('yk-input-search')) {
  customElements.define('yk-input-search', YKInputSearch);
}
