/**
 * Page header landmark with a brand lockup, primary navigation links, and
 * trailing actions.
 *
 * `brand` holds the logo or wordmark and is wrapped in the home link named by
 * `brand-href` (the link has no href without it). The default slot holds plain
 * anchors as the primary navigation, and `actions` holds utilities such as
 * `yk-theme-switcher` or `yk-button`. The component renders the `<nav>`
 * landmark itself, so links stay native anchors; set `nav-label` to rename the
 * landmark. Set `sticky` to pin the bar to the top of the scroll container.
 * A `brand-href` using `javascript:`, `data:`, or `vbscript:` is not mirrored,
 * matching `yk-link`, so a dynamically bound value cannot become a script
 * vector.
 *
 * Empty regions collapse, and the bar is capped at 64rem and centered while
 * its background spans the host, so placing the element outside a page
 * container yields a full-width band.
 *
 * ```html
 * <script type="module" src="./index.js"></script>
 * <yk-header sticky brand-href="/">
 *   <img slot="brand" src="/logo.svg" alt="Example" width="120" height="32" />
 *   <a href="/docs">Docs</a>
 *   <a href="/pricing">Pricing</a>
 *   <yk-theme-switcher slot="actions"></yk-theme-switcher>
 * </yk-header>
 * ```
 */
import '../base.js';
import { ensureShadow } from '../dsd.js';
import sheet from './yk-header.css' with { type: 'css' };

// Mirrors yk-link's deny-list so a brand link cannot run script either. Only
// the schemes the component must never activate are enumerated; custom
// deep-link schemes stay usable.
const UNSAFE_SCHEMES = new Set(['javascript:', 'data:', 'vbscript:']);

function isSafeHref(value) {
  try {
    // The reserved .invalid TLD never resolves, so only the parsed scheme is
    // read; parsing also normalizes case and embedded whitespace.
    const { protocol } = new URL(value, 'https://yk.invalid/');
    return !UNSAFE_SCHEMES.has(protocol);
  } catch {
    return false;
  }
}

class YKHeader extends HTMLElement {
  static observedAttributes = ['nav-label', 'brand-href'];

  #regions = [];

  #brandLink;

  #nav;

  constructor() {
    super();
    const shadowRoot = ensureShadow(this, {
      styles: [sheet],
      render: (root) => {
        root.innerHTML = `
      <header part="header">
        <div part="bar">
          <div part="brand">
            <a part="brand-link"><slot name="brand"></slot></a>
          </div>
          <nav part="nav" aria-label="Main navigation"><slot></slot></nav>
          <div part="actions"><slot name="actions"></slot></div>
        </div>
      </header>
    `;
      },
    });
    this.#brandLink = shadowRoot.querySelector('[part="brand-link"]');
    this.#nav = shadowRoot.querySelector('[part="nav"]');
    // Sync the attribute-driven state before wiring slots, so a hand-written
    // declarative template with an unexpected shape cannot leave the mirrored
    // href unsanitized behind a thrown error.
    this.#syncNavLabel();
    this.#syncBrandHref();
    this.#trackEmptiness('brand', 'slot[name="brand"]');
    this.#trackEmptiness('nav', 'slot:not([name])');
    this.#trackEmptiness('actions', 'slot[name="actions"]');
  }

  connectedCallback() {
    // The light DOM that decides the empty-* state is already present at
    // upgrade, so apply it before the first slot assignment settles. Attribute
    // reactions cover nav-label and brand-href on upgrade and on later writes.
    for (const { region, slot } of this.#regions) {
      this.#syncEmptiness(region, slot);
    }
  }

  attributeChangedCallback(name) {
    if (name === 'nav-label') {
      this.#syncNavLabel();
    } else if (name === 'brand-href') {
      this.#syncBrandHref();
    }
  }

  #syncNavLabel() {
    if (!this.#nav) return;
    const label = (this.getAttribute('nav-label') ?? '').trim();
    this.#nav.setAttribute('aria-label', label || 'Main navigation');
  }

  // Without a usable brand-href the anchor loses its href and stops being a
  // link, so a header whose brand is not a navigation target does not steal a
  // tab stop, and an unsafe scheme never reaches the anchor.
  #syncBrandHref() {
    if (!this.#brandLink) return;
    const href = (this.getAttribute('brand-href') ?? '').trim();
    if (href === '' || !isSafeHref(href)) {
      this.#brandLink.removeAttribute('href');
    } else {
      this.#brandLink.setAttribute('href', href);
    }
  }

  #trackEmptiness(region, selector) {
    const slot = this.shadowRoot.querySelector(selector);
    if (!slot) return;
    slot.addEventListener('slotchange', () =>
      this.#syncEmptiness(region, slot),
    );
    this.#regions.push({ region, slot });
  }

  // Hiding a region from CSS needs a host attribute: assigned content lives in
  // the light tree and a slot cannot be matched from this stylesheet. The
  // empty-* form keeps filled regions visible before upgrade, which is what a
  // Declarative Shadow DOM template needs.
  #syncEmptiness(region, slot) {
    const hasContent = slot
      .assignedNodes({ flatten: true })
      .some(
        (node) =>
          node.nodeType === Node.ELEMENT_NODE ||
          (node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== ''),
      );
    this.toggleAttribute(`empty-${region}`, !hasContent);
  }
}

if (!customElements.get('yk-header')) {
  customElements.define('yk-header', YKHeader);
}
