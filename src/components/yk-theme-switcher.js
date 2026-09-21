/**
 * Three-way theme switcher for System, Light, and Dark themes.
 *
 * It renders an icon-only segmented control of native radio buttons, so
 * keyboard navigation, single-tab-stop behavior, and screen reader
 * announcements come from the platform; each segment carries a visually
 * hidden name for assistive technology. Selecting an option stores the
 * preference through the shared theme controller and applies it to the
 * document. Every instance on the page stays in sync, as does the system
 * option when the operating system setting changes.
 *
 * By default the preference is kept in localStorage under `yk-theme`. Two
 * attributes adjust that:
 *
 * - `theme="light|dark|system"` names the theme explicitly, taking precedence
 *   over the stored preference. It suits a framework or a server rendering the
 *   value (React state, a Rails user setting); selecting an option updates the
 *   attribute, so the markup stays in step with the applied theme.
 * - `ephemeral` keeps the preference in memory for this page view only,
 *   without reading or writing the configured store. Use it when a server or
 *   framework owns the choice.
 *
 * Both attributes describe the document, not one element: the theme is applied
 * to the root element and stored in one place, so instances on the same page
 * should agree. While any connected switcher is ephemeral, the whole page stays
 * in memory; persistence returns when the last one disconnects.
 *
 * Place it anywhere; pair it with `yk-theme-init.js` in the head so a stored
 * preference is restored before first paint. A server that renders `data-theme`
 * on the root element and declares the matching `theme` attribute needs no init
 * module:
 *
 * ```html
 * <script type="module" src="./yk-theme-init.js" blocking="render"></script>
 * <yk-theme-switcher></yk-theme-switcher>
 * <yk-theme-switcher theme="dark"></yk-theme-switcher>
 * <yk-theme-switcher theme="dark" ephemeral></yk-theme-switcher>
 * ```
 */

import {
  applyTheme,
  configureTheme,
  getPreference,
  setPreference,
  THEMES,
} from './theme.js';
import sheet from './yk-theme-switcher.css' with { type: 'css' };

const ICONS = {
  system:
    '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="3" width="12" height="8" rx="1" /><path d="M5 14h6M8 11v3" /></svg>',
  light:
    '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="3" /><path d="M8 1.5v1.25M8 13.25v1.25M2.575 3.575l.875.875M12.55 12.55l.875.875M1.5 8h1.25M13.25 8h1.25M3.575 12.55l.875-.875M12.55 3.575l.875-.875" /></svg>',
  dark: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13.2 10.6A5.5 5.5 0 015.4 2.8 6.5 6.5 0 1013.2 10.6z" /></svg>',
};

const LABELS = { system: 'System', light: 'Light', dark: 'Dark' };

// The switchers that asked for an in-memory preference. Persistence is
// document-wide, so it is off exactly while this set is not empty; deriving it
// from the connected instances keeps the mode from depending on connect order
// and from leaking after an ephemeral element disconnects.
const ephemeralHosts = new Set();

function refreshPersistence() {
  configureTheme({ persist: ephemeralHosts.size === 0 });
}

class YKThemeSwitcher extends HTMLElement {
  static observedAttributes = ['theme', 'ephemeral'];

  #radios = new Map();

  #initialized = false;

  #mirroring = false;

  #sync = () => {
    const preference = getPreference();
    for (const [value, input] of this.#radios) {
      input.checked = value === preference;
    }
    // A declared theme mirrors the effective preference, so the markup never
    // claims a theme other than the applied one. A switcher that never declared
    // one is left untouched here; it gains the attribute on the first selection.
    // #mirroring breaks the re-entrancy: setAttribute dispatches
    // attributeChangedCallback synchronously, which would otherwise apply the
    // preference again.
    if (
      this.hasAttribute('theme') &&
      this.getAttribute('theme') !== preference
    ) {
      this.#mirroring = true;
      this.setAttribute('theme', preference);
      this.#mirroring = false;
    }
  };

  #select = (event) => {
    // Setting the attribute drives the change through the callback below, so
    // a pick from the UI and a pick from a framework take the same path.
    if (event.target instanceof HTMLInputElement) {
      this.setAttribute('theme', event.target.value);
    }
  };

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.adoptedStyleSheets = [sheet];
    // The template is built from trusted internal constants only; no attribute
    // value is interpolated, so there is no injection path here.
    shadowRoot.innerHTML = `<div part="group" role="radiogroup" aria-label="Theme">${THEMES.map(
      (value) => `
        <label part="option">
          <input type="radio" name="theme" value="${value}">
          ${ICONS[value]}
          <span class="label">${LABELS[value]}</span>
        </label>`,
    ).join('')}
      </div>`;

    for (const input of shadowRoot.querySelectorAll('input')) {
      this.#radios.set(input.value, input);
    }
    shadowRoot.addEventListener('change', this.#select);
  }

  connectedCallback() {
    if (this.hasAttribute('ephemeral')) {
      ephemeralHosts.add(this);
    }
    // Persistence is configured before the declared theme is applied so that
    // `theme="dark" ephemeral` never writes to storage during upgrade.
    refreshPersistence();
    const declared = this.getAttribute('theme');
    if (THEMES.includes(declared)) {
      setPreference(declared);
    } else {
      applyTheme();
    }
    this.#initialized = true;
    this.#sync();
    document.addEventListener('yk-theme-change', this.#sync);
  }

  disconnectedCallback() {
    document.removeEventListener('yk-theme-change', this.#sync);
    if (ephemeralHosts.delete(this)) {
      refreshPersistence();
    }
  }

  attributeChangedCallback(name, _previous, value) {
    // Attributes present at upgrade are applied by connectedCallback, which
    // also registers the instance before configuring persistence.
    if (!this.#initialized) return;

    if (name === 'theme') {
      if (this.#mirroring) return;
      // An unrecognized value is ignored here; mirroring in #sync then replaces
      // it with the effective preference on the next application.
      if (THEMES.includes(value)) {
        setPreference(value);
      }
      return;
    }

    if (this.hasAttribute('ephemeral')) {
      ephemeralHosts.add(this);
    } else {
      ephemeralHosts.delete(this);
    }
    refreshPersistence();
  }
}

if (!customElements.get('yk-theme-switcher')) {
  customElements.define('yk-theme-switcher', YKThemeSwitcher);
}
