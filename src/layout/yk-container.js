/**
 * Layout primitive that constrains content to a readable max width with
 * horizontal centering and side gutters.
 *
 * Wide pages built only with yk-vstack stretch full-width; this element caps
 * the inline size and centers the content, keeping a minimum distance from
 * the viewport edges. Narrower sections override the width locally instead
 * of needing a separate component.
 *
 * ```html
 * <script type="module" src="./index.js"></script>
 * <yk-container>
 *   <yk-vstack>
 *     <h2>Title</h2>
 *     <p>First paragraph</p>
 *   </yk-vstack>
 * </yk-container>
 * ```
 */
import sheet from './yk-container.css' with { type: 'css' };

class YKContainer extends HTMLElement {
  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.adoptedStyleSheets = [sheet];
    shadowRoot.innerHTML = `<slot></slot>`;
  }
}

if (!customElements.get('yk-container')) {
  customElements.define('yk-container', YKContainer);
}
