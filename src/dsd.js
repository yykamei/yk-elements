/**
 * Attaches a shadow root or reuses the Declarative Shadow DOM root the HTML
 * parser already attached, so a component paints styled on first parse and
 * only wires behavior once its module loads.
 *
 * When the host already has an open shadow root (a `<template
 * shadowrootmode="open">` child in the initial HTML), that root is kept and
 * returned: calling `attachShadow()` here would empty it. The given
 * stylesheets are still adopted so the hydrated root matches a
 * freshly-created one. Otherwise a new open root is attached and populated
 * by `render`.
 *
 * Declarative templates for focus-delegating components must carry the
 * `shadowrootdelegatesfocus` attribute, since delegation is fixed when the
 * parser creates the root and cannot be changed here.
 *
 * ```js
 * import { ensureShadow } from '../dsd.js';
 *
 * const shadowRoot = ensureShadow(this, {
 *   delegatesFocus: true,
 *   styles: [sheet],
 *   render: (root) => {
 *     root.innerHTML = `<button part="button" type="button"><slot></slot></button>`;
 *   },
 * });
 * ```
 */
export function ensureShadow(
  host,
  { delegatesFocus = false, styles = [], render },
) {
  const existing = host.shadowRoot;
  if (existing) {
    if (styles.length > 0) {
      existing.adoptedStyleSheets = [...existing.adoptedStyleSheets, ...styles];
    }
    return existing;
  }
  const root = host.attachShadow({
    mode: 'open',
    ...(delegatesFocus ? { delegatesFocus: true } : {}),
  });
  root.adoptedStyleSheets = styles;
  render(root);
  return root;
}
