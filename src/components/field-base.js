/**
 * Base class for form-associated fields that keep a native control in Shadow
 * DOM (`yk-input-*`, `yk-textarea`, `yk-select`).
 *
 * The host is form-associated: it contributes `name=value` to the owner form,
 * mirrors the internal control's constraint validation through ElementInternals
 * so invalid values block submission and match `:invalid`, and supports form
 * reset and disabled form/fieldset ancestors. The `value` attribute stays the
 * default restored by reset, while the `value` property holds the live value
 * like a native control. The host is labelable, so `<label for>` focuses it.
 *
 * `createControl()` is the extension point a subclass implements to supply its
 * native control, setting the `part` attribute it wants to expose. A subclass
 * normally also picks its mirrored `inputAttributes`, may override
 * `coreStylesheet` to wear a different face, and can call `refreshFormState()`
 * after mutating the control outside an input event.
 *
 * ```js
 * // src/components/yk-input-text.js
 * import { YKFieldElement } from './field-base.js';
 *
 * class YKInputText extends YKFieldElement {
 *   createControl() {
 *     const input = document.createElement('input');
 *     input.type = 'text';
 *     input.setAttribute('part', 'input');
 *     return input;
 *   }
 * }
 *
 * if (!customElements.get('yk-input-text')) {
 *   customElements.define('yk-input-text', YKInputText);
 * }
 * ```
 */
import { ensureShadow } from '../dsd.js';
import sheet from './input-core.css' with { type: 'css' };

// Input attributes whose IDL property name is not the attribute name itself.
// Every other mirrored attribute maps to a property of the same name.
const ATTRIBUTE_PROPERTIES = {
  maxlength: 'maxLength',
  minlength: 'minLength',
  readonly: 'readOnly',
  inputmode: 'inputMode',
};

export class YKFieldElement extends HTMLElement {
  static formAssociated = true;

  // The constructable stylesheet adopted into the shadow root. The default is
  // the shared form-control face; subclasses whose face differs (e.g. a
  // checkbox) override it with their own sheet, and one that needs a second
  // sheet pushes it onto `adoptedStyleSheets` after `super()`.
  static coreStylesheet = sheet;

  static inputAttributes = [
    'value',
    'placeholder',
    'maxlength',
    'minlength',
    'pattern',
    'required',
    'readonly',
  ];

  // Mirrored attributes whose meaning does not live in a control attribute of
  // the same name, mapped to the control property that carries it instead. A
  // textarea takes its default value from its text content, not from a `value`
  // attribute, so `value` maps to `defaultValue` there. Attributes not listed
  // are written through with setAttribute/removeAttribute.
  static controlProperties = {};

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
    const shadowRoot = ensureShadow(this, {
      delegatesFocus: true,
      styles: [this.constructor.coreStylesheet],
      render: (root) => {
        root.append(this.createControl());
      },
    });
    // On a declarative root the control comes from the parsed template;
    // subclasses then wrap or enhance it exactly as on the fresh path.
    // Templates must contain exactly the bare native control the subclass
    // creates: wrappers are always built on upgrade, so a template that
    // already includes them would render twice.
    let input = shadowRoot.querySelector('input, select, textarea');
    if (!input) {
      input = this.createControl();
      shadowRoot.append(input);
    }
    this.#input = input;
    // A mismatched template control (e.g. type="text" for a password field)
    // would silently change masking and validation, so the declared input
    // type wins over the template's. Other attributes are mirrored below.
    if (
      this.#input instanceof HTMLInputElement &&
      typeof this.constructor.inputType === 'string'
    ) {
      this.#input.type = this.constructor.inputType;
    }
    this.#input.addEventListener('input', () => this.#syncFormState());
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
    const input = this.createControl();
    input.addEventListener('input', () => this.#syncFormState());
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

  // Extension point for subclasses: build and return the native control kept
  // in Shadow DOM, marked with the `part` they want to expose. Called by the
  // constructor and again on every form reset, so the returned control must
  // not hold state that has to survive a reset. It runs during construction,
  // before the subclass's own instance fields (private members included) are
  // installed, so it must build the control from static values only. The base
  // attaches the input listener, so subclasses do not.
  createControl() {
    throw new Error('createControl() must be implemented by a subclass');
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

  // Extension point for subclasses whose form value is not the internal
  // input's string value (e.g. file inputs submit File objects). Called on
  // every form-state sync; return values other than a string must be null or
  // FormData, the shapes setFormValue accepts.
  formValue() {
    return this.#input.value;
  }

  // Extension point for subclasses whose validity is not the internal
  // control's own (e.g. a combobox whose internal input holds a search query
  // rather than the selected value). Called on every form-state sync and
  // mirrored to ElementInternals; the message must be non-empty whenever the
  // flags mark a failure, as setValidity requires. The default is the
  // internal control's own validity, so subclasses that do not override it
  // behave exactly as before.
  formValidity() {
    return {
      validity: this.#input.validity,
      message: this.#input.validationMessage,
    };
  }

  // Extension point for subclasses that mutate the internal input outside an
  // input event (e.g. the yk-input-checkbox checked setter): re-runs the
  // form-state sync so setFormValue and setValidity mirror the new state.
  refreshFormState() {
    this.#syncFormState();
  }

  #syncFormState() {
    const disabled = this.hasAttribute('disabled') || this.#formDisabled;
    this.#internals.setFormValue(disabled ? null : this.formValue());
    if (this.#input.willValidate) {
      const { validity, message } = this.formValidity();
      this.#internals.setValidity(validity, message, this.#input);
    } else {
      this.#internals.setValidity({});
    }
  }

  #syncDisabled() {
    this.#input.disabled = this.hasAttribute('disabled') || this.#formDisabled;
  }

  #mirror(name) {
    const value = this.getAttribute(name);
    const properties = this.constructor.controlProperties;
    if (Object.hasOwn(properties, name)) {
      this.#input[properties[name]] = value ?? '';
      return;
    }
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
