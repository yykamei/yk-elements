/**
 * Layout primitive that stacks its children vertically with a consistent gap.
 *
 * The element is fully self-organizing: spacing and alignment are driven by
 * design tokens (CSS custom properties), so no class names or scripting are
 * required at the call site.
 *
 * ```html
 * <script type="module" src="./index.js"></script>
 * <yk-vstack>
 *   <h2>Title</h2>
 *   <p>First paragraph</p>
 *   <p>Second paragraph</p>
 * </yk-vstack>
 * ```
 */
import sheet from './yk-vstack.css' with { type: 'css' };

class YKVstack extends HTMLElement {
  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.adoptedStyleSheets = [sheet];
    shadowRoot.innerHTML = `<slot></slot>`;
  }
}

if (!customElements.get('yk-vstack')) {
  customElements.define('yk-vstack', YKVstack);
}
