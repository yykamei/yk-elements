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
 * Add the `switch` attribute for Bootstrap's toggle-switch face instead of the
 * box. It changes appearance only: the semantics, form participation, and
 * validation stay those of the native checkbox, while the internal input is
 * exposed as a switch (`role="switch"`, plus the native `switch` attribute for
 * browsers that provide haptics and map the role themselves):
 *
 * ```html
 * <yk-input-checkbox switch name="wifi" checked>Wi-Fi</yk-input-checkbox>
 * ```
 *
 * `indeterminate` is a checkbox-only state. The switch face suppresses it and
 * keeps the thumb where `checked` puts it, since the switch role has no mixed
 * state.
 *
 * The host is form-associated and behaves like a native checkbox: while
 * checked it contributes `name=value` (`value` defaults to `on`) to the owner
 * form, while unchecked it contributes no entry. `checked` is the default
 * restored by form reset; the `checked` property is the live state and, like
 * the native property, neither writes the attribute nor emits events.
 * `indeterminate` renders the dash face: unlike native, the state is also a
 * boolean attribute that reflects the property, a user toggle clears it, and
 * form reset preserves it (native reset leaves the flag untouched). It is
 * appearance only and does not change the submitted value. With `required`,
 * an unchecked field surfaces valueMissing, matches `:invalid`, and blocks
 * submission. Disabled form/fieldset ancestors are supported, and the host is
 * labelable so `<label for>` toggles it.
 *
 * Clicks on links or buttons inside the label do not toggle the checkbox and
 * keep their own default behavior, like a native label.
 */
import { YKInputElement } from './input-base.js';
import sheet from './yk-input-checkbox.css' with { type: 'css' };

class YKInputCheckbox extends YKInputElement {
  static inputType = 'checkbox';

  // Checkboxes have no placeholder or length/pattern constraints; the value
  // attribute is the submitted-while-checked payload, `checked` is the
  // reset-restoring default state, and `switch` is the native appearance hint
  // mirrored so the platform can provide its own switch behavior.
  static inputAttributes = ['value', 'checked', 'required', 'switch'];

  static coreStylesheet = sheet;

  // `indeterminate` is host state, not a mirrored input attribute: the native
  // input has no such attribute, so the host attribute is applied to the
  // internal input's IDL property instead.
  static get observedAttributes() {
    // biome-ignore lint/complexity/noThisInStatic: super must dispatch through the base getter so this class's `inputAttributes` override is honored
    return [...super.observedAttributes, 'indeterminate'];
  }

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
    // `indeterminate` is not in `inputAttributes` (it maps to a property, not
    // an internal attribute), so a pre-upgrade write is routed through the
    // accessor here instead of the base's capture list. Applying directly
    // avoids depending on when the attribute reaction runs.
    if (Object.hasOwn(this, 'indeterminate')) {
      const value = this.indeterminate;
      delete this.indeterminate;
      this.indeterminate = value;
    }
    this.#applyIndeterminate();
    this.#applySwitchRole();
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
    // Native activation clears the indeterminate flag, so the attribute must
    // be cleared too or it would outlive the dash. Listening on the host (not
    // the input) survives the input swap on form reset, and `target === this`
    // filters out input events from slotted light-DOM controls, whose target
    // is not retargeted across the shadow boundary.
    this.addEventListener('input', (event) => {
      if (event.target !== this) return;
      this.removeAttribute('indeterminate');
    });
  }

  attributeChangedCallback(name) {
    if (name === 'indeterminate') {
      // Appearance only, so the base's form-state sync is skipped: neither
      // the submitted value nor validity depends on the flag.
      this.#applyIndeterminate();
      return;
    }
    super.attributeChangedCallback(name);
    if (name === 'switch') {
      this.#applyIndeterminate();
      this.#applySwitchRole();
    }
  }

  formResetCallback() {
    // The base swaps in a fresh input, which drops the indeterminate flag;
    // native reset leaves it untouched, so reapply it from the attribute.
    super.formResetCallback();
    this.#applyIndeterminate();
    this.#applySwitchRole();
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
    return this.hasAttribute('indeterminate');
  }

  set indeterminate(value) {
    this.toggleAttribute('indeterminate', Boolean(value));
  }

  // `switch` shadows nothing on the host (the native property lives on
  // HTMLInputElement); it is the same boolean content attribute the platform
  // uses for a native switch.
  get switch() {
    return this.hasAttribute('switch');
  }

  set switch(value) {
    this.toggleAttribute('switch', Boolean(value));
  }

  // Mirrors the host attribute onto the internal input, which is what the
  // platform renders and `:indeterminate` matches. The switch face wins over
  // the flag: Chromium stops matching `:checked` once a checkbox is
  // indeterminate, so leaving the flag set would hide the switch's checked
  // state, and the switch role has no mixed state to show anyway.
  #applyIndeterminate() {
    this.shadowRoot.querySelector('input').indeterminate =
      this.hasAttribute('indeterminate') && !this.hasAttribute('switch');
  }

  // The internal input is the accessible control, so the role belongs there,
  // not on the host. Browsers that implement the native `switch` attribute map
  // the role themselves; setting it explicitly keeps assistive technology
  // accurate in the browsers that do not yet.
  #applySwitchRole() {
    const input = this.shadowRoot.querySelector('input');
    if (this.hasAttribute('switch')) {
      input.setAttribute('role', 'switch');
    } else {
      input.removeAttribute('role');
    }
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
