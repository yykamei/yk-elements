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
 * The store used while persistence is off: the preference lives in memory for
 * the lifetime of the document and never reaches storage.
 */
function memoryStore() {
  let value = null;
  return {
    read() {
      return value;
    },
    write(next) {
      value = next;
    },
  };
}

let configuration = { store: localStorageStore(), persist: true };
let memory = memoryStore();
let applied = null;
let listenedMedia = null;

function activeStore() {
  return configuration.persist ? configuration.store : memory;
}

function storedValue() {
  try {
    return activeStore().read();
  } catch {
    return null;
  }
}

/**
 * Returns the stored preference, falling back to `system` for anything absent
 * or unrecognized (a corrupted value, an older schema, storage disabled).
 */
export function getPreference() {
  const stored = storedValue();
  return THEMES.includes(stored) ? stored : 'system';
}

function resolveTheme(preference) {
  if (preference === 'light' || preference === 'dark') {
    return preference;
  }
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

function onSystemChange() {
  if (getPreference() === 'system') {
    applyTheme();
  }
}

// The change listener follows whatever MediaQueryList matchMedia hands out, so
// a replaced implementation (an embedding page, a test double) keeps working
// rather than leaving the listener attached to a stale object.
function syncSystemListener() {
  const media = window.matchMedia(DARK_QUERY);
  if (media === listenedMedia) return;
  listenedMedia?.removeEventListener('change', onSystemChange);
  listenedMedia = media;
  media.addEventListener('change', onSystemChange);
}

/**
 * Resolves the current preference and writes the theme to the root element,
 * reporting the change with `yk-theme-change` when the effective theme,
 * preference, or both differ from the last application.
 */
export function applyTheme() {
  syncSystemListener();

  const preference = getPreference();
  const resolved = resolveTheme(preference);
  // Compare against the live attribute, not the cached application: another
  // script may have set or cleared data-theme since the last call.
  if (document.documentElement.getAttribute(ATTRIBUTE) !== resolved) {
    document.documentElement.setAttribute(ATTRIBUTE, resolved);
  }
  if (preference === applied?.preference && resolved === applied?.resolved) {
    return;
  }

  applied = { preference, resolved };
  document.documentElement.dispatchEvent(
    new CustomEvent(CHANGE_EVENT, {
      bubbles: true,
      composed: true,
      detail: { preference, resolved },
    }),
  );
}

/**
 * Stores `preference` (one of `THEMES`) and applies it. Unrecognized values are
 * ignored, matching the read-side fallback to `system`.
 */
export function setPreference(preference) {
  if (!THEMES.includes(preference)) return;
  try {
    activeStore().write(preference);
  } catch {
    // A failing store must not stop the theme from applying.
  }
  applyTheme();
}

/**
 * Reconfigures persistence and re-applies the theme when anything changed.
 *
 * - `store` installs a custom store such as a cookie adapter; `store: null`
 *   restores the built-in localStorage store.
 * - `persist: false` keeps the preference in memory only, without reading or
 *   writing the configured store; `persist: true` returns to that store.
 */
export function configureTheme({ store, persist } = {}) {
  let changed = false;
  if (store !== undefined) {
    configuration = { ...configuration, store: store ?? localStorageStore() };
    changed = true;
  }
  if (typeof persist === 'boolean' && persist !== configuration.persist) {
    if (!persist) {
      // Entering memory-only mode: carry the preference currently in effect
      // into the in-memory store, so switching modes never resets the page or
      // drops a declared theme. This reads module state, not the store.
      const current = applied?.preference;
      memory = memoryStore();
      if (THEMES.includes(current)) {
        memory.write(current);
      }
    }
    configuration = { ...configuration, persist };
    changed = true;
  }
  if (changed) applyTheme();
}

// Another tab changing the stored preference is reported through the storage
// event; cookie and custom stores have no equivalent, so they stay per-document.
window.addEventListener('storage', (event) => {
  if (configuration.persist && event.key === KEY) {
    applyTheme();
  }
});
