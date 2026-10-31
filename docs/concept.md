# Web Components Library — Core Design Concept

## 1. Core Philosophy

- **Zero Config, Just Put** — no class names or complex scripting required; structured, self-organizing layout and UI emerge just by placing HTML tags.
- **One Load, Whole Look** — importing the entry point (or any single component) installs the design tokens and page-level normalization on the document. Consumers do not assemble optional stylesheets; the page adopts the yk-elements baseline for spacing, typography, colors, and box-sizing, and overrides it with ordinary CSS when needed.
- **Lean & Native-First** — use Web standard APIs (Custom Elements v1, Shadow DOM v1, CSS Module Scripts, ElementInternals) directly and reject unnecessary framework dependencies. Abstraction is earned, not anticipated: while identical behavior lives in a single component it is left alone, and once it repeats across components it is extracted into a shared core (e.g. `input-core.css` and the `YKFieldElement`/`YKInputElement` base classes behind the form fields) instead of being copied further.
- **Clear File Separation** — keep JavaScript and CSS clearly separated into distinct files to maximize the benefits of editor syntax highlighting, code completion, linters, and formatters.
- **Self-Registering** — self-contained modules that automatically call `customElements.define` as soon as the module is loaded.

---

## 2. Architecture and Separation of Responsibilities

To avoid excessive JavaScript geometry computation (forced synchronous layout / layout thrashing) and balance performance with maintainability, responsibilities are separated into three layers:

```
+-------------------------------------------------------------+
| 1. Layout Layer (primitive placement)                       |
|    - <yk-vstack>, <yk-cluster>, <yk-grid>, <yk-pad>         |
|    - Role: gap, wrapping, alignment (CSS Flex/Grid),        |
|      padding (CSS inset)                                    |
+-------------------------------------------------------------+
                              | (contains)
+-------------------------------------------------------------+
| 2. Component Layer (standalone UI)                          |
|    - <yk-card>, <yk-button>, <yk-badge>, etc.               |
|    - Role: encapsulate internals (Shadow DOM),              |
|      composition via slots                                  |
+-------------------------------------------------------------+
                              | (coordinate)
+-------------------------------------------------------------+
| 3. Coordination Layer (state & notifications)               |
|    - Role: declare state via ElementInternals.states        |
|      (:state()); loosely coupled notification via           |
|      CustomEvent (composed: true)                           |
+-------------------------------------------------------------+
```

---

## 3. Styling and File Separation Conventions

1. **Stylesheet loading via CSS Module Scripts**
   - All styles are written in standalone `.css` files and imported from JavaScript as `import sheet from './xxx.css' with { type: 'css' };`.
   - The imported `CSSStyleSheet` object is assigned to `shadowRoot.adoptedStyleSheets = [sheet]`, maximizing memory efficiency and parse performance.

2. **Transparent design token inheritance (CSS Custom Properties)**
   - Hardcoding direct fixed values inside components (color codes, fixed pixel spacing) is prohibited.
   - All properties are written as `var(--yk-*, fallback)` so that design tokens set on the global `:root` or a parent element are inherited transparently.

3. **Open structure (slots) and extension hooks (CSS Shadow Parts)**
   - Internal content can be freely injected from the call site via `<slot>`.
   - Elements that need localized style overrides from outside are given `part="..."`, allowing safe customization via `::part()`.

4. **Automatic page-level base styles**
   - `src/base.js` imports `tokens.css` and `src/normalize.css` as CSS Module Scripts and adopts both on `document.adoptedStyleSheets` exactly once per document.
   - Every component module imports the shared `src/base.js` as `'../base.js'`, so the entry point and selective imports install the same baseline. `index.js` imports it first.
   - Normalization removes the body margin and the user-agent block margins, applies the token typography and colors, and uses `box-sizing: border-box` for ordinary content. Layout primitive hosts keep their own box model so `yk-container` can keep its content-box gutters.
   - The normalization sheet uses `:where()`. Both sheets live in the low-priority `yk-elements` cascade layer family, so unlayered application CSS overrides them without specificity work; a layered application declares `@layer yk-elements;` before its own layers.
   - `tokens.css` remains a published standalone file for CSS-only first-paint token colors, but it is not a required consumer link.

---

## 4. Implementation Templates

Every component module starts with `import '../base.js';`, so importing a
single component installs the page-level base styles too.

### A. Layout Primitive implementation example (`<yk-vstack>`)

A layout component specialized for vertical spacing control.

#### `src/layout/yk-vstack.css`

```css
:host {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: var(--yk-vstack-gap, var(--yk-space-md, 1rem));
}
```

#### `src/layout/yk-vstack.js`

```javascript
import '../base.js';
import sheet from './yk-vstack.css' with { type: 'css' };

class YKVstack extends HTMLElement {
  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.adoptedStyleSheets = [sheet];
    shadowRoot.innerHTML = `<slot></slot>`;
  }
}

if (!customElements.get('yk-vstack')) {
  customElements.define('yk-vstack', YKVstack);
}
```

---

### B. State-Aware Component implementation example (`<yk-toggle-card>`)

A component that declares its own state to the browser and notifies the outside.

#### `src/components/yk-toggle-card.css`

```css
:host {
  display: block;
  padding: var(--yk-card-padding, var(--yk-space-md, 1rem));
  background-color: var(--yk-card-bg, var(--yk-surface, #ffffff));
  color: var(--yk-card-color, var(--yk-text-primary, inherit));
  border: 1px solid var(--yk-card-border, var(--yk-border-color, #e0e0e0));
  border-radius: var(--yk-card-radius, var(--yk-radius-md, 4px));
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

:host(:state(active)) {
  border-color: var(--yk-color-primary, #0066cc);
  box-shadow: 0 0 0 1px var(--yk-color-primary, #0066cc);
}
```

#### `src/components/yk-toggle-card.js`

```javascript
import '../base.js';
import sheet from './yk-toggle-card.css' with { type: 'css' };

class YKToggleCard extends HTMLElement {
  constructor() {
    super();
    this.internals = this.attachInternals();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.adoptedStyleSheets = [sheet];
    shadowRoot.innerHTML = `<slot></slot>`;
  }

  connectedCallback() {
    this.addEventListener('click', () => this.toggle());
  }

  toggle() {
    const isActive = this.internals.states.has('active');
    if (isActive) {
      this.internals.states.delete('active');
    } else {
      this.internals.states.add('active');
    }

    this.dispatchEvent(
      new CustomEvent('yk-toggle', {
        bubbles: true,
        composed: true,
        detail: { active: !isActive },
      }),
    );
  }
}

if (!customElements.get('yk-toggle-card')) {
  customElements.define('yk-toggle-card', YKToggleCard);
}
```

---

## 5. Directory Structure

```text
yk-elements/
├── tokens.css                  # Design tokens; auto-installed, exported for CSS-only paint
├── fouc.css                    # Optional pre-upgrade layout fallbacks
├── src/
│   ├── base.js                 # Installs tokens + normalization once per document
│   ├── normalize.css           # Page-level UA normalization
│   ├── layout/
│   │   ├── yk-vstack.css
│   │   ├── yk-vstack.js        # Vertical stack
│   │   ├── yk-cluster.css
│   │   ├── yk-cluster.js       # Horizontal alignment & wrapping
│   │   ├── yk-grid.css
│   │   ├── yk-grid.js          # Auto equal-width grid
│   │   ├── yk-pad.css
│   │   └── yk-pad.js           # Consistent inset from the host edges
│   └── components/
│       ├── yk-toggle-card.css
│       ├── yk-toggle-card.js
│       ├── yk-badge.css
│       └── yk-badge.js
└── index.js                    # Single entry point importing all components
```

---

## 6. Distribution

The source tree is the single source of truth. Consumers in a browser or on a
bundler import these files directly as ESM modules (`index.js`, `src/**`),
relying on CSS Module Scripts and custom element self-registration — no
consumer-side build step is involved.

For CDN delivery, a minified mirror of the same tree is generated under
`dist/` by `npm run build` (via esbuild). Each file is minified in place
without bundling, so relative imports and `with { type: 'css' }` imports keep
resolving. The build is internal to this package: the source files remain the
authored, readable versions and are the ones served from npm.

`fouc.css` is an optional companion stylesheet: it mirrors the layout
primitives' host styles onto their undefined tags, reducing layout shift before
the modules run. It is not a substitute for Declarative Shadow DOM, which
remains the only way to paint a fully styled shadow root before script
execution.

`src/base.js` is the single entry for page-level styles. Importing it (which
every component module does) adopts `tokens.css` and `src/normalize.css` on the
document once, so consumers do not link a reset stylesheet. The normalization
removes the body margin and user-agent block margins, applies the token
typography and colors, and sets border-box for ordinary content while layout
primitive hosts keep their own box model. Both sheets sit in the low-priority
`yk-elements` cascade layer family, so unlayered application CSS overrides
them; a layered application declares `@layer yk-elements;` before its own
layers.

`tokens.css` remains a published stylesheet for CSS-only first-paint token
colors and preloading, but it is not a required link. `fouc.css` remains an
optional pre-upgrade fallback for layout; neither stylesheet is a substitute
for Declarative Shadow DOM.

---

## References

- [WHATWG HTML Standard: Custom elements](https://html.spec.whatwg.org/multipage/custom-elements.html)
- [TC39: Import Attributes Specification](https://tc39.es/proposal-import-attributes/)
- [CSS Module Scripts (web.dev)](https://web.dev/articles/css-module-scripts)
- [MDN Web Docs: ShadowRoot.adoptedStyleSheets](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot/adoptedStyleSheets)
- [MDN Web Docs: CustomStateSet](https://developer.mozilla.org/en-US/docs/Web/API/CustomStateSet)
- [MDN Web Docs: ElementInternals](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals)
- [Every Layout: Relearn CSS layout by example](https://every-layout.dev/)
