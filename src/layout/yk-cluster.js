/**
 * Layout primitive that places its children in a wrapping horizontal flow,
 * centered by default.
 *
 * When the children exceed the container width they wrap onto new lines,
 * making the element ideal for tags, toolbars, or arbitrary groups that
 * should stay centered as one block. Justification and alignment are driven
 * by design tokens (CSS custom properties), so no class names are required.
 *
 * ```html
 * <script type="module" src="./index.js"></script>
 * <yk-cluster>
 *   <button>Tag one</button>
 *   <button>Tag two</button>
 *   <button>Tag three</button>
 * </yk-cluster>
 * ```
 */
import sheet from './yk-cluster.css' with { type: 'css' };

class YKCluster extends HTMLElement {
  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.adoptedStyleSheets = [sheet];
    shadowRoot.innerHTML = `<slot></slot>`;
  }
}

if (!customElements.get('yk-cluster')) {
  customElements.define('yk-cluster', YKCluster);
}
