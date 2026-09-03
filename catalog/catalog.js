/**
 * Shared chrome for the yk-elements component catalog.
 *
 * Load it on every catalog page. It owns the single source of truth for the
 * component list and the design tokens, and renders the catalog's shared
 * chrome from them:
 *
 * - the sidebar navigation (brand + Overview + one link per component),
 *   marking the current page as active based on the URL
 * - the component cards on the landing page (catalog/index.html), which
 *   hosts a [data-landing] container
 * - the header (title + description) on each component page, whose <body>
 *   carries data-component="yk-xxx"
 * - the Interface section on each component page, listing the component's
 *   configurable CSS custom properties
 * - the design-token table on the landing page, which hosts a [data-tokens]
 *   container linking back from each component's property defaults
 *
 * Adding a component means adding one entry here plus one HTML page that
 * lists its variations. The variations are hand-written; everything else
 * comes from this module.
 *
 * The catalog dogfoods the library: spacing between siblings is owned by
 * yk-vstack / yk-grid parents and demo insets by yk-pad. The sidebar nav
 * keeps its own flex CSS because neither yk-vstack nor yk-cluster can switch
 * between a vertical stack and a wrapping row in the mobile media query
 * (direction is encapsulated in Shadow DOM).
 *
 * ```html
 * <aside class="catalog__sidebar" data-sidebar></aside>
 * <script type="module" src="./catalog.js"></script>
 * ```
 */
export const components = [
  {
    tag: 'yk-vstack',
    description:
      'Layout primitive that stacks its children vertically with a consistent gap.',
    cssProperties: [
      {
        name: '--yk-vstack-gap',
        default: 'var(--yk-space-md, 1rem)',
        description: 'Spacing between adjacent children.',
      },
    ],
    attributes: [],
  },
  {
    tag: 'yk-hstack',
    description:
      'Layout primitive that stacks its children horizontally with a consistent gap.',
    cssProperties: [
      {
        name: '--yk-hstack-gap',
        default: 'var(--yk-space-md, 1rem)',
        description: 'Spacing between adjacent children.',
      },
    ],
    attributes: [],
  },
  {
    tag: 'yk-cluster',
    description:
      'Layout primitive that places children in a centered, wrapping horizontal flow.',
    cssProperties: [
      {
        name: '--yk-cluster-justify',
        default: 'center',
        description:
          'Main-axis alignment of children (any CSS justify-content value).',
      },
      {
        name: '--yk-cluster-align',
        default: 'center',
        description:
          'Cross-axis alignment of children (any CSS align-items value).',
      },
      {
        name: '--yk-cluster-gap',
        default: 'var(--yk-space-md, 1rem)',
        description: 'Spacing between adjacent children.',
      },
    ],
    attributes: [],
  },
  {
    tag: 'yk-grid',
    description:
      'Layout primitive that places children in an auto-equal-width grid.',
    cssProperties: [
      {
        name: '--yk-grid-min',
        default: '20rem',
        description: 'Minimum column width; columns wrap below it.',
      },
      {
        name: '--yk-grid-gap',
        default: 'var(--yk-space-md, 1rem)',
        description: 'Spacing between grid tracks.',
      },
    ],
    attributes: [],
  },
  {
    tag: 'yk-pad',
    description:
      'Layout primitive that pads its children with a consistent inset from the host edges.',
    cssProperties: [
      {
        name: '--yk-pad-padding',
        default: 'var(--yk-space-md, 1rem)',
        description: 'Uniform inset from the host edges to the children.',
      },
      {
        name: '--yk-pad-padding-block',
        default: 'var(--yk-pad-padding, var(--yk-space-md, 1rem))',
        description:
          'Vertical inset; overrides --yk-pad-padding on the block axis.',
      },
      {
        name: '--yk-pad-padding-inline',
        default: 'var(--yk-pad-padding, var(--yk-space-md, 1rem))',
        description:
          'Horizontal inset; overrides --yk-pad-padding on the inline axis.',
      },
    ],
    attributes: [],
  },
];

export const tokens = [
  {
    name: '--yk-space-sm',
    value: '0.5rem',
    description: 'Small spacing unit; used for tight gaps and insets.',
  },
  {
    name: '--yk-space-md',
    value: '1rem',
    description:
      'Default spacing unit; the fallback default for component gaps and insets.',
  },
  {
    name: '--yk-space-lg',
    value: '1.5rem',
    description: 'Large spacing unit; used for roomier paddings and gaps.',
  },
];

const pageFor = (tag) => `./${tag}.html`;

function currentComponent() {
  const filename = location.pathname.split('/').pop() || 'index.html';
  if (filename === 'index.html') return null;
  const tag = filename.replace(/\.html$/, '');
  return components.some(({ tag: known }) => known === tag) ? tag : null;
}

function renderSidebar() {
  const sidebar = document.querySelector('[data-sidebar]');
  if (!sidebar) return;
  const current = currentComponent();
  const linkClass = (active) =>
    active ? 'catalog__navLink catalog__navLink--active' : 'catalog__navLink';
  sidebar.innerHTML = `
    <yk-vstack style="--yk-vstack-gap: var(--yk-space-md)">
      <a class="catalog__brand" href="./index.html">yk-elements</a>
      <nav class="catalog__nav" aria-label="Components">
        <a class="${linkClass(current === null)}" href="./index.html">Overview</a>
        ${components
          .map(
            ({ tag }) => `
        <a class="${linkClass(current === tag)}" href="${pageFor(tag)}">&lt;${tag}&gt;</a>`,
          )
          .join('')}
      </nav>
    </yk-vstack>
  `;
}

function renderLanding() {
  // Descriptions are trusted internal strings; escape them if they ever
  // become external or author-supplied input.
  const landing = document.querySelector('[data-landing]');
  if (!landing) return;
  landing.innerHTML = components
    .map(
      ({ tag, description }) => `
    <a class="catalog__card" href="${pageFor(tag)}">
      <yk-vstack style="--yk-vstack-gap: var(--yk-space-sm)">
        <h2 class="catalog__cardTitle">&lt;${tag}&gt;</h2>
        <p class="catalogDescription">${description}</p>
      </yk-vstack>
    </a>`,
    )
    .join('');
}

function renderComponentHeader() {
  const header = document.querySelector('[data-component-header]');
  const tag = document.body.dataset.component;
  if (!header || !tag) return;
  const component = components.find(({ tag: known }) => known === tag);
  if (!component) return;
  header.innerHTML = `
    <yk-vstack style="--yk-vstack-gap: var(--yk-space-sm)">
      <h1 class="catalog__componentTitle">&lt;${tag}&gt;</h1>
      <p class="catalogDescription">${component.description}</p>
    </yk-vstack>
  `;
}

/**
 * Replaces every occurrence of a known token name with a link to its row in
 * the landing-page token table.
 *
 * A single regex pass over the original text keeps overlapping token names
 * (e.g. `--yk-space` and `--yk-space-md`) from matching inside the `<a>` tag
 * inserted for a longer name. The alternation is ordered by descending length
 * so the longest name is always matched first.
 */
const linkTokens = (() => {
  const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const anchors = new Map(
    tokens.map(({ name }) => [name, `./index.html#${name.slice(2)}`]),
  );
  const pattern = new RegExp(
    [...anchors.keys()]
      .sort((a, b) => b.length - a.length)
      .map(escapeRegex)
      .join('|'),
    'g',
  );
  return (text) =>
    text.replace(
      pattern,
      (name) =>
        `<a class="catalog__tokenLink" href="${anchors.get(name)}">${name}</a>`,
    );
})();

const rowsFor = (items) =>
  items
    .map(
      ({ name, default: fallback, description }) => `
      <tr>
        <td class="catalog__propertyName">${name}</td>
        <td class="catalog__propertyDefault">${linkTokens(fallback)}</td>
        <td>${description}</td>
      </tr>`,
    )
    .join('');

function renderInterface() {
  const section = document.querySelector('[data-interface]');
  const tag = document.body.dataset.component;
  if (!section || !tag) return;
  const component = components.find(({ tag: known }) => known === tag);
  if (!component) return;

  const groups = [];
  if (component.cssProperties.length) {
    groups.push(`
      <table class="catalog__interfaceTable catalog__propertyTable">
        <caption class="catalog__interfaceCaption">CSS custom properties</caption>
        <thead>
          <tr><th>Property</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>${rowsFor(component.cssProperties)}</tbody>
      </table>`);
  }
  if (component.attributes.length) {
    groups.push(`
      <table class="catalog__interfaceTable catalog__attributeTable">
        <caption class="catalog__interfaceCaption">HTML attributes</caption>
        <thead>
          <tr><th>Attribute</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>${rowsFor(component.attributes)}</tbody>
      </table>`);
  }

  section.innerHTML = groups.length
    ? `<yk-vstack style="--yk-vstack-gap: var(--yk-space-sm)">` +
      `<h2 class="catalog__interfaceTitle">Interface</h2>${groups.join('')}</yk-vstack>`
    : '';
}

function renderTokens() {
  const section = document.querySelector('[data-tokens]');
  if (!section) return;
  section.innerHTML = `
    <yk-vstack style="--yk-vstack-gap: var(--yk-space-sm)">
    <h2 class="catalog__tokensTitle">Design tokens</h2>
    <table class="catalog__interfaceTable catalog__tokensTable">
      <caption class="catalog__interfaceCaption">Design tokens</caption>
      <thead>
        <tr><th>Token</th><th>Value</th><th>Description</th></tr>
      </thead>
      <tbody>${tokens
        .map(
          ({ name, value, description }) => `
        <tr>
          <td class="catalog__propertyName" id="${name.slice(2)}">${name}</td>
          <td class="catalog__propertyDefault">${value}</td>
          <td>${description}</td>
        </tr>`,
        )
        .join('')}</tbody>
    </table>
    </yk-vstack>
  `;
}

renderSidebar();
renderLanding();
renderComponentHeader();
renderInterface();
renderTokens();
