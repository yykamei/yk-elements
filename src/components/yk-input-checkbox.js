/**
 * Checkbox that renders a native `<input type="checkbox">` kept in Shadow DOM
 * with Bootstrap's form-check face and its label text taken from the light
 * DOM:
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
 * form, while unchecked it contributes no entry. `checked` is the default
 * restored by form reset; the `checked` property is the live state and, like
 * the native property, neither writes the attribute nor emits events. The
 * `indeterminate` property (no HTML attribute exists for it) renders the dash
 * face. With `required`, an unchecked field surfaces valueMissing, matches
 * `:invalid`, and blocks submission. Disabled form/fieldset ancestors are
 * supported, and the host is labelable so `<label for>` toggles it.
 *
 * Clicks on links or buttons inside the label do not toggle the checkbox and
 * keep their own default behavior, like a native label.
 */
import { YKInputElement } from './input-base.js';
import sheet from './yk-input-checkbox.css' with { type: 'css' };

class YKInputCheckbox extends YKInputElement {
  static inputType = 'checkbox';

  // Checkboxes have no placeholder or length/pattern constraints; the value
  // attribute is the submitted-while-checked payload and `checked` is the
  // reset-restoring default state.
  static inputAttributes = ['value', 'checked', 'required'];

  static coreStylesheet = sheet;

  constructor() {
    super();
    const shadowRoot = this.shadowRoot;
    const label = document.createElement('label');
    const box = document.createElement('span');
    const mark = document.createElement('span');
    label.setAttribute('part', 'label');
    mark.setAttribute('part', 'mark');
    mark.setAttribute('aria-hidden', 'true');
    box.append(shadowRoot.querySelector('input'), mark);
    label.append(box, document.createElement('slot'));
    shadowRoot.append(label);
    // `indeterminate` has no attribute for the base class to mirror, so a
    // pre-upgrade property write is routed through the accessor here.
    if (Object.hasOwn(this, 'indeterminate')) {
      const value = this.indeterminate;
      delete this.indeterminate;
      this.indeterminate = value;
    }
    // Label activation (an external <label for>) and clicks that miss the
    // internal input land on the host, which has no activation behavior of
    // its own; such a click is forwarded to the input. A click already on the
    // input toggled natively and must not be re-forwarded, a canceled click
    // toggles nothing, and a click on slotted interactive content resolves to
    // that element so the native no-activation rule and its default action
    // both stand.
    this.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.composedPath()[0] !== this) return;
      shadowRoot.querySelector('input').click();
    });
  }

  // Unlike the text fields, a native checkbox's value is its content
  // attribute, so the property reflects it: the base setter would leave the
  // attribute absent and the base's attribute mirror would then reset the
  // value to `on` right after the write.
  get value() {
    return this.shadowRoot.querySelector('input').value;
  }

  set value(value) {
    this.setAttribute('value', value);
  }

  // The accessors read through the shadow root instead of a private field
  // because the base constructor routes pre-upgrade writes through them
  // before subclass fields are installed (see input-base.js).
  get checked() {
    return this.shadowRoot.querySelector('input').checked;
  }

  set checked(value) {
    this.shadowRoot.querySelector('input').checked = Boolean(value);
    this.refreshFormState();
  }

  get indeterminate() {
    return this.shadowRoot.querySelector('input').indeterminate;
  }

  set indeterminate(value) {
    this.shadowRoot.querySelector('input').indeterminate = Boolean(value);
  }

  formValue() {
    // Like a native checkbox, an unchecked field stores no value. Gating on
    // the host name here would be a latent bug: the base syncs the form value
    // when observed attributes change, name is not one of them, so a checked
    // box that gains its name later would stay unsubmitted. The platform drops
    // the stored value of a nameless control on its own.
    const input = this.shadowRoot.querySelector('input');
    return input.checked ? input.value : null;
  }
}

if (!customElements.get('yk-input-checkbox')) {
  customElements.define('yk-input-checkbox', YKInputCheckbox);
}
