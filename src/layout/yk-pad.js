/**
 * Layout primitive that pads its children with a consistent inset from the
 * host's edges, keeping distance between content and its surroundings uniform.
 *
 * Child-to-child spacing is a separate concern handled by yk-vstack /
 * yk-hstack; this element only controls the outer inset, so it composes with
 * them instead of overlapping. The padding is driven by design tokens (CSS
 * custom properties), so no class names or scripting are required at the call
 * site.
 *
 * ```html
 * <script type="module" src="./index.js"></script>
 * <yk-pad>
 *   <yk-vstack>
 *     <h2>Title</h2>
 *     <p>First paragraph</p>
 *   </yk-vstack>
 * </yk-pad>
 * ```
 */
import '../base.js';
import { ensureShadow } from '../dsd.js';
import sheet from './yk-pad.css' with { type: 'css' };

class YKPad extends HTMLElement {
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

if (!customElements.get('yk-pad')) {
  customElements.define('yk-pad', YKPad);
}
