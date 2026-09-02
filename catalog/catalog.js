/**
 * Shared chrome for the yk-elements component catalog.
 *
 * Load it on every catalog page. It owns the single source of truth for the
 * component list and renders three pieces of shared chrome from it:
 *
 * - the sidebar navigation (brand + Overview + one link per component),
 *   marking the current page as active based on the URL
 * - the component cards on the landing page (catalog/index.html), which
 *   hosts a [data-landing] container
 * - the header (title + description) on each component page, whose <body>
 *   carries data-component="yk-xxx"
 *
 * Adding a component means adding one entry here plus one HTML page that
 * lists its variations. The variations are hand-written; everything else
 * comes from this module.
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
  `;
}

function renderLanding() {
  const landing = document.querySelector('[data-landing]');
  if (!landing) return;
  landing.innerHTML = components
    .map(
      ({ tag, description }) => `
    <a class="catalog__card" href="${pageFor(tag)}">
      <h2 class="catalog__cardTitle">&lt;${tag}&gt;</h2>
      <p class="catalogDescription">${description}</p>
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
    <h1 class="catalog__componentTitle">&lt;${tag}&gt;</h1>
    <p class="catalogDescription">${component.description}</p>
  `;
}

const rowsFor = (items) =>
  items
    .map(
      ({ name, default: fallback, description }) => `
      <tr>
        <td class="catalog__propertyName">${name}</td>
        <td class="catalog__propertyDefault">${fallback}</td>
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
    ? `<h2 class="catalog__interfaceTitle">Interface</h2>${groups.join('')}`
    : '';
}

renderSidebar();
renderLanding();
renderComponentHeader();
renderInterface();
