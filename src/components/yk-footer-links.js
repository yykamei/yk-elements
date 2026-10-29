/**
 * Named column of footer links, rendered as a navigation landmark.
 *
 * The component renders an `<h2>` from `heading` and lays out direct `<a>`
 * children in a vertical list. Anchors stay in the light DOM so navigation
 * remains native; footer link tokens style them. Put anchors directly in this
 * element, because `::slotted()` does not reach their descendants. Without
 * `heading`, the column has no visible heading and its nav has no accessible
 * name, so give each group a heading.
 *
 * ```html
 * <script type="module" src="./index.js"></script>
 * <yk-footer-links heading="Resources">
 *   <a href="/docs">Documentation</a>
 *   <a href="/support">Support</a>
 * </yk-footer-links>
 * ```
 */
import { ensureShadow } from '../dsd.js';
import coreSheet from './footer-core.css' with { type: 'css' };
import sheet from './yk-footer-links.css' with { type: 'css' };

class YKFooterLinks extends HTMLElement {
  static observedAttributes = ['heading'];

  #heading;

  #nav;

  constructor() {
    super();
    const shadowRoot = ensureShadow(this, {
      styles: [coreSheet, sheet],
      render: (root) => {
        root.innerHTML = `
      <nav part="nav" aria-labelledby="heading">
        <h2 part="heading" id="heading"></h2>
        <div part="links"><slot></slot></div>
      </nav>
    `;
      },
    });
    this.#heading = shadowRoot.querySelector('[part="heading"]');
    this.#nav = shadowRoot.querySelector('nav');
    this.#syncHeading();
  }

  attributeChangedCallback() {
    this.#syncHeading();
  }

  #syncHeading() {
    const heading = this.getAttribute('heading') ?? '';
    const empty = heading.trim() === '';
    this.#heading.textContent = heading;
    this.#heading.hidden = empty;
    if (empty) {
      this.#nav.removeAttribute('aria-labelledby');
    } else {
      this.#nav.setAttribute('aria-labelledby', this.#heading.id);
    }
  }
}

if (!customElements.get('yk-footer-links')) {
  customElements.define('yk-footer-links', YKFooterLinks);
}
