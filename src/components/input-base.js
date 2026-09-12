/**
 * Base class for single-line input fields (`yk-input-text`, `yk-input-email`,
 * `yk-input-tel`, ...). It renders a native `<input>` of `inputType` kept in
 * Shadow DOM with the shared Bootstrap form-control face from `input-core.css`.
 *
 * The host is form-associated: it contributes `name=value` to the owner form,
 * mirrors the internal input's constraint validation through ElementInternals
 * so invalid values block submission and match `:invalid`, and supports form
 * reset and disabled form/fieldset ancestors. The `value` attribute stays the
 * default restored by reset, while the `value` property holds the live value
 * like a native input. The host is labelable, so `<label for>` focuses it.
 *
 * Subclasses are self-registering modules that normally only pick the input
 * type and list any type-specific stored attributes; accessors for extra
 * attributes live in the subclass.
 *
 * ```js
 * // src/components/yk-input-password.js
 * import { YKInputElement } from './input-base.js';
 *
 * class YKInputPassword extends YKInputElement {
 *   static inputType = 'password';
 * }
 *
 * if (!customElements.get('yk-input-password')) {
 *   customElements.define('yk-input-password', YKInputPassword);
 * }
 * ```
 */
import sheet from './input-core.css' with { type: 'css' };

// Input attributes whose IDL property name is not the attribute name itself.
// Every other mirrored attribute maps to a property of the same name.
const ATTRIBUTE_PROPERTIES = {
  maxlength: 'maxLength',
  minlength: 'minLength',
  readonly: 'readOnly',
  inputmode: 'inputMode',
};

export class YKInputElement extends HTMLElement {
  static formAssociated = true;

  static inputType = 'text';

  static inputAttributes = [
    'value',
    'placeholder',
    'maxlength',
    'minlength',
    'pattern',
    'required',
    'readonly',
  ];

  // A static getter, not an initializer, so each subclass's own
  // `inputAttributes` override is read at upgrade time instead of the base
  // list being frozen when the base class is defined.
  static get observedAttributes() {
    // biome-ignore lint/complexity/noThisInStatic: the lookup must dispatch to the subclass so its `inputAttributes` override is honored
    return [...this.inputAttributes, 'disabled'];
  }

  #internals;

  #input;

  #formDisabled = false;

  constructor() {
    super();
    this.#internals = this.attachInternals();
    const shadowRoot = this.attachShadow({
      mode: 'open',
      delegatesFocus: true,
    });
    shadowRoot.adoptedStyleSheets = [sheet];
    this.#input = this.#createInput();
    shadowRoot.append(this.#input);
    for (const name of this.#propertyNames()) {
      this.#capturePreUpgradeWrite(name);
    }
    for (const name of this.constructor.inputAttributes) {
      this.#mirror(name);
    }
    // Attribute reactions do not fire for attributes set while the
    // constructor runs, so apply the transferred writes directly.
    this.#syncDisabled();
    this.#syncFormState();
  }

  attributeChangedCallback(name) {
    if (name === 'disabled') {
      this.#syncDisabled();
    } else {
      this.#mirror(name);
    }
    this.#syncFormState();
  }

  formDisabledCallback(disabled) {
    this.#formDisabled = disabled;
    this.#syncDisabled();
    this.#syncFormState();
  }

  formResetCallback() {
    // Nothing can clear the internal input's dirty value flag — the native
    // reset algorithm only reaches controls with a form owner, and the
    // internal input has none — and even cloneNode propagates the flag, so
    // a dirty input would keep ignoring later `value` attribute changes
    // forever. Swapping in a fresh input restores the clean,
    // attribute-following state that native reset produces.
    const hadFocus = this.#input === this.shadowRoot.activeElement;
    const input = this.#createInput();
    this.#input.replaceWith(input);
    this.#input = input;
    if (hadFocus) {
      input.focus();
    }
    for (const name of this.constructor.inputAttributes) {
      this.#mirror(name);
    }
    this.#syncDisabled();
    this.#syncFormState();
  }

  get value() {
    return this.#input.value;
  }

  set value(value) {
    this.#input.value = value;
    this.#syncFormState();
  }

  get name() {
    return this.getAttribute('name') ?? '';
  }

  set name(value) {
    this.setAttribute('name', value);
  }

  get placeholder() {
    return this.#input.placeholder;
  }

  set placeholder(value) {
    this.setAttribute('placeholder', value);
  }

  get maxLength() {
    return this.#input.maxLength;
  }

  set maxLength(value) {
    this.setAttribute('maxlength', value);
  }

  get minLength() {
    return this.#input.minLength;
  }

  set minLength(value) {
    this.setAttribute('minlength', value);
  }

  get pattern() {
    return this.#input.pattern;
  }

  set pattern(value) {
    this.setAttribute('pattern', value);
  }

  get required() {
    return this.hasAttribute('required');
  }

  set required(value) {
    this.toggleAttribute('required', value);
  }

  get readOnly() {
    return this.hasAttribute('readonly');
  }

  set readOnly(value) {
    this.toggleAttribute('readonly', value);
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  set disabled(value) {
    this.toggleAttribute('disabled', value);
  }

  get form() {
    return this.#internals.form;
  }

  get labels() {
    return this.#internals.labels;
  }

  get validity() {
    return this.#internals.validity;
  }

  get validationMessage() {
    return this.#internals.validationMessage;
  }

  get willValidate() {
    // The platform does not bar the host from constraint validation through
    // the disabled/readonly attributes (that is why they are mirrored), so
    // the internal input's willValidate — not #internals.willValidate — is
    // the truthful source.
    return this.#input.willValidate;
  }

  checkValidity() {
    return this.#internals.checkValidity();
  }

  reportValidity() {
    return this.#internals.reportValidity();
  }

  // Shared by the constructor and formResetCallback so a reset always
  // produces exactly the same field shape (see formResetCallback for why a
  // fresh input is required).
  #createInput() {
    const input = document.createElement('input');
    input.type = this.constructor.inputType;
    input.setAttribute('part', 'input');
    input.addEventListener('input', () => this.#syncFormState());
    return input;
  }

  #syncFormState() {
    const disabled = this.hasAttribute('disabled') || this.#formDisabled;
    this.#internals.setFormValue(disabled ? null : this.#input.value);
    if (this.#input.willValidate) {
      this.#internals.setValidity(
        this.#input.validity,
        this.#input.validationMessage,
        this.#input,
      );
    } else {
      this.#internals.setValidity({});
    }
  }

  #syncDisabled() {
    this.#input.disabled = this.hasAttribute('disabled') || this.#formDisabled;
  }

  #mirror(name) {
    const value = this.getAttribute(name);
    if (value === null) {
      this.#input.removeAttribute(name);
    } else {
      this.#input.setAttribute(name, value);
    }
  }

  // IDL property names for pre-upgrade capture: one derived from each
  // mirrored attribute plus the host-only `name`/`disabled` accessors.
  #propertyNames() {
    return [
      ...this.constructor.inputAttributes.map(
        (attribute) => ATTRIBUTE_PROPERTIES[attribute] ?? attribute,
      ),
      'name',
      'disabled',
    ];
  }

  // Routes property writes made before the module loaded through the
  // prototype setters: without this, such a write creates an own property
  // that permanently shadows the accessor and never reaches the attribute.
  // Standard custom element upgrade idiom; the string-keyed access is the
  // platform-recommended form.
  #capturePreUpgradeWrite(name) {
    if (Object.hasOwn(this, name)) {
      const value = this[name];
      delete this[name];
      this[name] = value;
    }
  }
}
