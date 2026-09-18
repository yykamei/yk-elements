/**
 * Shared chrome for the yk-elements component catalog.
 *
 * Load it on every catalog page. It owns the single source of truth for the
 * component list and the design tokens, and renders the catalog's shared
 * chrome from them:
 *
 * - the sidebar navigation (brand + a hamburger toggle + Overview + one
 *   section per category, each holding one link per component), marking the
 *   current page as active based on the URL via the platform's own
 *   aria-current state; the toggle collapses the nav on mobile (CSS decides
 *   visibility, the listener only flips data-open and aria-expanded)
 * - the component cards on the landing page (catalog/index.html), which
 *   hosts a [data-landing] container and groups the cards into one section
 *   per category
 * - the header (title + description) on each component page, whose <body>
 *   carries data-component="yk-xxx"
 * - the Interface section on each component page, listing the component's
 *   configurable CSS custom properties
 * - the Playground section on each component page, whose [data-playground]
 *   container is filled with attribute and CSS custom property controls, a
 *   live preview, and the generated markup
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
 * the shared `disabled` and `name` entries. `sensitiveValue` marks the `value`
 * attribute as sensitive so the playground masks its control and the
 * generated code never echoes the value back (see `playgroundControl` and
 * `codeFor`).
 */
const inputFieldAttributes = (extra = [], { sensitiveValue = false } = {}) => [
  {
    name: 'value',
    control: 'text',
    default: 'unset',
    ...(sensitiveValue && { sensitive: true }),
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
 * Attribute metadata for the file picker, which mirrors only the picker and
 * validation attributes — file inputs have no string value, placeholder, or
 * length/pattern constraints.
 */
const fileFieldAttributes = [
  {
    name: 'accept',
    control: 'text',
    default: 'unset',
    description:
      'Comma-separated list of accepted file types, such as image/png or .pdf, mirrored onto the internal input.',
  },
  {
    name: 'multiple',
    control: 'boolean',
    default: 'unset',
    description:
      'Boolean attribute that allows selecting several files at once and contributes one form entry per file, mirrored onto the internal input.',
  },
  {
    name: 'required',
    control: 'boolean',
    default: 'unset',
    description:
      'Boolean attribute that blocks submission while no file is selected, mirrored onto the internal input.',
  },
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
 * Attribute metadata for the checkbox, which mirrors only the submitted
 * value, the default state, and validation attributes — checkboxes have no
 * placeholder, length, or pattern constraints.
 */
const checkboxFieldAttributes = [
  {
    name: 'value',
    control: 'text',
    default: 'on',
    description:
      'Value submitted to the form while the checkbox is checked, mirrored onto the internal input. Without the attribute the value is on, like the native checkbox.',
  },
  {
    name: 'checked',
    control: 'boolean',
    default: 'unset',
    description:
      'Boolean attribute that sets the default checked state restored by form reset, like the native box checked attribute.',
  },
  {
    name: 'required',
    control: 'boolean',
    default: 'unset',
    description:
      'Boolean attribute that blocks submission while the checkbox is unchecked, mirrored onto the internal input.',
  },
  {
    name: 'disabled',
    control: 'boolean',
    default: 'unset',
    description:
      'Boolean attribute that disables the field, dims its face and label, and excludes its value from the form, like the native input disabled attribute.',
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
 * CSS custom properties of the checkbox face. The mark glyphs (check and dash)
 * are drawn with borders, so the glyph color stays a plain color token instead
 * of a data URI that could not interpolate one.
 */
const checkboxFaceProperties = [
  {
    name: '--yk-input-checkbox-size',
    default: '1em',
    description: 'Width and height of the check box.',
  },
  {
    name: '--yk-input-checkbox-bg',
    default: '#fff',
    description: 'Background of the unchecked face.',
  },
  {
    name: '--yk-input-checkbox-border-width',
    default: '1px',
    description: 'Border width of the check box.',
  },
  {
    name: '--yk-input-checkbox-border-color',
    default:
      'color-mix(in oklch, var(--yk-color-secondary, oklch(55.8% 0.016 244.9)) 40%, white)',
    description: 'Border color of the unchecked face.',
  },
  {
    name: '--yk-input-checkbox-radius',
    default: '0.25em',
    description: 'Corner radius of the check box.',
  },
  {
    name: '--yk-input-checkbox-checked-bg',
    default: 'var(--yk-color-primary, oklch(57.8% 0.228 260))',
    description:
      'Background of the checked and indeterminate faces, which also tints their border.',
  },
  {
    name: '--yk-input-checkbox-checked-border-color',
    default:
      'var(--yk-input-checkbox-checked-bg, var(--yk-color-primary, oklch(57.8% 0.228 260)))',
    description: 'Border color of the checked and indeterminate faces.',
  },
  {
    name: '--yk-input-checkbox-checked-color',
    default: '#fff',
    description:
      'Color of the check and dash glyphs drawn on the checked and indeterminate faces.',
  },
  {
    name: '--yk-input-checkbox-focus-border-color',
    default:
      'color-mix(in oklch, var(--yk-color-primary, oklch(57.8% 0.228 260)) 55%, white)',
    description: 'Border color while the field is focused.',
  },
  {
    name: '--yk-input-checkbox-focus-ring-color',
    default:
      'color-mix(in oklch, var(--yk-color-primary, oklch(57.8% 0.228 260)) 25%, transparent)',
    description: 'Focus ring color.',
  },
  {
    name: '--yk-input-checkbox-active-filter',
    default: 'brightness(90%)',
    description: 'Filter applied to the face while the check box is pressed.',
  },
  {
    name: '--yk-input-checkbox-invalid-border-color',
    default: 'var(--yk-color-danger, oklch(59.2% 0.202 21.2))',
    description: 'Border color of the user-invalid face.',
  },
  {
    name: '--yk-input-checkbox-invalid-ring-color',
    default:
      'color-mix(in oklch, var(--yk-color-danger, oklch(59.2% 0.202 21.2)) 25%, transparent)',
    description: 'Focus ring color of the user-invalid face.',
  },
  {
    name: '--yk-input-checkbox-disabled-opacity',
    default: '0.5',
    description: 'Opacity of the face and label while disabled.',
  },
  {
    name: '--yk-input-checkbox-label-gap',
    default: '0.5em',
    description: 'Gap between the check box and the label text.',
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

/**
 * CSS custom properties used by the dropzone face of yk-input-file, layered
 * on top of the shared `inputFaceProperties` and button tokens.
 */
const dropzoneFaceProperties = [
  {
    name: '--yk-input-dropzone-bg',
    default: '#f8f9fa',
    description: 'Background of the dropzone face.',
  },
  {
    name: '--yk-input-dropzone-border-color',
    default:
      'var(--yk-input-border-color, color-mix(in oklch, var(--yk-color-secondary, oklch(55.8% 0.016 244.9)) 40%, white))',
    description: 'Border color of the dropzone face.',
  },
  {
    name: '--yk-input-dropzone-radius',
    default: 'var(--yk-input-radius, var(--yk-radius-md, 0.375rem))',
    description: 'Corner radius of the dropzone face.',
  },
  {
    name: '--yk-input-dropzone-padding',
    default: 'var(--yk-space-md, 1rem)',
    description: 'Inset from the dropzone edges to its content.',
  },
  {
    name: '--yk-input-dropzone-dragover-bg',
    default:
      'color-mix(in oklch, var(--yk-color-primary, oklch(57.8% 0.228 260)) 12%, white)',
    description:
      'Background of the dropzone face while files are dragged over.',
  },
  {
    name: '--yk-input-dropzone-dragover-border-color',
    default:
      'color-mix(in oklch, var(--yk-color-primary, oklch(57.8% 0.228 260)) 55%, white)',
    description:
      'Border color of the dropzone face while files are dragged over.',
  },
];

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
  {
    tag: 'yk-input-password',
    category: 'Components',
    description:
      'Single-line password field that renders a native password input with a Bootstrap-style face, obscured values, password-manager interaction through autocomplete, and full form participation since password has no native syntax check.',
    playground: {
      content: '',
    },
    cssProperties: inputFaceProperties,
    attributes: inputFieldAttributes(
      [
        {
          name: 'autocomplete',
          control: 'select',
          options: [
            'current-password',
            'new-password',
            'one-time-code',
            'on',
            'off',
          ],
          default: 'unset',
          description:
            'What the browser may fill in, such as the current or a newly generated password, or one-time-code for a PIN, mirrored onto the internal input.',
        },
        {
          name: 'inputmode',
          control: 'select',
          options: [
            'none',
            'text',
            'decimal',
            'numeric',
            'tel',
            'search',
            'email',
            'url',
          ],
          default: 'unset',
          description:
            'Virtual keyboard layout to request on devices with one, such as numeric for a PIN, mirrored onto the internal input.',
        },
      ],
      { sensitiveValue: true },
    ),
  },
  {
    tag: 'yk-input-search',
    category: 'Components',
    description:
      'Single-line search field that renders a native search input with a Bootstrap-style face, the browser search affordances such as the clear button, and full form participation; constraining the format is up to the pattern attribute since search has no native syntax check.',
    playground: {
      content: '',
    },
    cssProperties: inputFaceProperties,
    attributes: inputFieldAttributes(),
  },
  {
    tag: 'yk-input-file',
    category: 'Components',
    description:
      'File picker rendered as a bordered drop area: clicking the zone (except its remove buttons) opens the picker, files can be dropped anywhere in the zone, selected files are listed with per-file remove buttons, and labels localize through the browse, hint, and remove-label slots. Submits the selected files as File entries with full form participation including required validation and multiple selection.',
    playground: {
      content: '',
    },
    cssProperties: [
      ...inputFaceProperties,
      {
        name: '--yk-button-bg',
        default: '#fff',
        description: 'Background of the browse and remove buttons.',
      },
      {
        name: '--yk-button-color',
        default: 'oklch(26.2% 0.009 248.2)',
        description: 'Text color of the browse and remove buttons.',
      },
      {
        name: '--yk-button-border-color',
        default:
          'color-mix(in oklch, var(--yk-color-secondary, oklch(55.8% 0.016 244.9)) 40%, white)',
        description: 'Border color of the browse and remove buttons.',
      },
      {
        name: '--yk-button-radius',
        default: 'var(--yk-radius-md, 0.375rem)',
        description: 'Corner radius of the browse and remove buttons.',
      },
      {
        name: '--yk-button-padding-block',
        default: 'var(--yk-space-sm, 0.5rem)',
        description: 'Vertical padding of the browse button.',
      },
      {
        name: '--yk-button-padding-inline',
        default: 'var(--yk-space-md, 1rem)',
        description: 'Horizontal padding of the browse button.',
      },
      ...dropzoneFaceProperties,
    ],
    attributes: fileFieldAttributes,
  },
  {
    tag: 'yk-input-checkbox',
    category: 'Components',
    description:
      'Checkbox that renders a native checkbox in the Bootstrap form-check style with its label text inside the element, contributing name=value while checked and nothing while unchecked, with required validation, a reset-restoring checked attribute, and an indeterminate property for the dash face.',
    playground: {
      content: 'Subscribe to the newsletter',
    },
    cssProperties: checkboxFaceProperties,
    attributes: checkboxFieldAttributes,
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
      <div class="sidebar-head">
        <a class="brand" href="./">yk-elements</a>
        <button
          type="button"
          class="nav-toggle"
          data-nav-toggle
          aria-label="Menu"
          aria-expanded="false"
          aria-controls="catalog-nav"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M3 5h14M3 10h14M3 15h14"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            ></path>
          </svg>
        </button>
      </div>
      <nav id="catalog-nav" aria-label="Catalog">
        <a href="./"${isActive(current === null)}>Overview</a>
        ${categories.map(sectionFor).join('')}
      </nav>
    </yk-vstack>
  `;
  // The click only flips data-open on the aside; whether the nav is visible
  // stays a pure CSS decision (catalog.css), so a viewport resize can never
  // desync the visible nav from the layout. aria-expanded mirrors the same
  // bit for assistive tech.
  sidebar
    .querySelector('[data-nav-toggle]')
    .addEventListener('click', ({ currentTarget }) => {
      const open = sidebar.toggleAttribute('data-open');
      currentTarget.setAttribute('aria-expanded', String(open));
    });
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
 *
 * Overview links use the directory URL (`./#anchor`), never `./index.html`:
 * some static servers rewrite `index.html` URLs with a redirect, which turns
 * one click into two document loads and skips the cross-document view
 * transition on the second hop.
 */
const linkTokens = (() => {
  const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const anchors = new Map(
    tokens.map(({ name }) => [name, `./#${name.slice(2)}`]),
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

/**
 * Escapes a value for a double-quoted HTML attribute or text node in rendered
 * or generated markup. `&` is replaced first so an entity reference such as
 * `&quot;` becomes `&amp;quot;` instead of being decoded twice. Single quotes
 * are left alone because no generated context uses them.
 */
const escapeHtml = (text) =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

/**
 * Builds the markup for one component attribute control. The result is
 * interpolated into the playground panel's `innerHTML`, so every metadata
 * value is escaped. It is exported so the escaping contract can be unit-tested
 * with synthetic metadata.
 *
 * ```js
 * playgroundControl({ name: 'variant', control: 'select', options: ['primary'] });
 * ```
 */
export function playgroundControl(attribute) {
  const name = escapeHtml(attribute.name);
  const id = escapeHtml(`playground-${attribute.name}`);
  const label = `<span>${name}</span>`;
  const field = `id="${id}" data-playground-attribute="${name}"`;

  if (attribute.control === 'boolean') {
    return `
      <label for="${id}">
        ${label}
        <input type="checkbox" ${field}>
      </label>`;
  }

  if (attribute.control === 'select') {
    const unset =
      attribute.default === 'unset'
        ? '(unset)'
        : `(unset · default: ${escapeHtml(attribute.default)})`;
    const options = [
      `<option value="">${unset}</option>`,
      ...attribute.options.map((option) => {
        const value = escapeHtml(option);
        return `<option value="${value}">${value}</option>`;
      }),
    ].join('');
    return `
      <label for="${id}">
        ${label}
        <select ${field}>${options}</select>
      </label>`;
  }

  const placeholder =
    attribute.default === 'unset'
      ? ''
      : ` placeholder="${escapeHtml(attribute.default)}"`;
  const type = attribute.sensitive ? 'password' : 'text';
  return `
      <label for="${id}">
        ${label}
        <input type="${type}" ${field}${placeholder}>
      </label>`;
}

/**
 * Builds the markup for one CSS custom property control. Like
 * `playgroundControl`, the result is assigned to `innerHTML` and every
 * metadata value is escaped; it is exported for the same unit tests.
 *
 * ```js
 * playgroundProperty({ name: '--yk-vstack-gap', default: 'var(--yk-space-md)' });
 * ```
 */
export function playgroundProperty(property) {
  const name = escapeHtml(property.name);
  const id = escapeHtml(`playground-${property.name.slice(2)}`);
  return `
      <label for="${id}">
        <span>${name}</span>
        <input
          type="text"
          id="${id}"
          data-playground-property="${name}"
          placeholder="${escapeHtml(property.default)}"
        >
      </label>`;
}

/**
 * Rebuilds the component's markup from the metadata, in metadata order, with
 * every value escaped. Reading the preview host keeps the code in step with
 * the live element without a separate state object.
 */
function codeFor(component, host) {
  // Sensitive values (e.g. a mistyped password) are never echoed into the
  // generated markup, so they cannot leak through the code block, its
  // aria-live announcement, or the Copy clipboard write.
  const attributes = component.attributes
    .filter(({ name, sensitive }) => !sensitive && host.hasAttribute(name))
    .map(({ name, control }) =>
      control === 'boolean'
        ? ` ${name}`
        : ` ${name}="${escapeHtml(host.getAttribute(name))}"`,
    )
    .join('');
  const style = component.cssProperties
    .flatMap(({ name }) => {
      const value = host.style.getPropertyValue(name);
      return value === '' ? [] : [`${name}: ${value}`];
    })
    .join('; ');
  const styleAttribute = style ? ` style="${escapeHtml(style)}"` : '';
  const content = component.playground.content;
  const body = content.includes('\n') ? `\n${content}\n` : content;
  return `<${component.tag}${attributes}${styleAttribute}>${body}</${component.tag}>`;
}

function renderPlayground() {
  const section = document.querySelector('[data-playground]');
  const tag = document.body.dataset.component;
  if (!section || !tag) return;
  const component = components.find(({ tag: known }) => known === tag);
  if (!component) return;

  const groups = [];
  if (component.attributes.length) {
    groups.push(`
      <fieldset>
        <legend>Attributes</legend>
        <yk-vstack style="--yk-vstack-gap: var(--yk-space-sm)">
          ${component.attributes.map(playgroundControl).join('')}
        </yk-vstack>
      </fieldset>`);
  }
  if (component.cssProperties.length) {
    groups.push(`
      <fieldset>
        <legend>CSS custom properties</legend>
        <yk-vstack style="--yk-vstack-gap: var(--yk-space-sm)">
          ${component.cssProperties.map(playgroundProperty).join('')}
        </yk-vstack>
      </fieldset>`);
  }
  const controls = groups.length
    ? groups.join('')
    : '<p class="description">This component has no configurable options.</p>';

  section.innerHTML = `
    <yk-vstack style="--yk-vstack-gap: var(--yk-space-sm)">
      <h2>Playground</h2>
      <div class="playground">
        <div data-playground-panel>${controls}</div>
        <yk-pad
          data-playground-preview
          style="--yk-pad-padding: var(--yk-space-lg)"
        ></yk-pad>
        <div data-playground-stage>
          <pre><code data-playground-code aria-live="polite"></code></pre>
          <yk-cluster
            style="--yk-cluster-justify: flex-start; --yk-cluster-gap: var(--yk-space-sm)"
          >
            <yk-button type="button" data-playground-copy>Copy</yk-button>
            <yk-button type="button" data-playground-reset>Reset</yk-button>
          </yk-cluster>
        </div>
      </div>
    </yk-vstack>
  `;

  const panel = section.querySelector('[data-playground-panel]');
  const preview = section.querySelector('[data-playground-preview]');
  const code = section.querySelector('[data-playground-code]');

  const host = document.createElement(tag);
  host.innerHTML = component.playground.content;
  preview.append(host);

  const sync = () => {
    // The metadata guard test constrains attribute and property names to safe
    // identifiers, so they are interpolated into these selectors unescaped.
    for (const attribute of component.attributes) {
      const control = panel.querySelector(
        `[data-playground-attribute="${attribute.name}"]`,
      );
      if (attribute.control === 'boolean') {
        host.toggleAttribute(attribute.name, control.checked);
      } else if (control.value === '') {
        host.removeAttribute(attribute.name);
      } else {
        host.setAttribute(attribute.name, control.value);
      }
    }
    for (const property of component.cssProperties) {
      const control = panel.querySelector(
        `[data-playground-property="${property.name}"]`,
      );
      if (control.value.trim() === '') {
        host.style.removeProperty(property.name);
      } else {
        host.style.setProperty(property.name, control.value);
      }
    }
    // Clearing the last property leaves an empty style attribute behind;
    // generated code ignores it, so the leftover is harmless and left alone.
    code.textContent = codeFor(component, host);
  };

  panel.addEventListener('input', sync);

  section
    .querySelector('[data-playground-reset]')
    .addEventListener('click', () => {
      for (const control of panel.querySelectorAll(
        '[data-playground-attribute], [data-playground-property]',
      )) {
        if (control.type === 'checkbox') {
          control.checked = false;
        } else {
          control.value = '';
        }
      }
      sync();
    });

  const copy = section.querySelector('[data-playground-copy]');
  let copyTimer;
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(code.textContent);
      copy.textContent = 'Copied';
    } catch {
      copy.textContent = 'Copy failed';
    }
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => {
      copy.textContent = 'Copy';
    }, 1500);
  });

  sync();
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
renderPlayground();
renderInterface();
renderTokens();
