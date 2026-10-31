/**
 * Bordered row for a repeatable form group, with a trash-can remove button on
 * the right.
 *
 * Place the row's fields in the light DOM; the component supplies the shared
 * surface and the remove affordance. The button centers vertically against
 * short rows and top-aligns once the content is taller than 88px, so tall
 * rows keep the control near their labels; this follows the spirit of
 * Material Design's list-item rule. The `remove-label` attribute names the
 * icon-only remove button and falls back to the label declared on the closest
 * `<yk-field-list>`, then to "Remove item". Activating the button dispatches a
 * cancelable `yk-field-list-item-remove` event (`detail.item` is the host) and
 * removes the row unless the event is canceled, so a page can keep a
 * server-rendered row and submit its own destroy flag instead. Setting
 * `hidden` hides the row. The companion list calls `refreshRemoveLabel()`
 * after changing its own `remove-label`, so rows inherit the new wording.
 *
 * ```html
 * <script type="module" src="./index.js"></script>
 * <yk-field-list-item remove-label="Remove this example">
 *   <label>Text <yk-textarea name="examples[][text]"></yk-textarea></label>
 * </yk-field-list-item>
 * ```
 */
import '../base.js';
import { ensureShadow } from '../dsd.js';
import sheet from './yk-field-list-item.css' with { type: 'css' };

const DEFAULT_REMOVE_LABEL = 'Remove item';

// Rows whose content is taller than this top-align the trailing icon;
// shorter rows center it.
const TOP_ALIGN_THRESHOLD = 88;

const removeIcon = `
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M6 2.75h4M3.25 4.5h9.5M4.5 4.5l.5 8.25a1 1 0 0 0 1 .75h4a1 1 0 0 0 1-.75l.5-8.25M6.75 7v4M9.25 7v4" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
`;

class YKFieldListItem extends HTMLElement {
  static observedAttributes = ['remove-label'];

  #content;

  #remove;

  #resizeObserver;

  constructor() {
    super();
    const shadowRoot = ensureShadow(this, {
      styles: [sheet],
      render: (root) => {
        root.innerHTML = `
      <div part="content"><slot></slot></div>
      <button part="remove" type="button" aria-label="${DEFAULT_REMOVE_LABEL}">
        ${removeIcon}
      </button>
    `;
      },
    });
    this.#content = shadowRoot.querySelector('[part="content"]');
    this.#remove = shadowRoot.querySelector('[part="remove"]');
    this.#remove.addEventListener('click', () => this.#requestRemove());
    this.#resizeObserver = new ResizeObserver(([entry]) => {
      this.toggleAttribute(
        'data-top-aligned',
        entry.contentRect.height > TOP_ALIGN_THRESHOLD,
      );
    });
    this.#syncRemoveLabel();
  }

  connectedCallback() {
    // The closest list's label is only available once the row is connected.
    this.#syncRemoveLabel();
    // The observer's initial callback measures after layout, so alignment
    // needs no eager layout read here.
    this.#resizeObserver.observe(this.#content);
  }

  disconnectedCallback() {
    this.#resizeObserver.disconnect();
  }

  attributeChangedCallback() {
    this.#syncRemoveLabel();
  }

  // Re-reads the fallback label after the closest list changes its wording.
  refreshRemoveLabel() {
    this.#syncRemoveLabel();
  }

  #syncRemoveLabel() {
    const label =
      this.getAttribute('remove-label') ||
      this.closest('yk-field-list')?.getAttribute('remove-label') ||
      DEFAULT_REMOVE_LABEL;
    this.#remove.setAttribute('aria-label', label);
  }

  #requestRemove() {
    const proceed = this.dispatchEvent(
      new CustomEvent('yk-field-list-item-remove', {
        bubbles: true,
        composed: true,
        cancelable: true,
        detail: { item: this },
      }),
    );
    if (proceed) {
      this.remove();
    }
  }
}

if (!customElements.get('yk-field-list-item')) {
  customElements.define('yk-field-list-item', YKFieldListItem);
}
