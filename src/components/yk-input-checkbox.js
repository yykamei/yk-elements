/**
 * Checkbox that renders a native `<input type="checkbox">` kept in Shadow DOM
 * with Bootstrap's form-check face, followed by the slotted label text:
 *
 * ```html
 * <script type="module" src="./index.js"></script>
 * <yk-input-checkbox name="newsletter" value="yes" checked>
 *   Subscribe to the newsletter
 * </yk-input-checkbox>
 * ```
 *
 * The host is form-associated and behaves like a native checkbox: while
 * checked it contributes `name=value` (`value` defaults to `on`) to the owner
 * form, while unchecked it contributes no entry. The `checked` attribute is
 * the default state restored by form reset — set it in markup to pre-check
 * the field; the `checked` property holds the live state without touching the
 * attribute, exactly like a native checkbox. The `indeterminate` property
 * (no HTML attribute exists for it) renders the Bootstrap dash face. With
 * `required`, an unchecked field surfaces valueMissing, matches `:invalid`,
 * and blocks submission. Like Bootstrap's unstyled checks, the unchecked
 * required face carries no danger border (opt into one yourself through the
 * focus/border tokens). Disabled form/fieldset ancestors are supported. The
 * host is labelable, so `<label for>` toggles it.
 *
 * Label text placed inside the element is rendered next to the box and dims
 * with it while disabled. Clicks on interactive content inside the label
 * (links, buttons) neither toggle the checkbox nor follow the content, like
 * a native label's no-activation rule:
 *
 * ```html
 * <yk-input-checkbox name="agree" required>利用規約に同意する</yk-input-checkbox>
 * ```
 */
import { YKInputElement } from './input-base.js';
import sheet from './yk-input-checkbox.css' with { type: 'css' };

class YKInputCheckbox extends YKInputElement {
  static inputType = 'checkbox';

  // Checkboxes have no placeholder or length/pattern constraints; the value
  // attribute is the submitted-while-checked payload and `checked` is the
  // reset-restoring default state.
  static inputAttributes = ['value', 'checked', 'required'];

  constructor() {
    super();
    const shadowRoot = this.shadowRoot;
    // The base class adopts input-core.css for the form-control face, which a
    // checkbox does not wear; replace the sheet instead of stacking on it.
    shadowRoot.adoptedStyleSheets = [sheet];
    // The input rides inside a shadow label together with the slotted text so
    // the implicit label association gives the internal input its accessible
    // name; siblings alone would leave the focused input unnamed for assistive
    // tech. The external <label for> stays labelable through the host.
    const label = document.createElement('label');
    const slot = document.createElement('slot');
    label.setAttribute('part', 'label');
    label.append(shadowRoot.querySelector('input'), slot);
    shadowRoot.append(label);
    // Label activation (an external <label for>) and clicks that miss the
    // internal input land on the host, which has no checkbox activation
    // behavior of its own; a click whose composed path skips the input is
    // forwarded to it. The listener rides on the host itself: a click that
    // targets the host never passes through the shadow root. A direct click
    // on the input toggles natively and must not be re-forwarded, or the box
    // would flip twice. Clicks on interactive slotted content (e.g. a link
    // inside the label text) follow the native no-toggle rule — the innermost
    // target check catches chromium's shadow-label synthesis too, and
    // canceling the event stops the label from toggling at all (the link's
    // keyboard activation path stays available). A canceled click skips
    // forwarding like a native canceled label click. Disabled inputs ignore
    // click(), matching the native disabled checkbox.
    this.addEventListener('click', (event) => {
      const input = this.shadowRoot.querySelector('input');
      const innermost = event.composedPath()[0];
      if (innermost.closest?.('a, button, summary')) {
        event.preventDefault();
        return;
      }
      if (event.defaultPrevented || event.composedPath().includes(input)) {
        return;
      }
      input.click();
    });
  }

  #internalInput() {
    return this.shadowRoot.querySelector('input');
  }

  get checked() {
    return this.#internalInput().checked;
  }

  set checked(value) {
    this.#internalInput().checked = Boolean(value);
    // A programmatic checkedness change fires no native events, but the base
    // syncs its form value through its own input listener — the same pair of
    // events yk-input-file rides for programmatic selection changes.
    for (const type of ['input', 'change']) {
      this.#internalInput().dispatchEvent(
        new Event(type, { bubbles: true, composed: true }),
      );
    }
  }

  get indeterminate() {
    return this.#internalInput().indeterminate;
  }

  set indeterminate(value) {
    this.#internalInput().indeterminate = Boolean(value);
  }

  formValue() {
    // Like a native checkbox: unchecked fields submit nothing, and a nameless
    // control contributes no entry even when checked. Must not read through
    // #internalInput: subclass private members are not installed while the
    // base constructor runs (see yk-input-file's formValue for the same
    // constraint).
    const input = this.shadowRoot.querySelector('input');
    if (!input.checked || this.name === '') {
      return null;
    }
    return input.value;
  }
}

if (!customElements.get('yk-input-checkbox')) {
  customElements.define('yk-input-checkbox', YKInputCheckbox);
}
