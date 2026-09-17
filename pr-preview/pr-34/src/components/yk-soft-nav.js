/**
 * Opts the current document into cross-document (multi-page) view
 * transitions, so navigating between pages fades instead of repainting with
 * a visible flash.
 *
 * The component is declarative glue around the platform's `@view-transition`
 * CSS at-rule: connecting the element adds a constructable stylesheet with
 * `navigation: auto` to the document, and disconnecting the last connected
 * instance removes it. It renders nothing itself. Transitions only fire for
 * same-origin, user-initiated navigations between pages that both opt in, so
 * place the element on **every page** that should take part. Browsers without
 * cross-document view transition support (currently Firefox) silently ignore
 * the rule and navigate as before — placement is never harmful. The opt-in
 * is keyed to the module's document, the single-document case a browser page
 * normally presents.
 *
 * Install it after the library entry point:
 *
 * ```html
 * <script type="module" src="./index.js"></script>
 * <yk-soft-nav></yk-soft-nav>
 * ```
 */
// One shared stylesheet per realm, counted by placement.
const optInSheet = new CSSStyleSheet();
optInSheet.replaceSync(`
  @view-transition {
    navigation: auto;
  }
  @media (prefers-reduced-motion: reduce) {
    ::view-transition-group(*),
    ::view-transition-old(*),
    ::view-transition-new(*) {
      animation: none;
    }
  }
`);

let placements = 0;

class YKSoftNav extends HTMLElement {
  connectedCallback() {
    // Presence check instead of relying on the count alone, so state survives
    // external code replacing document.adoptedStyleSheets wholesale.
    if (!document.adoptedStyleSheets.includes(optInSheet)) {
      document.adoptedStyleSheets = [
        ...document.adoptedStyleSheets,
        optInSheet,
      ];
    }
    placements += 1;
  }

  disconnectedCallback() {
    placements -= 1;
    if (placements === 0) {
      document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
        (sheet) => sheet !== optInSheet,
      );
    }
  }
}

if (!customElements.get('yk-soft-nav')) {
  customElements.define('yk-soft-nav', YKSoftNav);
}
