/**
 * Surface that groups related content into an optional header, a body, and an
 * optional footer, in the style of Bootstrap's card.
 *
 * The body is the default slot; `header` and `footer` are named slots whose
 * regions appear only when something is assigned to them, with a separator
 * drawn by the component. Design tokens restyle the surface without class
 * names.
 *
 * ```html
 * <script type="module" src="./index.js"></script>
 * <yk-card>
 *   <h2 slot="header">name one's price</h2>
 *   <p>To state the price one is willing to pay.</p>
 *   <yk-cluster slot="footer" style="--yk-cluster-justify: flex-end">
 *     <yk-button>Edit</yk-button>
 *   </yk-cluster>
 * </yk-card>
 * ```
 */
import { ensureShadow } from '../dsd.js';
import sheet from './yk-card.css' with { type: 'css' };

class YKCard extends HTMLElement {
  constructor() {
    super();
    ensureShadow(this, {
      styles: [sheet],
      render: (root) => {
        root.innerHTML = `
      <div part="header"><slot name="header"></slot></div>
      <div part="body"><slot></slot></div>
      <div part="footer"><slot name="footer"></slot></div>
    `;
      },
    });
    this.#trackPresence('header');
    this.#trackPresence('footer');
  }

  // Mirrors whether a named slot has content onto a host attribute, because a
  // slot's assigned content lives in the light tree and cannot be matched from
  // this stylesheet (there is no cross-boundary `:has()`). Any assigned element
  // counts as content, so an explicitly placed empty element still shows the
  // region.
  #trackPresence(name) {
    const slot = this.shadowRoot.querySelector(`slot[name="${name}"]`);
    slot.addEventListener('slotchange', () => {
      this.toggleAttribute(`has-${name}`, slot.assignedElements().length > 0);
    });
  }
}

if (!customElements.get('yk-card')) {
  customElements.define('yk-card', YKCard);
}
