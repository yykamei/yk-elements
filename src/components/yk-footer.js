/**
 * Page footer landmark with a brand row, a responsive grid of link groups, and
 * a legal bar.
 *
 * `brand` and `secondary` share the header row, the default slot is the grid
 * for `yk-footer-links` columns, and `copyright` and `legal` share the bottom
 * bar. A region with no assigned elements or non-whitespace text collapses
 * after upgrade; filled regions are never hidden, so a server-rendered
 * template keeps its content from the first paint. Legal anchors use the
 * shared footer link tokens, while brand anchors keep the footer's body
 * typography, so put legal links straight in the `legal` slot.
 *
 * The content is capped at 64rem and centered, while the background spans the
 * host, so placing the element outside a page container yields a full-width
 * band. Importing `index.js` registers this element together with
 * `yk-footer-links`; an individual import needs both modules.
 *
 * ```html
 * <script type="module" src="./index.js"></script>
 * <yk-footer>
 *   <a slot="brand" href="/">Example</a>
 *   <yk-footer-links heading="Learn">
 *     <a href="/guide">Guide</a>
 *   </yk-footer-links>
 *   <span slot="copyright">© 2026 Example</span>
 *   <a slot="legal" href="/terms">Terms</a>
 * </yk-footer>
 * ```
 */
import { ensureShadow } from '../dsd.js';
import coreSheet from './footer-core.css' with { type: 'css' };
import sheet from './yk-footer.css' with { type: 'css' };

class YKFooter extends HTMLElement {
  #regions = [];

  constructor() {
    super();
    ensureShadow(this, {
      styles: [coreSheet, sheet],
      render: (root) => {
        root.innerHTML = `
      <footer part="footer">
        <div part="inner">
          <div part="header">
            <div part="brand"><slot name="brand"></slot></div>
            <div part="secondary"><slot name="secondary"></slot></div>
          </div>
          <div part="main"><slot></slot></div>
          <div part="bottom">
            <div part="copyright"><slot name="copyright"></slot></div>
            <div part="legal"><slot name="legal"></slot></div>
          </div>
        </div>
      </footer>
    `;
      },
    });
    this.#trackEmptiness(
      'header',
      'slot[name="brand"], slot[name="secondary"]',
    );
    this.#trackEmptiness('main', 'slot:not([name])');
    this.#trackEmptiness(
      'bottom',
      'slot[name="copyright"], slot[name="legal"]',
    );
  }

  connectedCallback() {
    // Setting attributes is not allowed in the constructor, so the initial
    // state is applied once the element connects, when the light DOM content
    // that decides it is already present.
    for (const { region, slots } of this.#regions) {
      this.#syncEmptiness(region, slots);
    }
  }

  // Regions disappear only once the slot assignment proves them empty. The
  // inverse of yk-card's presence attributes keeps filled regions visible
  // before upgrade, which is what a Declarative Shadow DOM template needs.
  #trackEmptiness(region, selector) {
    const slots = [...this.shadowRoot.querySelectorAll(selector)];
    const sync = () => this.#syncEmptiness(region, slots);
    for (const slot of slots) slot.addEventListener('slotchange', sync);
    this.#regions.push({ region, slots });
  }

  #syncEmptiness(region, slots) {
    const hasContent = (slot) =>
      slot
        .assignedNodes({ flatten: true })
        .some(
          (node) =>
            node.nodeType === Node.ELEMENT_NODE ||
            (node.nodeType === Node.TEXT_NODE &&
              node.textContent.trim() !== ''),
        );
    this.toggleAttribute(
      `empty-${region}`,
      slots.every((slot) => !hasContent(slot)),
    );
  }
}

if (!customElements.get('yk-footer')) {
  customElements.define('yk-footer', YKFooter);
}
