# yk-elements

Zero-config Web Components library. Just put, just works.

Structured, self-organizing layout and UI emerge just by placing HTML tags — no
class names, no scripting. Built directly on Web standard APIs (Custom Elements
v1, Shadow DOM v1, CSS Module Scripts, ElementInternals) with no framework
dependency. Consumers never need a build step: the source modules run in the
browser as-is, and a minified copy ships in `dist/` for CDN delivery.

See [docs/concept.md](docs/concept.md) for the core design concept.

## Getting Started

### Prerequisites

- Node.js >= 22

### Run the tests

```bash
npm install
npx playwright install chromium # first time only
npm test
```

### Use in a page

```html
<link rel="stylesheet" href="path/to/yk-elements/tokens.css" />
<script type="module" src="path/to/yk-elements/index.js"></script>

<yk-vstack>
  <h2>Title</h2>
  <p>First paragraph</p>
  <p>Second paragraph</p>
</yk-vstack>
```

Importing `index.js` self-registers every component. Components can also be
imported individually, for example
`import 'path/to/yk-elements/src/layout/yk-vstack.js'`.

### Use from npm

Once the package is installed (`npm install @yykamei/yk-elements`), import the
entry point or individual components through the package exports:

```html
<link rel="stylesheet" href="@yykamei/yk-elements/tokens.css" />
<script type="module">
  import '@yykamei/yk-elements';
  // or a single component:
  // import '@yykamei/yk-elements/layout/yk-vstack.js';
</script>
```

### Use from a CDN

Load the minified entry point from a CDN such as unpkg or jsDelivr. Importing
`dist/index.js` self-registers every component:

```html
<link rel="stylesheet" href="https://unpkg.com/@yykamei/yk-elements@0.1.0/dist/tokens.css" />
<script type="module" src="https://unpkg.com/@yykamei/yk-elements@0.1.0/dist/index.js"></script>

<yk-vstack>
  <h2>Title</h2>
  <p>First paragraph</p>
  <p>Second paragraph</p>
</yk-vstack>
```

`dist/` mirrors the source tree with minified files, so `dist/index.js`,
`dist/tokens.css`, and individual component modules such as
`dist/src/layout/yk-vstack.js` resolve relative to each other. The unminified
source files (`index.js`, `src/`) are served the same way.

### Customize

Design tokens defined on `:root` (see `tokens.css`) or on any ancestor element
are inherited by components. Local overrides work the same way:

```html
<yk-vstack style="--yk-vstack-gap: 2rem">
  <h2>Title</h2>
  <p>Paragraph</p>
</yk-vstack>
```

### Theming

`tokens.css` follows the operating system color scheme by default
(`color-scheme: light dark`). `<yk-theme-switcher>` lets a visitor choose
System, Light, or Dark; the choice is stored in `localStorage` under
`yk-theme` and applied as `data-theme` on the root element. Load
`yk-theme-init.js` render-blocking in the head so a stored choice is applied
before the first paint:

```html
<head>
  <meta name="color-scheme" content="light dark" />
  <link rel="stylesheet" href="path/to/yk-elements/tokens.css" />
  <script type="module" src="path/to/yk-elements/src/components/yk-theme-init.js" blocking="render"></script>
</head>
<body>
  <script type="module" src="path/to/yk-elements/index.js"></script>
  <yk-theme-switcher></yk-theme-switcher>
</body>
```

`blocking="render"` is honored by current Chromium and Safari; Firefox ignores
it, so an explicit stored choice may flash briefly there. The default System
preference never flashes because the stylesheet already follows the OS. The
options are icon-only and carry built-in accessible names (Theme, System,
Light, and Dark); the names are not configurable, so a site that needs other
wording should build its own control on `theme.js`.

Two attributes adjust where the choice lives:

- `theme="light|dark|system"` names the theme explicitly, taking precedence
  over the stored preference. Selecting an option updates the attribute, so a
  framework can render the value and read the applied theme back from the DOM.
- `ephemeral` keeps the preference in memory for this page view only, without
  reading or writing the configured store.

```html
<yk-theme-switcher theme="dark"></yk-theme-switcher>
<yk-theme-switcher ephemeral></yk-theme-switcher>
```

Both attributes describe the document rather than a single element: the theme
is applied to the root element and stored in one place, so instances on the
same page should agree. While any connected switcher is ephemeral, the whole
page keeps the preference in memory; persistence returns when the last one
disconnects. A declared theme is applied and stored (unless `ephemeral`), so a
server-rendered value also becomes the local preference.

A server or framework that owns the choice can render `data-theme` on the root
element (tokens.css maps it onto `color-scheme`) together with the element's
`theme` attribute, and add `ephemeral` so the page never touches localStorage:

```html
<html data-theme="dark">
  <body>
    <yk-theme-switcher theme="dark" ephemeral></yk-theme-switcher>
  </body>
</html>
```

Listen for `yk-theme-change` (`detail: { preference, resolved }`) to save the
choice to a user profile. To persist somewhere else, replace the store
(`store: null` restores the built-in localStorage store):

```html
<script type="module">
  import { configureTheme } from 'path/to/yk-elements/src/components/theme.js';
  configureTheme({
    store: {
      read: () =>
        document.cookie
          .split('; ')
          .find((entry) => entry.startsWith('theme='))
          ?.slice('theme='.length) ?? null,
      write: (value) => {
        const secure = location.protocol === 'https:' ? '; Secure' : '';
        document.cookie = `theme=${value}; path=/; max-age=31536000; SameSite=Lax${secure}`;
      },
    },
  });
</script>
```

Scope the cookie to the app (for example `__Host-yk-theme` on HTTPS, which is
host-bound and requires `Secure`), and serve per-cookie responses with
`Vary: Cookie` so a shared cache cannot hand one visitor's theme to another.
The built-in store is the single `yk-theme` key scoped to the origin; on an
origin shared with other apps, use a custom store or namespace it there.

## Component catalog

Browse the component catalog at
`https://yykamei.github.io/yk-elements/` (once GitHub Pages is enabled and
the deploy workflow has run). To preview locally, serve the repository root
and open `/catalog/`:

```bash
npm run preview
# open http://localhost:3000/catalog/
```

Each component page opens with an interactive Playground: change the
component's attributes or CSS custom properties and the preview and
generated markup update live. Copy the markup to start from the
configuration you built in the browser.

## Development

```bash
npm run build  # minify source into dist/ (also runs before test and publish)
npm run test   # run tests (Vitest Browser Mode, Chromium headless)
npm run lint   # lint and check formatting (Biome)
npm run format # format all files (Biome)
```

## Browser support

Components load their styles via CSS Module Scripts
(`import ... with { type: 'css' }`), which requires current versions of Chrome,
Edge, Safari, and Firefox.

`<yk-soft-nav>` enables cross-document view transitions between pages that
place it. The fade transition requires Chrome 126+, Edge 126+, or Safari
18.2+ — Firefox ignores the opt-in and navigates as before. The placement
page's `blocking="render"` scripts (honored by Chromium) keep the opt-in in
place before the first paint.
