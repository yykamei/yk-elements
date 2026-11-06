/**
 * Labeled statistic that pairs a small label with a prominent value, used for
 * summary panels and dashboards.
 *
 * Put the label in the `label` slot and the value in the `value` slot. Both
 * slots are expected; the component does not synthesize a label or value. The
 * component renders a description list, styles the value as the prominent
 * value, and exposes design tokens for the gap and both text styles.
 *
 * ```html
 * <script type="module" src="./index.js"></script>
 * <yk-stat>
 *   <span slot="label">Learning targets</span>
 *   <span slot="value">128</span>
 * </yk-stat>
 * ```
 */
import '../base.js';
import { ensureShadow } from '../dsd.js';
import sheet from './yk-stat.css' with { type: 'css' };

class YKStat extends HTMLElement {
  constructor() {
    super();
    ensureShadow(this, {
      styles: [sheet],
      render: (root) => {
        root.innerHTML = `
      <dl part="stat">
        <dt part="label"><slot name="label"></slot></dt>
        <dd part="value"><slot name="value"></slot></dd>
      </dl>
    `;
      },
    });
  }
}

if (!customElements.get('yk-stat')) {
  customElements.define('yk-stat', YKStat);
}
