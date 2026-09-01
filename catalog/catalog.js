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
  },
  {
    tag: 'yk-hstack',
    description:
      'Layout primitive that stacks its children horizontally with a consistent gap.',
  },
  {
    tag: 'yk-cluster',
    description:
      'Layout primitive that places children in a centered, wrapping horizontal flow.',
  },
  {
    tag: 'yk-grid',
    description:
      'Layout primitive that places children in an auto-equal-width grid.',
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

renderSidebar();
renderLanding();
renderComponentHeader();
