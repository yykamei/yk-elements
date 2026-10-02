/**
 * Theme controller shared by every yk-elements theme surface.
 *
 * It owns the single source of truth for a visitor's theme preference: how the
 * preference is persisted, how `system` resolves through the operating system
 * setting, and how the resolved theme reaches the document. The resolved theme
 * is written to `data-theme` on the root element, where tokens.css maps it onto
 * `color-scheme` (see tokens.css for that contract). Changes are announced with
 * a `yk-theme-change` event carrying `{ preference, resolved }`.
 *
 * `<yk-theme-switcher>` drives this controller, the pre-paint entry
 * `yk-theme-init.js` restores the stored preference before first paint, and an
 * application can replace the persistence layer or turn persistence off
 * without touching either.
 *
 * ```js
 * import { configureTheme, setPreference } from './theme.js';
 *
 * // Persist the preference in a cookie instead of localStorage.
 * const store = {
 *   read: () =>
 *     document.cookie
 *       .split('; ')
 *       .find((entry) => entry.startsWith('theme='))
 *       ?.slice('theme='.length) ?? null,
 *   write: (value) => {
 *     const secure = location.protocol === 'https:' ? '; Secure' : '';
 *     document.cookie = `theme=${value}; path=/; max-age=31536000; SameSite=Lax${secure}`;
 *   },
 * };
 * configureTheme({ store });
 * setPreference('dark');
 * ```
 */
export const THEMES = Object.freeze(['system', 'light', 'dark']);

const KEY = 'yk-theme';
const ATTRIBUTE = 'data-theme';
const CHANGE_EVENT = 'yk-theme-change';
const DARK_QUERY = '(prefers-color-scheme: dark)';

/**
 * The built-in store: localStorage under the fixed `yk-theme` key. Reads and
 * writes are guarded because storage access can throw when it is disabled by
 * policy or unavailable in private browsing; a failed access falls back to
 * `system` for the session instead of breaking the page.
 */
function localStorageStore() {
  return {
    read() {
      try {
        return localStorage.getItem(KEY);
      } catch {
        return null;
      }
    },
    write(value) {
      try {
        localStorage.setItem(KEY, value);
      } catch {
        // The preference still applies to this page view.
      }
    },
  };
}

/**
 * Resolves a preference to the theme that is actually painted. `system` defers
 * to the operating system setting; an explicit `light` or `dark` is returned
 * as is.
 */
function resolveTheme(preference) {
  if (preference === 'light' || preference === 'dark') {
    return preference;
  }
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

/**
 * Holds the mutable state behind the module's exported functions so no binding
 * at module scope is ever reassigned. One instance (below) owns the configured
 * store and persistence mode, the preference kept while persistence is off,
 * the last announced application, and the MediaQueryList the system listener
 * is attached to.
 *
 * ```js
 * // One instance backs the exported functions below. Do not create another:
 * // each instance attaches its own window storage listener.
 * const controller = new ThemeController();
 * export function setPreference(preference) {
 *   controller.setPreference(preference);
 * }
 * ```
 */
class ThemeController {
  #store = localStorageStore();

  #persist = true;

  #memory = null;

  #applied = null;

  #media = null;

  constructor() {
    // Another tab changing the stored preference is reported through the
    // storage event; cookie and custom stores have no equivalent, so they stay
    // per-document. The listener reads the live persistence mode.
    window.addEventListener('storage', (event) => {
      if (this.#persist && event.key === KEY) {
        this.apply();
      }
    });
  }

  /**
   * Returns the stored preference, falling back to `system` for anything
   * absent or unrecognized (a corrupted value, an older schema, storage
   * disabled).
   */
  getPreference() {
    const stored = this.#readPreference();
    return THEMES.includes(stored) ? stored : 'system';
  }

  /**
   * Resolves the current preference and writes the theme to the root element,
   * reporting the change with `yk-theme-change` when the effective theme,
   * preference, or both differ from the last application.
   */
  apply() {
    this.#syncSystemListener();

    const preference = this.getPreference();
    const resolved = resolveTheme(preference);
    // Compare against the live attribute, not the cached application: another
    // script may have set or cleared data-theme since the last call.
    if (document.documentElement.getAttribute(ATTRIBUTE) !== resolved) {
      document.documentElement.setAttribute(ATTRIBUTE, resolved);
    }
    if (
      preference === this.#applied?.preference &&
      resolved === this.#applied?.resolved
    ) {
      return;
    }

    this.#applied = { preference, resolved };
    document.documentElement.dispatchEvent(
      new CustomEvent(CHANGE_EVENT, {
        bubbles: true,
        composed: true,
        detail: { preference, resolved },
      }),
    );
  }

  /**
   * Stores `preference` (one of `THEMES`) and applies it. Unrecognized values
   * are ignored, matching the read-side fallback to `system`.
   */
  setPreference(preference) {
    if (!THEMES.includes(preference)) return;
    try {
      if (this.#persist) {
        this.#store.write(preference);
      } else {
        this.#memory = preference;
      }
    } catch {
      // A failing store must not stop the theme from applying.
    }
    this.apply();
  }

  /**
   * Reconfigures persistence and re-applies the theme when anything changed.
   *
   * - `store` installs a custom store such as a cookie adapter; `store: null`
   *   restores the built-in localStorage store.
   * - `persist: false` keeps the preference in memory only, without reading or
   *   writing the configured store; `persist: true` returns to that store.
   */
  configure({ store, persist } = {}) {
    const storeChanged = store !== undefined;
    const persistChanged =
      typeof persist === 'boolean' && persist !== this.#persist;
    if (storeChanged) {
      this.#store = store ?? localStorageStore();
    }
    if (persistChanged) {
      if (!persist) {
        // Entering memory-only mode: carry the preference currently in effect
        // into the in-memory slot, so switching modes never resets the page or
        // drops a declared theme. This reads module state, not the store.
        const current = this.#applied?.preference;
        this.#memory = THEMES.includes(current) ? current : null;
      }
      this.#persist = persist;
    }
    if (storeChanged || persistChanged) this.apply();
  }

  #readPreference() {
    if (!this.#persist) return this.#memory;
    try {
      return this.#store.read();
    } catch {
      return null;
    }
  }

  // The change listener follows whatever MediaQueryList matchMedia hands out,
  // so a replaced implementation (an embedding page, a test double) keeps
  // working rather than leaving the listener attached to a stale object.
  #syncSystemListener() {
    const media = window.matchMedia(DARK_QUERY);
    if (media === this.#media) return;
    this.#media?.removeEventListener('change', this.#onSystemChange);
    this.#media = media;
    media.addEventListener('change', this.#onSystemChange);
  }

  #onSystemChange = () => {
    if (this.getPreference() === 'system') {
      this.apply();
    }
  };
}

const controller = new ThemeController();

export function getPreference() {
  return controller.getPreference();
}

export function applyTheme() {
  controller.apply();
}

export function setPreference(preference) {
  controller.setPreference(preference);
}

export function configureTheme(options) {
  controller.configure(options);
}
