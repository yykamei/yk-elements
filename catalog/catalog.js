/**
 * Shared chrome for the yk-elements component catalog.
 *
 * Load it on every catalog page. It owns the single source of truth for the
 * component list and the design tokens, and renders the catalog's shared
 * chrome from them:
 *
 * - the sidebar navigation (brand + Overview + one section per category,
 *   each holding one link per component), marking the current page as
 *   active based on the URL via the platform's own aria-current state
 * - the component cards on the landing page (catalog/index.html), which
 *   hosts a [data-landing] container and groups the cards into one section
 *   per category
 * - the header (title + description) on each component page, whose <body>
 *   carries data-component="yk-xxx"
 * - the Interface section on each component page, listing the component's
 *   configurable CSS custom properties
 * - the design-token table on the landing page, which hosts a [data-tokens]
 *   container linking back from each component's property defaults
 *
 * The component list is also the schema for the interactive playground: each
 * attribute declares a `control` kind (`boolean`, `select`, or `text`) and,
 * for selects, the `options` it offers, while each component declares the
 * initial `playground.content` it renders. `content` is trusted internal
 * markup used as the playground element's children (empty for childless
 * inputs such as the yk-input-* fields).
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
 * <aside data-sidebar></aside>
 * <script type="module" src="./catalog.js"></script>
 * ```
 */
const buttonFaceProperties = [
  {
    name: '--yk-button-padding-block',
    default: 'var(--yk-space-sm, 0.5rem)',
    description: 'Vertical padding of the face.',
  },
  {
    name: '--yk-button-padding-inline',
    default: 'var(--yk-space-md, 1rem)',
    description: 'Horizontal padding of the face.',
  },
  {
    name: '--yk-button-radius',
    default: 'var(--yk-radius-md, 0.375rem)',
    description: 'Corner radius of the face.',
  },
  {
    name: '--yk-button-bg',
    default: '#fff',
    description: 'Background of the default light face.',
  },
  {
    name: '--yk-button-color',
    default: 'oklch(26.2% 0.009 248.2)',
    description: 'Text color of the default light face.',
  },
  {
    name: '--yk-button-border-color',
    default:
      'color-mix(in oklch, var(--yk-color-secondary, oklch(55.8% 0.016 244.9)) 40%, white)',
    description: 'Border color of the default light face.',
  },
  {
    name: '--yk-button-on-tone',
    default: '#fff',
    description: 'Text color on the solid tone faces.',
  },
];

const inputFaceProperties = [
  {
    name: '--yk-input-padding-block',
    default: '0.375rem',
    description: 'Vertical padding of the face.',
  },
  {
    name: '--yk-input-padding-inline',
    default: '0.75rem',
    description: 'Horizontal padding of the face.',
  },
  {
    name: '--yk-input-radius',
    default: 'var(--yk-radius-md, 0.375rem)',
    description: 'Corner radius of the face.',
  },
  {
    name: '--yk-input-bg',
    default: '#fff',
    description: 'Background of the face.',
  },
  {
    name: '--yk-input-color',
    default: 'oklch(26.2% 0.009 248.2)',
    description: 'Text color of the face.',
  },
  {
    name: '--yk-input-border-color',
    default:
      'color-mix(in oklch, var(--yk-color-secondary, oklch(55.8% 0.016 244.9)) 40%, white)',
    description: 'Border color of the face.',
  },
  {
    name: '--yk-input-placeholder-color',
    default:
      'color-mix(in oklch, var(--yk-color-secondary, oklch(55.8% 0.016 244.9)) 70%, white)',
    description: 'Text color of the placeholder.',
  },
  {
    name: '--yk-input-focus-border-color',
    default:
      'color-mix(in oklch, var(--yk-color-primary, oklch(57.8% 0.228 260)) 55%, white)',
    description: 'Border color while the field is focused.',
  },
  {
    name: '--yk-input-focus-ring-color',
    default:
      'color-mix(in oklch, var(--yk-color-primary, oklch(57.8% 0.228 260)) 25%, transparent)',
    description: 'Focus ring color.',
  },
  {
    name: '--yk-input-disabled-bg',
    default:
      'color-mix(in oklch, var(--yk-color-secondary, oklch(55.8% 0.016 244.9)) 12%, white)',
    description: 'Background of the disabled and readonly face.',
  },
  {
    name: '--yk-input-invalid-border-color',
    default: 'var(--yk-color-danger, oklch(59.2% 0.202 21.2))',
    description: 'Border color of the user-invalid face.',
  },
  {
    name: '--yk-input-invalid-ring-color',
    default:
      'color-mix(in oklch, var(--yk-color-danger, oklch(59.2% 0.202 21.2)) 25%, transparent)',
    description: 'Focus ring color of the user-invalid face.',
  },
];

/**
 * Builds the attribute metadata for an input component, optionally inserting
 * type-specific boolean attributes (e.g. `multiple` on yk-input-email) before
 * the shared `disabled` and `name` entries.
 */
const inputFieldAttributes = (extra = []) => [
  {
    name: 'value',
    control: 'text',
    default: 'unset',
    description:
      'Default value shown initially and restored by form reset, mirrored onto the internal input.',
  },
  {
    name: 'placeholder',
    control: 'text',
    default: 'unset',
    description:
      'Hint text shown while the field is empty, mirrored onto the internal input.',
  },
  {
    name: 'maxlength',
    control: 'text',
    default: 'unset',
    description:
      'Maximum string length the user may enter, mirrored onto the internal input.',
  },
  {
    name: 'minlength',
    control: 'text',
    default: 'unset',
    description:
      'Minimum string length checked by constraint validation, mirrored onto the internal input.',
  },
  {
    name: 'pattern',
    control: 'text',
    default: 'unset',
    description:
      'Regular expression the value must match, mirrored onto the internal input.',
  },
  {
    name: 'required',
    control: 'boolean',
    default: 'unset',
    description:
      'Boolean attribute that makes the field mandatory and blocks submission while it is empty, mirrored onto the internal input.',
  },
  {
    name: 'readonly',
    control: 'boolean',
    default: 'unset',
    description:
      'Boolean attribute that makes the field read-only, mirrored onto the internal input.',
  },
  ...extra,
  {
    name: 'disabled',
    control: 'boolean',
    default: 'unset',
    description:
      'Boolean attribute that disables the field and excludes its value from the form, like the native input disabled attribute.',
  },
  {
    name: 'name',
    control: 'text',
    default: 'unset',
    description:
      'Entry name used when the owner form submits the value, like the native input name attribute.',
  },
];

/**
 * Builds the indented `demo-item` paragraphs used as a layout primitive's
 * initial playground content, so the generated markup stays readable. Labels
 * are trusted internal strings; escape them if they ever become external.
 *
 * ```js
 * demoItems(['First item', 'Second item']);
 * // '  <p class="demo-item">First item</p>\n  <p class="demo-item">Second item</p>'
 * ```
 */
const demoItems = (labels) =>
  labels.map((label) => `  <p class="demo-item">${label}</p>`).join('\n');

export const components = [
  {
    tag: 'yk-vstack',
    category: 'Layout',
    description:
      'Layout primitive that stacks its children vertically with a consistent gap.',
    playground: {
      content: demoItems(['First item', 'Second item', 'Third item']),
    },
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
    category: 'Layout',
    description:
      'Layout primitive that stacks its children horizontally with a consistent gap.',
    playground: {
      content: demoItems(['First item', 'Second item', 'Third item']),
    },
    cssProperties: [
      {
        name: '--yk-hstack-align',
        default: 'stretch',
        description:
          'Cross-axis alignment of children (any CSS align-items value).',
      },
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
    category: 'Layout',
    description:
      'Layout primitive that places children in a centered, wrapping horizontal flow.',
    playground: {
      content: demoItems(['First item', 'Second item', 'Third item']),
    },
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
    category: 'Layout',
    description:
      'Layout primitive that places children in an auto-equal-width grid.',
    playground: {
      content: demoItems(['First item', 'Second item', 'Third item']),
    },
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
    category: 'Layout',
    description:
      'Layout primitive that pads its children with a consistent inset from the host edges.',
    playground: {
      content: demoItems(['Padded content']),
    },
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
  {
    tag: 'yk-button',
    category: 'Components',
    description:
      'Action button that renders its label inside a native button with a solid Bootstrap-style tone.',
    playground: {
      content: 'Button',
    },
    cssProperties: buttonFaceProperties,
    attributes: [
      {
        name: 'variant',
        control: 'select',
        options: ['primary', 'secondary', 'danger'],
        default: 'unset',
        description:
          'Tone of the button face: primary, secondary, or danger. Without the attribute the face is the default light style.',
      },
      {
        name: 'type',
        control: 'select',
        options: ['button', 'submit'],
        default: 'button',
        description:
          'Click behavior: button does nothing natively, submit submits the owning form. Enter-key implicit submission in multi-field forms does not trigger it.',
      },
      {
        name: 'disabled',
        control: 'boolean',
        default: 'unset',
        description:
          'Boolean attribute that disables the button, like the native button disabled attribute.',
      },
    ],
  },
  {
    tag: 'yk-link',
    category: 'Components',
    description:
      'Link that renders like a yk-button, backed by a native anchor.',
    playground: {
      content: 'Link',
    },
    cssProperties: buttonFaceProperties,
    attributes: [
      {
        name: 'href',
        control: 'text',
        default: 'unset',
        description:
          'URL of the link target, mirrored onto the internal anchor.',
      },
      {
        name: 'target',
        control: 'text',
        default: 'unset',
        description:
          'Browsing context for the navigation, mirrored onto the internal anchor.',
      },
      {
        name: 'rel',
        control: 'text',
        default: 'unset',
        description:
          'Relationship of the link target, mirrored onto the internal anchor.',
      },
      {
        name: 'download',
        control: 'text',
        default: 'unset',
        description:
          'Downloads the target instead of navigating, optionally suggesting a filename, mirrored onto the internal anchor.',
      },
      {
        name: 'variant',
        control: 'select',
        options: ['primary', 'secondary', 'danger'],
        default: 'unset',
        description:
          'Tone of the face: primary, secondary, or danger. Without the attribute the face is the default light style.',
      },
    ],
  },
  {
    tag: 'yk-badge',
    category: 'Components',
    description:
      'Small status label that renders a solid tone and scales with the surrounding font size, like the Bootstrap badge.',
    playground: {
      content: 'Badge',
    },
    cssProperties: [
      {
        name: '--yk-badge-bg',
        default: 'var(--yk-color-secondary, oklch(55.8% 0.016 244.9))',
        description: 'Background of the default secondary face.',
      },
      {
        name: '--yk-badge-color',
        default: '#fff',
        description: 'Text color of the badge.',
      },
      {
        name: '--yk-badge-font-size',
        default: '0.75em',
        description: 'Font size; em units scale with the parent element.',
      },
      {
        name: '--yk-badge-font-weight',
        default: '700',
        description: 'Font weight of the label.',
      },
      {
        name: '--yk-badge-padding-block',
        default: '0.35em',
        description: 'Vertical padding of the badge.',
      },
      {
        name: '--yk-badge-padding-inline',
        default: '0.65em',
        description: 'Horizontal padding of the badge.',
      },
      {
        name: '--yk-badge-radius',
        default: 'var(--yk-radius-md, 0.375rem)',
        description: 'Corner radius of the badge.',
      },
      {
        name: '--yk-badge-pill-radius',
        default: '50rem',
        description: 'Corner radius when the pill attribute is set.',
      },
    ],
    attributes: [
      {
        name: 'variant',
        control: 'select',
        options: ['primary', 'danger'],
        default: 'unset',
        description:
          'Tone of the badge: primary or danger. Without the attribute, or with an unknown value, the face is the solid secondary style.',
      },
      {
        name: 'pill',
        control: 'boolean',
        default: 'unset',
        description:
          'Boolean attribute that rounds the corners fully, like the Bootstrap rounded-pill utility.',
      },
    ],
  },
  {
    tag: 'yk-input-text',
    category: 'Components',
    description:
      'Single-line text field that renders a native text input with a Bootstrap-style face and full form participation.',
    playground: {
      content: '',
    },
    cssProperties: inputFaceProperties,
    attributes: inputFieldAttributes(),
  },
  {
    tag: 'yk-input-email',
    category: 'Components',
    description:
      'Single-line email field that renders a native email input with a Bootstrap-style face, native email syntax validation, and full form participation.',
    playground: {
      content: '',
    },
    cssProperties: inputFaceProperties,
    attributes: inputFieldAttributes([
      {
        name: 'multiple',
        control: 'boolean',
        default: 'unset',
        description:
          'Boolean attribute that allows a comma-separated list of email addresses and validates each address, mirrored onto the internal input.',
      },
    ]),
  },
  {
    tag: 'yk-input-tel',
    category: 'Components',
    description:
      'Single-line telephone field that renders a native tel input with a Bootstrap-style face and full form participation; constraining the format is up to the pattern attribute since tel has no native syntax check.',
    playground: {
      content: '',
    },
    cssProperties: inputFaceProperties,
    attributes: inputFieldAttributes(),
  },
  {
    tag: 'yk-input-url',
    category: 'Components',
    description:
      'Single-line URL field that renders a native url input with a Bootstrap-style face, native URL syntax validation, and full form participation.',
    playground: {
      content: '',
    },
    cssProperties: inputFaceProperties,
    attributes: inputFieldAttributes(),
  },
];

/**
 * Component groups derived from the flat list, in first-appearance order.
 *
 * Each entry references the same component objects as `components` so the
 * sidebar and landing renders can map over one structure; adding a component
 * still means adding one entry above.
 */
export const categories = [
  ...new Set(components.map(({ category }) => category)),
].map((name) => ({
  name,
  components: components.filter(({ category }) => category === name),
}));

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
  {
    name: '--yk-color-primary',
    value: 'oklch(57.8% 0.228 260)',
    description:
      'Primary accent color; solid primary tones and their focus rings.',
  },
  {
    name: '--yk-color-secondary',
    value: 'oklch(55.8% 0.016 244.9)',
    description: 'Neutral secondary color; the default button tone.',
  },
  {
    name: '--yk-color-danger',
    value: 'oklch(59.2% 0.202 21.2)',
    description: 'Destructive accent color; danger tones.',
  },
  {
    name: '--yk-radius-md',
    value: '0.375rem',
    description: 'Default corner radius; the fallback for component radii.',
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
  // The platform's aria-current state carries "active" for styling (see
  // catalog.css) — no invented class needed.
  const isActive = (active) => (active ? ' aria-current="page"' : '');
  const sectionFor = ({ name, components: group }) => `
        <section>
          <h2>${name}</h2>
          ${group
            .map(
              ({ tag }) => `
          <a href="${pageFor(tag)}"${isActive(current === tag)}>&lt;${tag}&gt;</a>`,
            )
            .join('')}
        </section>`;
  sidebar.innerHTML = `
    <yk-vstack style="--yk-vstack-gap: var(--yk-space-md)">
      <a class="brand" href="./index.html">yk-elements</a>
      <nav aria-label="Catalog">
        <a href="./index.html"${isActive(current === null)}>Overview</a>
        ${categories.map(sectionFor).join('')}
      </nav>
    </yk-vstack>
  `;
}

function renderLanding() {
  // Descriptions are trusted internal strings; escape them if they ever
  // become external or author-supplied input.
  const landing = document.querySelector('[data-landing]');
  if (!landing) return;
  landing.innerHTML = categories
    .map(
      ({ name, components: group }) => `
    <section>
      <yk-vstack style="--yk-vstack-gap: var(--yk-space-sm)">
        <h2>${name}</h2>
        <yk-grid style="--yk-grid-min: 15rem">
          ${group
            .map(
              ({ tag, description }) => `
          <a href="${pageFor(tag)}">
            <yk-vstack style="--yk-vstack-gap: var(--yk-space-sm)">
              <h3>&lt;${tag}&gt;</h3>
              <p class="description">${description}</p>
            </yk-vstack>
          </a>`,
            )
            .join('')}
        </yk-grid>
      </yk-vstack>
    </section>`,
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
      <h1>&lt;${tag}&gt;</h1>
      <p class="description">${component.description}</p>
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
      (name) => `<a href="${anchors.get(name)}">${name}</a>`,
    );
})();

const rowsFor = (items) =>
  items
    .map(
      ({ name, default: fallback, description }) => `
      <tr>
        <td class="property-name">${name}</td>
        <td class="property-default">${linkTokens(fallback)}</td>
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
      <div class="table-scroll">
        <table data-table="properties">
          <caption>CSS custom properties</caption>
          <thead>
            <tr><th>Property</th><th>Default</th><th>Description</th></tr>
          </thead>
          <tbody>${rowsFor(component.cssProperties)}</tbody>
        </table>
      </div>`);
  }
  if (component.attributes.length) {
    for (const attribute of component.attributes) {
      groups.push(`
      <div class="table-scroll">
        <table data-table="attributes">
          <caption>${attribute.name}</caption>
          <thead>
            <tr><th>Default</th><th>Description</th></tr>
          </thead>
          <tbody>
            <tr>
              <td class="property-default">${linkTokens(attribute.default)}</td>
              <td>${attribute.description}</td>
            </tr>
          </tbody>
        </table>
      </div>`);
    }
  }

  section.innerHTML = groups.length
    ? `<yk-vstack style="--yk-vstack-gap: var(--yk-space-sm)">` +
      `<h2>Interface</h2>${groups.join('')}</yk-vstack>`
    : '';
}

function renderTokens() {
  const section = document.querySelector('[data-tokens]');
  if (!section) return;
  section.innerHTML = `
    <yk-vstack style="--yk-vstack-gap: var(--yk-space-sm)">
    <h2>Design tokens</h2>
    <div class="table-scroll">
    <table data-table="tokens">
      <caption>Design tokens</caption>
      <thead>
        <tr><th>Token</th><th>Value</th><th>Description</th></tr>
      </thead>
      <tbody>${tokens
        .map(
          ({ name, value, description }) => `
        <tr>
          <td class="property-name" id="${name.slice(2)}">${name}</td>
          <td class="property-default">${value}</td>
          <td>${description}</td>
        </tr>`,
        )
        .join('')}</tbody>
    </table>
    </div>
    </yk-vstack>
  `;
}

renderSidebar();
renderLanding();
renderComponentHeader();
renderInterface();
renderTokens();
