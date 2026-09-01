/**
 * Layout primitive that places its children in an auto-equal-width grid.
 *
 * Columns are created with `auto-fill` so as many equal-width tracks as fit
 * appear on each row, using a minimum column width token (--yk-grid-min,
 * defaulting to 20rem). The container never overflows: when it is narrower
 * than one column, the track shrinks to the full width.
 *
 * ```html
 * <script type="module" src="./index.js"></script>
 * <yk-grid>
 *   <p>Card one</p>
 *   <p>Card two</p>
 *   <p>Card three</p>
 * </yk-grid>
 * ```
 */
import sheet from './yk-grid.css' with { type: 'css' };

class YKGrid extends HTMLElement {
  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.adoptedStyleSheets = [sheet];
    shadowRoot.innerHTML = `<slot></slot>`;
  }
}

if (!customElements.get('yk-grid')) {
  customElements.define('yk-grid', YKGrid);
}
