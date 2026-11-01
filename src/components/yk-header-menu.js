/**
 * Disclosure for multi-level header navigation: a summary button that expands
 * a panel of links.
 *
 * `summary` holds the button label (falling back to "Menu"; set it so the
 * button has a distinct name from the header's hamburger) and the default slot
 * holds the panel anchors. `open` reflects the expanded panel. It is a
 * disclosure, not an ARIA menu: links keep their native Tab order and are not
 * given menuitem roles.
 *
 * Place it in `yk-header`'s default slot. The panel floats under the button in
 * the bar; Escape closes it and returns focus to the button, an outside
 * pointerdown closes it, and selecting a link closes it too.
 *
 * ```html
 * <script type="module" src="./index.js"></script>
 * <yk-header-menu>
 *   <span slot="summary">Products</span>
 *   <a href="/products/cloud">Cloud</a>
 *   <a href="/products/edge">Edge</a>
 * </yk-header-menu>
 * ```
 */
import '../base.js';
import { ensureShadow } from '../dsd.js';
import coreSheet from './header-core.css' with { type: 'css' };
import sheet from './yk-header-menu.css' with { type: 'css' };

class YKHeaderMenu extends HTMLElement {
  static observedAttributes = ['open'];

  #toggle;

  #onOutsidePointerDown = (event) => {
    // Clicks inside the menu, including the button itself, keep it open; the
    // button's own click handler decides the toggle.
    if (!event.composedPath().includes(this)) this.removeAttribute('open');
  };

  constructor() {
    super();
    const shadowRoot = ensureShadow(this, {
      styles: [coreSheet, sheet],
      render: (root) => {
        root.innerHTML = `
      <div part="disclosure">
        <button part="toggle" type="button" aria-expanded="false" aria-controls="panel">
          <slot name="summary">Menu</slot>
          <svg part="chevron" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4 6l4 4 4-4" />
          </svg>
        </button>
        <div part="panel" id="panel"><slot></slot></div>
      </div>
    `;
      },
    });
    this.#toggle = shadowRoot.querySelector('[part="toggle"]');
    this.#toggle?.addEventListener('click', () => this.toggleAttribute('open'));
    this.addEventListener('keydown', (event) => this.#onKeydown(event));
    this.addEventListener('click', (event) => this.#onClick(event));
    this.#syncOpen();
  }

  connectedCallback() {
    this.#syncOpen();
  }

  disconnectedCallback() {
    document.removeEventListener(
      'pointerdown',
      this.#onOutsidePointerDown,
      true,
    );
  }

  attributeChangedCallback() {
    this.#syncOpen();
  }

  #syncOpen() {
    const open = this.hasAttribute('open');
    this.#toggle?.setAttribute('aria-expanded', String(open));
    // The document listener exists only while the panel is open and connected,
    // so a detached or closed menu never closes on unrelated clicks.
    if (open && this.isConnected) {
      document.addEventListener(
        'pointerdown',
        this.#onOutsidePointerDown,
        true,
      );
    } else {
      document.removeEventListener(
        'pointerdown',
        this.#onOutsidePointerDown,
        true,
      );
    }
  }

  #onKeydown(event) {
    if (event.key !== 'Escape' || event.defaultPrevented) return;
    if (!this.hasAttribute('open')) return;
    // Close this level before an enclosing header panel; without the stop the
    // same Escape would collapse both.
    event.stopPropagation();
    this.removeAttribute('open');
    this.#toggle?.focus();
  }

  // Selecting a link closes the panel. The composed path catches a yk-link's
  // internal anchor, which is not the event target for this listener.
  #onClick(event) {
    if (!this.hasAttribute('open')) return;
    const onLink = event
      .composedPath()
      .some((node) => node instanceof HTMLAnchorElement);
    if (onLink) this.removeAttribute('open');
  }
}

if (!customElements.get('yk-header-menu')) {
  customElements.define('yk-header-menu', YKHeaderMenu);
}
