/**
 * Action button that renders its label inside a native `<button>` kept in
 * Shadow DOM.
 *
 * The face is a solid Bootstrap-style tone: `variant` selects primary,
 * secondary, or danger (the default face is the secondary tone), and design
 * tokens restyle it without class names. Clicks on `type="submit"` submit
 * the owning form through ElementInternals; `disabled` — or a disabled
 * form/fieldset ancestor — disables the internal control natively.
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
  }

  attributeChangedCallback(name) {
    if (name === 'type') {
      this.#button.type =
        this.getAttribute('type') === 'submit' ? 'submit' : 'button';
    } else {
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

  #submitOwningForm() {
    if (this.#button.type === 'submit') {
      this.#internals.form?.requestSubmit();
    }
  }
}

if (!customElements.get('yk-button')) {
  customElements.define('yk-button', YKButton);
}
