/**
 * Action button that renders its label inside a native `<button>` kept in
 * Shadow DOM.
 *
 * Without a variant the face is a light bordered button like Bootstrap's
 * plain .btn; `variant` selects the solid secondary, primary, or danger
 * tone, and design tokens restyle it without class names. Clicks on
 * `type="submit"` submit the owning form through ElementInternals;
 * `disabled` — or a disabled form/fieldset ancestor — disables the
 * internal control natively.
 *
 * Unlike a native submit button, yk-button never becomes the form's
 * default button, so implicit Enter-key submission does not fire it in
 * multi-field forms.
 *
 * ```html
 * <script type="module" src="./index.js"></script>
 * <yk-button variant="primary" type="submit">Save</yk-button>
 * <yk-button variant="danger" disabled>Delete</yk-button>
 * ```
 */
import coreSheet from './button-core.css' with { type: 'css' };
import sheet from './yk-button.css' with { type: 'css' };

class YKButton extends HTMLElement {
  static formAssociated = true;

  static observedAttributes = ['type', 'disabled'];

  #button;

  #internals;

  #formDisabled = false;

  constructor() {
    super();
    this.#internals = this.attachInternals();
    const shadowRoot = this.attachShadow({
      mode: 'open',
      delegatesFocus: true,
    });
    shadowRoot.adoptedStyleSheets = [coreSheet, sheet];
    shadowRoot.innerHTML = `<button part="button" type="button"><slot></slot></button>`;
    this.#button = shadowRoot.querySelector('button');
    this.#button.addEventListener('click', () => this.#submitOwningForm());
    this.#capturePreUpgradeWrite('type');
    this.#capturePreUpgradeWrite('disabled');
    // Attribute reactions do not fire for attributes set while the
    // constructor runs, so apply the transferred writes directly.
    this.#syncType();
    this.#syncDisabled();
  }

  attributeChangedCallback(name) {
    if (name === 'type') {
      this.#syncType();
    } else if (name === 'disabled') {
      this.#syncDisabled();
    }
  }

  formDisabledCallback(disabled) {
    this.#formDisabled = disabled;
    this.#syncDisabled();
  }

  get type() {
    return this.#button.type;
  }

  set type(value) {
    this.setAttribute('type', value);
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  set disabled(value) {
    this.toggleAttribute('disabled', value);
  }

  #syncDisabled() {
    this.#button.disabled = this.hasAttribute('disabled') || this.#formDisabled;
  }

  #syncType() {
    this.#button.type =
      this.getAttribute('type') === 'submit' ? 'submit' : 'button';
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

  #submitOwningForm() {
    if (this.#button.type === 'submit') {
      this.#internals.form?.requestSubmit();
    }
  }
}

if (!customElements.get('yk-button')) {
  customElements.define('yk-button', YKButton);
}
