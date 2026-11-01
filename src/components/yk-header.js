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
 * The bar follows its own width through a container query: above 48rem it is
 * a single row, and below it the links move into an inline panel under the bar
 * that the hamburger opens. `open` reflects that panel, so a server or
 * framework can render it, and the `menu-label` slot localizes the hamburger's
 * accessible name.
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
 *   <span slot="menu-label">メニュー</span>
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
  static observedAttributes = ['open', 'nav-label', 'brand-href'];

  #regions = [];

  #brandLink;

  #toggle;

  #nav;

  constructor() {
    super();
    const shadowRoot = ensureShadow(this, {
      styles: [sheet],
      render: (root) => {
        // The toggle precedes the navigation so Tab from the toggle enters the
        // panel it just opened; CSS order restores the visual placement.
        root.innerHTML = `
      <header part="header">
        <div part="bar">
          <div part="brand">
            <a part="brand-link"><slot name="brand"></slot></a>
          </div>
          <button part="toggle" type="button" aria-label="Menu" aria-expanded="false" aria-controls="nav">
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M3 5h14M3 10h14M3 15h14" />
            </svg>
          </button>
          <slot name="menu-label" hidden>Menu</slot>
          <nav part="nav" id="nav" aria-label="Main navigation">
            <slot></slot>
          </nav>
          <div part="actions"><slot name="actions"></slot></div>
        </div>
      </header>
    `;
      },
    });
    this.#brandLink = shadowRoot.querySelector('[part="brand-link"]');
    this.#nav = shadowRoot.querySelector('[part="nav"]');
    this.#toggle = shadowRoot.querySelector('[part="toggle"]');
    // Sync the attribute-driven state before wiring slots, so a hand-written
    // declarative template with an unexpected shape cannot leave the mirrored
    // href unsanitized behind a thrown error.
    this.#syncNavLabel();
    this.#syncBrandHref();
    this.#syncOpen();
    this.#trackEmptiness('brand', 'slot[name="brand"]');
    this.#trackEmptiness('nav', 'slot:not([name])');
    this.#trackEmptiness('actions', 'slot[name="actions"]');
    this.#toggle?.addEventListener('click', () => this.toggleAttribute('open'));
    const labelSlot = shadowRoot.querySelector('slot[name="menu-label"]');
    labelSlot?.addEventListener('slotchange', () => this.#nameToggle());
    this.#nameToggle();
    this.addEventListener('keydown', (event) => this.#onKeydown(event));
    this.addEventListener('click', (event) => this.#onClick(event));
  }

  connectedCallback() {
    // The light DOM that decides the empty-* state is already present at
    // upgrade, so apply it before the first slot assignment settles. Attribute
    // reactions cover the observed attributes on upgrade and on later writes.
    for (const { region, slot } of this.#regions) {
      this.#syncEmptiness(region, slot);
    }
    this.#nameToggle();
    this.#syncOpen();
  }

  attributeChangedCallback(name) {
    if (name === 'open') {
      this.#syncOpen();
    } else if (name === 'nav-label') {
      this.#syncNavLabel();
    } else if (name === 'brand-href') {
      this.#syncBrandHref();
    }
  }

  #syncOpen() {
    if (!this.#toggle) return;
    this.#toggle.setAttribute(
      'aria-expanded',
      String(this.hasAttribute('open')),
    );
  }

  #nameToggle() {
    const slot = this.shadowRoot.querySelector('slot[name="menu-label"]');
    if (!this.#toggle || !slot) return;
    const assigned = slot
      .assignedNodes()
      .find((node) => (node.textContent ?? '').trim() !== '');
    this.#toggle.setAttribute(
      'aria-label',
      (assigned?.textContent ?? slot.textContent).trim(),
    );
  }

  #onKeydown(event) {
    if (event.key !== 'Escape' || event.defaultPrevented) return;
    if (!this.hasAttribute('open')) return;
    // Focus returns to the toggle only when it was inside the disclosed
    // panel; an Escape from an action control must not move focus. The
    // composed path reaches the slotted links, which are not DOM descendants
    // of the shadow nav.
    const insidePanel = event.composedPath().includes(this.#nav);
    this.removeAttribute('open');
    // The toggle is display:none in the wide layout, so focus() is a no-op
    // there and the focus stays wherever the user left it.
    if (insidePanel) this.#toggle?.focus();
  }

  // Selecting a link closes the collapsed panel. The check walks the composed
  // path so a yk-link's internal anchor, which is not the event target here,
  // closes it too.
  #onClick(event) {
    if (!this.hasAttribute('open')) return;
    const onLink = event
      .composedPath()
      .some((node) => node instanceof HTMLAnchorElement);
    if (onLink) this.removeAttribute('open');
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
