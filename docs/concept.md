# Web Components Library — Core Design Concept

## 1. Core Philosophy

- **Zero Config, Just Put** — no class names or complex scripting required; structured, self-organizing layout and UI emerge just by placing HTML tags.
- **Lean & Native-First** — reject excessive abstraction (early introduction of base classes, unnecessary framework dependencies) and use Web standard APIs (Custom Elements v1, Shadow DOM v1, CSS Module Scripts, ElementInternals) directly.
- **Clear File Separation** — keep JavaScript and CSS clearly separated into distinct files to maximize the benefits of editor syntax highlighting, code completion, linters, and formatters.
- **Self-Registering** — self-contained modules that automatically call `customElements.define` as soon as the module is loaded.

---

## 2. Architecture and Separation of Responsibilities

To avoid excessive JavaScript geometry computation (forced synchronous layout / layout thrashing) and balance performance with maintainability, responsibilities are separated into three layers:

```
+-------------------------------------------------------------+
| 1. Layout Layer (primitive placement)                       |
|    - <yk-vstack>, <yk-cluster>, <yk-grid>                   |
|    - Role: gap, wrapping, alignment (CSS Flex/Grid)         |
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

---

## 4. Implementation Templates

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
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}


:host(:state(active)) {
  border-color: var(--yk-color-primary, #0066cc);
  box-shadow: 0 0 0 1px var(--yk-color-primary, #0066cc);
}
```

#### `src/components/yk-toggle-card.js`

```javascript
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


    this.dispatchEvent(new CustomEvent('yk-toggle', {
      bubbles: true,
      composed: true,
      detail: { active: !isActive }
    }));
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
├── tokens.css                  # Site-wide design token definitions (:root)
├── src/
│   ├── layout/
│   │   ├── yk-vstack.css
│   │   ├── yk-vstack.js        # Vertical stack
│   │   ├── yk-cluster.css
│   │   ├── yk-cluster.js       # Horizontal alignment & wrapping
│   │   ├── yk-grid.css
│   │   └── yk-grid.js          # Auto equal-width grid
│   └── components/
│       ├── yk-toggle-card.css
│       ├── yk-toggle-card.js
│       ├── yk-badge.css
│       └── yk-badge.js
└── index.js                    # Single entry point importing all components
```

---

## References

- [WHATWG HTML Standard: Custom elements](https://html.spec.whatwg.org/multipage/custom-elements.html)
- [TC39: Import Attributes Specification](https://tc39.es/proposal-import-attributes/)
- [CSS Module Scripts (web.dev)](https://web.dev/articles/css-module-scripts)
- [MDN Web Docs: ShadowRoot.adoptedStyleSheets](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot/adoptedStyleSheets)
- [MDN Web Docs: CustomStateSet](https://developer.mozilla.org/en-US/docs/Web/API/CustomStateSet)
- [MDN Web Docs: ElementInternals](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals)
- [Every Layout: Relearn CSS layout by example](https://every-layout.dev/)
