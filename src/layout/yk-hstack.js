/**
 * Layout primitive that stacks its children horizontally with a consistent gap.
 *
 * The element is fully self-organizing: spacing is driven by design tokens
 * (CSS custom properties), so no class names or scripting are required at the
 * call site.
 *
 * ```html
 * <script type="module" src="./index.js"></script>
 * <yk-hstack>
 *   <a href="#">Home</a>
 *   <a href="#">Docs</a>
 *   <a href="#">About</a>
 * </yk-hstack>
 * ```
 */
import { ensureShadow } from '../dsd.js';
import sheet from './yk-hstack.css' with { type: 'css' };

class YKHstack extends HTMLElement {
  constructor() {
    super();
    ensureShadow(this, {
      styles: [sheet],
      render: (root) => {
        root.innerHTML = `<slot></slot>`;
      },
    });
  }
}

if (!customElements.get('yk-hstack')) {
  customElements.define('yk-hstack', YKHstack);
}
