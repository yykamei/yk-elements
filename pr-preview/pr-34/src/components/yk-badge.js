/**
 * Small status label in the style of Bootstrap's .badge.
 *
 * The host itself is the badge: styles live on :host, so the label scales
 * with the surrounding font size through em units. `variant` switches the
 * solid tone (primary or danger; the default face is the secondary tone)
 * and design tokens restyle it without class names. `pill` rounds the
 * corners fully, like Bootstrap's .rounded-pill.
 *
 * ```html
 * <script type="module" src="./index.js"></script>
 * <yk-badge>New</yk-badge>
 * <yk-badge variant="primary">Beta</yk-badge>
 * <yk-badge variant="danger" pill>99+</yk-badge>
 * ```
 */
import sheet from './yk-badge.css' with { type: 'css' };

class YKBadge extends HTMLElement {
  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.adoptedStyleSheets = [sheet];
    shadowRoot.innerHTML = `<slot></slot>`;
  }
}

if (!customElements.get('yk-badge')) {
  customElements.define('yk-badge', YKBadge);
}
