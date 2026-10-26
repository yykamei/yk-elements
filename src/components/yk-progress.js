/**
 * Progress bar that renders a native `<progress>` element, used to show how far
 * a target has been learned.
 *
 * The `value` attribute is the current amount and `max` the amount that
 * completes the bar; without a `value` the bar is indeterminate, and without a
 * `max` the native default of 1 applies. The bar fills the available width and
 * scales through design tokens. The internal progress element takes its
 * accessible name from the host's `aria-label`; `aria-labelledby` is forwarded
 * too, but an idref does not cross the shadow boundary, so prefer `aria-label`
 * to name what is progressing.
 *
 * ```html
 * <script type="module" src="./index.js"></script>
 * <yk-progress aria-label="Progress" value="40" max="100"></yk-progress>
 * <yk-progress aria-label="Loading"></yk-progress>
 * ```
 */
import { ensureShadow } from '../dsd.js';
import sheet from './yk-progress.css' with { type: 'css' };

class YKProgress extends HTMLElement {
  static observedAttributes = ['value', 'max', 'aria-label', 'aria-labelledby'];

  #progress;

  constructor() {
    super();
    const shadowRoot = ensureShadow(this, {
      styles: [sheet],
      render: (root) => {
        root.innerHTML = `<progress part="progress"></progress>`;
      },
    });
    this.#progress = shadowRoot.querySelector('progress');
    this.#mirror('value');
    this.#mirror('max');
    this.#syncAria();
  }

  attributeChangedCallback(name) {
    if (name === 'value' || name === 'max') {
      this.#mirror(name);
    } else {
      this.#syncAria();
    }
  }

  get value() {
    // A native progress reads 0 while indeterminate; the host reports null so a
    // caller can tell "no value" from "0%".
    return this.hasAttribute('value') ? this.#progress.value : null;
  }

  set value(value) {
    if (value === null || value === undefined) {
      this.removeAttribute('value');
    } else {
      this.setAttribute('value', value);
    }
  }

  get max() {
    return this.#progress.max;
  }

  set max(value) {
    if (value === null || value === undefined) {
      this.removeAttribute('max');
    } else {
      this.setAttribute('max', value);
    }
  }

  #mirror(name) {
    const value = this.getAttribute(name);
    if (value === null) {
      this.#progress.removeAttribute(name);
    } else {
      this.#progress.setAttribute(name, value);
    }
  }

  #syncAria() {
    for (const name of ['aria-label', 'aria-labelledby']) {
      const value = this.getAttribute(name);
      if (value === null) {
        this.#progress.removeAttribute(name);
      } else {
        this.#progress.setAttribute(name, value);
      }
    }
  }
}

if (!customElements.get('yk-progress')) {
  customElements.define('yk-progress', YKProgress);
}
