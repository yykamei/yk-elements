/**
 * Inline message in the style of Bootstrap's alert, used to surface validation
 * errors and other feedback next to the content it belongs to.
 *
 * `variant` picks the tone (danger, warning, success, or info; the default is
 * info), which tints the background, border, and text. The text mixes the tone
 * with black in the light scheme and white in the dark scheme so it stays
 * readable. Add `dismissible` for a close button: activating it dispatches a
 * cancelable `yk-alert-dismiss` event and, unless the event is canceled,
 * removes the element. The close button's accessible name comes from the
 * `dismiss-label` slot and defaults to "Dismiss", so it localizes like the file
 * field's labels.
 *
 * The component sets no ARIA role: add `role="alert"` on the host for a message
 * that must be announced immediately, or leave it off for passive messages.
 *
 * ```html
 * <script type="module" src="./index.js"></script>
 * <yk-alert variant="danger" role="alert">
 *   The target is not in the example sentence.
 * </yk-alert>
 * <yk-alert variant="warning" dismissible>
 *   <span slot="dismiss-label">閉じる</span>
 *   This target already exists.
 * </yk-alert>
 * ```
 */
import '../base.js';
import { ensureShadow } from '../dsd.js';
import sheet from './yk-alert.css' with { type: 'css' };

class YKAlert extends HTMLElement {
  constructor() {
    super();
    const shadowRoot = ensureShadow(this, {
      styles: [sheet],
      render: (root) => {
        root.innerHTML = `
      <div part="content"><slot></slot></div>
      <button part="dismiss" type="button">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </button>
      <slot name="dismiss-label" hidden>Dismiss</slot>
    `;
      },
    });
    const labelSlot = shadowRoot.querySelector('slot[name="dismiss-label"]');
    const dismiss = shadowRoot.querySelector('[part="dismiss"]');
    labelSlot.addEventListener('slotchange', () => this.#nameDismiss(dismiss));
    this.#nameDismiss(dismiss);
    dismiss.addEventListener('click', () => this.#dismiss());
  }

  #dismiss() {
    const proceed = this.dispatchEvent(
      new CustomEvent('yk-alert-dismiss', {
        bubbles: true,
        composed: true,
        cancelable: true,
      }),
    );
    if (proceed) {
      this.remove();
    }
  }

  #nameDismiss(dismiss) {
    const slot = this.shadowRoot.querySelector('slot[name="dismiss-label"]');
    const assigned = slot.assignedNodes().find((node) => node.textContent);
    dismiss.setAttribute(
      'aria-label',
      (assigned?.textContent ?? slot.textContent).trim(),
    );
  }
}

if (!customElements.get('yk-alert')) {
  customElements.define('yk-alert', YKAlert);
}
