/**
 * Link that renders like a yk-button.
 *
 * The host renders its children inside a native `<a>` kept in Shadow DOM and
 * shares yk-button's face styles through button-core.css; `variant` selects
 * the tone and design tokens restyle it without class names. Link attributes
 * (href, target, rel, download) are mirrored onto the internal anchor, so
 * navigation stays entirely native.
 *
 * ```html
 * <script type="module" src="./index.js"></script>
 * <yk-link href="/pricing" variant="primary">See pricing</yk-link>
 * <yk-link href="https://example.com" target="_blank" rel="noopener">Docs</yk-link>
 * ```
 */
import coreSheet from './button-core.css' with { type: 'css' };
import sheet from './yk-link.css' with { type: 'css' };

class YKLink extends HTMLElement {
  static observedAttributes = ['href', 'target', 'rel', 'download'];

  #anchor;

  constructor() {
    super();
    const shadowRoot = this.attachShadow({
      mode: 'open',
      delegatesFocus: true,
    });
    shadowRoot.adoptedStyleSheets = [coreSheet, sheet];
    shadowRoot.innerHTML = `<a part="link"><slot></slot></a>`;
    this.#anchor = shadowRoot.querySelector('a');
  }

  attributeChangedCallback(name) {
    const value = this.getAttribute(name);
    if (value === null) {
      this.#anchor.removeAttribute(name);
    } else {
      this.#anchor.setAttribute(name, value);
    }
  }

  get href() {
    return this.getAttribute('href') ?? '';
  }

  set href(value) {
    this.setAttribute('href', value);
  }

  get target() {
    return this.getAttribute('target') ?? '';
  }

  set target(value) {
    this.setAttribute('target', value);
  }

  get rel() {
    return this.getAttribute('rel') ?? '';
  }

  set rel(value) {
    this.setAttribute('rel', value);
  }

  get download() {
    return this.getAttribute('download') ?? '';
  }

  set download(value) {
    this.setAttribute('download', value);
  }
}

if (!customElements.get('yk-link')) {
  customElements.define('yk-link', YKLink);
}
