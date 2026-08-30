# yk-elements

Zero-config Web Components library. Just put, just works.

Structured, self-organizing layout and UI emerge just by placing HTML tags — no
class names, no scripting. Built directly on Web standard APIs (Custom Elements
v1, Shadow DOM v1, CSS Module Scripts, ElementInternals) with no framework
dependency and no build step.

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

Once the package is installed (`npm install yk-elements`), import the entry
point or individual components through the package exports:

```html
<link rel="stylesheet" href="yk-elements/tokens.css" />
<script type="module">
  import 'yk-elements';
  // or a single component:
  // import 'yk-elements/layout/yk-vstack.js';
</script>
```

### Customize

Design tokens defined on `:root` (see `tokens.css`) or on any ancestor element
are inherited by components. Local overrides work the same way:

```html
<yk-vstack style="--yk-vstack-gap: 2rem">
  <h2>Title</h2>
  <p>Paragraph</p>
</yk-vstack>
```

## Development

```bash
npm run test   # run tests (Vitest Browser Mode, Chromium headless)
npm run lint   # lint and check formatting (Biome)
npm run format # format all files (Biome)
```

## Browser support

Components load their styles via CSS Module Scripts
(`import ... with { type: 'css' }`), which requires current versions of Chrome,
Edge, Safari, and Firefox.
