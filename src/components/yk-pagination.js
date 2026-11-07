/**
 * Pagination navigation that groups slotted page links under a navigation
 * landmark.
 *
 * Put the page links as direct children. Mark the current page with
 * `aria-current="page"`. A boundary state that is not actionable takes
 * `aria-disabled="true"`; it is a visual placeholder, so add
 * `aria-hidden="true"` when it should not be announced. The component styles
 * those states and lays the children out as a centered, wrapping row. A plain
 * `<span>` renders as an unstyled gap, which suits an ellipsis. The host's
 * `aria-label` names the landmark and falls back to "Pagination".
 *
 * ```html
 * <script type="module" src="./index.js"></script>
 * <yk-pagination aria-label="Pagination">
 *   <a href="?page=1">Previous</a>
 *   <a href="?page=1">1</a>
 *   <span aria-current="page">2</span>
 *   <a href="?page=3">3</a>
 *   <a href="?page=3">Next</a>
 * </yk-pagination>
 * ```
 */
import '../base.js';
import { ensureShadow } from '../dsd.js';
import sheet from './yk-pagination.css' with { type: 'css' };

class YKPagination extends HTMLElement {
  static observedAttributes = ['aria-label'];

  #nav;

  constructor() {
    super();
    const shadowRoot = ensureShadow(this, {
      styles: [sheet],
      render: (root) => {
        root.innerHTML = `<nav part="nav"><slot></slot></nav>`;
      },
    });
    this.#nav = shadowRoot.querySelector('nav');
    this.#syncLabel();
  }

  attributeChangedCallback() {
    this.#syncLabel();
  }

  #syncLabel() {
    const label = (this.getAttribute('aria-label') ?? '').trim();
    this.#nav.setAttribute('aria-label', label || 'Pagination');
  }
}

if (!customElements.get('yk-pagination')) {
  customElements.define('yk-pagination', YKPagination);
}
