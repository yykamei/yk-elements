/**
 * Modal dialog built on the native `<dialog>` element, used for confirmations
 * such as deleting a target.
 *
 * The light DOM is placed through a default body slot plus optional `header`
 * and `footer` slots, whose regions appear only when they have content. A close
 * button sits in the top-right corner and always closes the dialog, whatever
 * `closedby` allows; its accessible name comes from the `close-label` slot and
 * defaults to "Close". Setting the `open` attribute or property opens the
 * dialog with `showModal()`, and the attribute is reflected while it is open;
 * `close(returnValue)` closes it, and a `yk-dialog-close` event carries the
 * `returnValue` once it has closed. An `open` attribute present when the element
 * connects is applied once its children are parsed.
 * Because the dialog sits in Shadow DOM, a slotted `<form method="dialog">`
 * still closes it and sets the return value: the component intercepts the
 * form's submit, because the form is not a DOM descendant of the internal
 * dialog and the platform would not close it. The `closedby` attribute decides
 * what may dismiss the dialog without an explicit close: without it, a backdrop
 * click and Escape both close it, like a Bootstrap modal, while
 * `closedby="none"` disables both so only the close button, the content's own
 * controls, or `close()` close it. The component applies those rules itself, so
 * the behavior is the same in every browser. Opening clears the return value,
 * so a dismissal that carries none cannot report an earlier one.
 *
 * The internal dialog takes its accessible name from the host's `aria-label`
 * (or `aria-labelledby`); `aria-label` is the reliable choice because an idref
 * does not cross the shadow boundary.
 *
 * ```html
 * <script type="module" src="./index.js"></script>
 * <yk-button id="open">Delete</yk-button>
 * <yk-dialog id="confirm" aria-label="Delete this target?">
 *   <h2 slot="header">Delete this target?</h2>
 *   <p>This also deletes its example sentences.</p>
 *   <form method="dialog" slot="footer">
 *     <button value="cancel">Cancel</button>
 *     <button value="confirm">Delete</button>
 *   </form>
 * </yk-dialog>
 * <script type="module">
 *   document.getElementById('open').addEventListener('click', () => {
 *     document.getElementById('confirm').showModal();
 *   });
 * </script>
 * ```
 */
import sheet from './yk-dialog.css' with { type: 'css' };

class YKDialog extends HTMLElement {
  static observedAttributes = [
    'open',
    'closedby',
    'aria-label',
    'aria-labelledby',
  ];

  #dialog;

  #close;

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.adoptedStyleSheets = [sheet];
    shadowRoot.innerHTML = `
      <dialog part="dialog">
        <div part="header"><slot name="header"></slot></div>
        <div part="body"><slot></slot></div>
        <div part="footer"><slot name="footer"></slot></div>
        <button part="close" type="button">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </button>
        <slot name="close-label" hidden>Close</slot>
      </dialog>
    `;
    this.#dialog = shadowRoot.querySelector('dialog');
    this.#close = shadowRoot.querySelector('[part="close"]');
    this.#close.addEventListener('click', () => this.close());
    const closeLabel = shadowRoot.querySelector('slot[name="close-label"]');
    closeLabel.addEventListener('slotchange', () => this.#nameClose());
    this.#nameClose();
    this.#dialog.addEventListener('close', () => this.#onClose());
    this.#dialog.addEventListener('cancel', (event) => this.#onCancel(event));
    this.#dialog.addEventListener('click', (event) =>
      this.#onBackdropClick(event),
    );
    // A slotted form is not a descendant of the internal dialog, so the
    // platform will not close the dialog on a method="dialog" submit; the
    // component closes it and carries the activating button's value.
    this.addEventListener('submit', (event) => this.#onSubmit(event));
    for (const name of ['header', 'footer']) {
      shadowRoot
        .querySelector(`slot[name="${name}"]`)
        .addEventListener('slotchange', () => this.#syncPresence());
    }
    this.#syncOpen();
    this.#syncClosedBy();
    this.#syncAria();
  }

  connectedCallback() {
    this.#syncPresence();
    // A parser connects the element before its children are parsed, so reflect
    // the slot presence again and open after the current parse finishes; that
    // way the first focusable content, not the close button, takes focus.
    queueMicrotask(() => {
      this.#syncPresence();
      this.#syncOpen();
    });
  }

  attributeChangedCallback(name) {
    if (name === 'open') {
      this.#syncOpen();
    } else if (name === 'closedby') {
      this.#syncClosedBy();
    } else if (name === 'aria-label' || name === 'aria-labelledby') {
      this.#syncAria();
    }
  }

  get open() {
    return this.#dialog.open;
  }

  set open(value) {
    this.toggleAttribute('open', Boolean(value));
  }

  get returnValue() {
    return this.#dialog.returnValue;
  }

  showModal() {
    // showModal() throws on an already-open dialog, so guard like #syncOpen and
    // reflect the request even when it cannot be honored yet.
    if (!this.#dialog.open && this.isConnected) {
      this.#openModal();
    }
    this.toggleAttribute('open', true);
  }

  close(returnValue) {
    this.#dialog.close(returnValue);
    // Reflect the closed state synchronously, so a still-queued open from
    // connectedCallback cannot reopen a dialog that has already been closed.
    this.toggleAttribute('open', false);
  }

  #syncOpen() {
    const shouldOpen = this.hasAttribute('open');
    if (shouldOpen && !this.#dialog.open && this.isConnected) {
      this.#openModal();
    } else if (!shouldOpen && this.#dialog.open) {
      this.close();
    }
  }

  // Opening clears the return value so a dismissal that carries none (Escape or
  // a backdrop click) cannot report the value of an earlier close.
  #openModal() {
    this.#dialog.returnValue = '';
    this.#dialog.showModal();
  }

  #onClose() {
    // Reflect the closed state without re-entering close(), then announce the
    // return value so callers can branch on the button that closed it.
    this.toggleAttribute('open', false);
    this.dispatchEvent(
      new CustomEvent('yk-dialog-close', {
        detail: { returnValue: this.#dialog.returnValue },
        bubbles: true,
        composed: true,
      }),
    );
  }

  // A method="dialog" submit from slotted content closes the dialog with the
  // activating button's value; the platform leaves it alone because the form is
  // not a descendant of the internal dialog. Only the dialog that owns the form
  // reacts, so a nested dialog's submit does not also close its ancestors.
  #onSubmit(event) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || form.method !== 'dialog') return;
    if (form.closest('yk-dialog') !== this) return;
    event.preventDefault();
    event.stopPropagation();
    this.close(event.submitter?.value ?? '');
  }

  // `none` suppresses the Escape key, which arrives as a cancelable `cancel`
  // event. The handler runs even where the platform implements `closedby`, so
  // the behavior is identical across browsers and can be tested everywhere.
  #onCancel(event) {
    if (this.#effectiveClosedBy() === 'none') event.preventDefault();
  }

  #syncClosedBy() {
    // The unset default is `any`, so a backdrop click closes the dialog like a
    // Bootstrap modal; `none` disables both a backdrop click and Escape.
    this.#dialog.setAttribute('closedby', this.#effectiveClosedBy());
  }

  #effectiveClosedBy() {
    // Keywords are ASCII case-insensitive, matching the native attribute.
    return (this.getAttribute('closedby') ?? 'any').toLowerCase();
  }

  // A click that lands on the backdrop retargets to the dialog itself; one
  // outside its box closes the dialog when the effective value is `any`
  // (including the unset default). Where the platform implements `closedby`,
  // this repeats what it already does and the extra close is a no-op.
  #onBackdropClick(event) {
    if (this.#effectiveClosedBy() !== 'any') return;
    if (event.target !== this.#dialog) return;
    const rect = this.#dialog.getBoundingClientRect();
    const outside =
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom;
    if (outside) {
      this.close();
    }
  }

  #syncAria() {
    for (const name of ['aria-label', 'aria-labelledby']) {
      const value = this.getAttribute(name);
      if (value === null) {
        this.#dialog.removeAttribute(name);
      } else {
        this.#dialog.setAttribute(name, value);
      }
    }
  }

  #nameClose() {
    const slot = this.shadowRoot.querySelector('slot[name="close-label"]');
    const assigned = slot
      .assignedNodes()
      .find((node) => (node.textContent ?? '').trim() !== '');
    this.#close.setAttribute(
      'aria-label',
      (assigned?.textContent ?? slot.textContent).trim(),
    );
  }

  // Mirrors whether the header and footer slots have content onto host
  // attributes, because a slot's assigned content lives in the light tree and
  // cannot be matched from this stylesheet (there is no cross-boundary
  // `:has()`).
  #syncPresence() {
    for (const name of ['header', 'footer']) {
      const slot = this.shadowRoot.querySelector(`slot[name="${name}"]`);
      this.toggleAttribute(`has-${name}`, slot.assignedElements().length > 0);
    }
  }
}

if (!customElements.get('yk-dialog')) {
  customElements.define('yk-dialog', YKDialog);
}
