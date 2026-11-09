// @ts-check

import { afterEach, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../src/components/yk-button.js';
import '../src/components/yk-header.js';
import '../src/components/yk-link.js';
import '../src/components/yk-theme-switcher.js';

afterEach(() => {
  document.body.replaceChildren();
  localStorage.removeItem('yk-theme');
});

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

function makeHeader(innerHTML = '') {
  const host = document.createElement('yk-header');
  host.innerHTML = innerHTML;
  document.body.appendChild(host);
  return host;
}

const partOf = (host, part) =>
  host.shadowRoot.querySelector(`[part="${part}"]`);

const DSD_SHADOW =
  '<template shadowrootmode="open"><style>:host{--dsd:1px}</style><header part="header"><div part="bar"><div part="brand"><a part="brand-link"><slot name="brand"></slot></a></div><button part="toggle" type="button" aria-label="Menu" aria-expanded="false" aria-controls="nav actions"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5h14M3 10h14M3 15h14" /></svg></button><slot name="menu-label" hidden>Menu</slot><nav part="nav" id="nav" aria-label="Main navigation"><slot></slot></nav><div part="actions" id="actions"><slot name="actions"></slot></div></div></header></template>';

function makeDSDHeader(content = '') {
  const container = document.createElement('div');
  container.setHTMLUnsafe(`<yk-header>${DSD_SHADOW}${content}</yk-header>`);
  document.body.appendChild(container);
  return container.querySelector('yk-header');
}

const NAV_LINKS = `
  <a href="#">Docs</a>
  <a href="#">Pricing</a>
`;

test('self-registers in the custom element registry', () => {
  expect(customElements.get('yk-header')).toBeDefined();
});

test('adopts the shared and component stylesheets', () => {
  const host = makeHeader();

  expect(host.shadowRoot.adoptedStyleSheets.length).toBe(2);
  for (const sheet of host.shadowRoot.adoptedStyleSheets) {
    expect(sheet).toBeInstanceOf(CSSStyleSheet);
  }
});

test('renders the header landmark with four slot regions', () => {
  const host = makeHeader();

  expect(host.shadowRoot.querySelector('header[part="header"]')).not.toBeNull();
  expect(partOf(host, 'bar')).not.toBeNull();
  expect(partOf(host, 'brand')).not.toBeNull();
  expect(partOf(host, 'brand-link')).not.toBeNull();
  expect(partOf(host, 'nav')).not.toBeNull();
  expect(partOf(host, 'actions')).not.toBeNull();
  expect(partOf(host, 'toggle')).not.toBeNull();
  expect(host.shadowRoot.querySelectorAll('slot').length).toBe(4);
});

test('exposes both panel regions through aria-controls', () => {
  const host = makeHeader(NAV_LINKS);
  const toggle = partOf(host, 'toggle');
  const actions = partOf(host, 'actions');

  expect(toggle.getAttribute('aria-controls')).toBe('nav actions');
  expect(actions.id).toBe('actions');
});

test('assigns the brand, primary links, and actions', () => {
  const host = makeHeader(`
    <img slot="brand" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="Brand" />
    ${NAV_LINKS}
    <yk-theme-switcher slot="actions"></yk-theme-switcher>
  `);

  const assigned = (name) =>
    host.shadowRoot.querySelector(`slot[name="${name}"]`).assignedElements();
  expect(assigned('brand')).toEqual([host.querySelector('img[slot="brand"]')]);
  expect(assigned('actions')).toEqual([
    host.querySelector('yk-theme-switcher'),
  ]);
  expect(
    host.shadowRoot.querySelector('slot:not([name])').assignedElements(),
  ).toEqual([...host.querySelectorAll('a:not([slot])')]);
});

test('keeps existing components in the actions slot intact', async () => {
  const host = makeHeader(`
    <yk-button slot="actions">Save</yk-button>
    <yk-link slot="actions" href="/login">Sign in</yk-link>
    <yk-theme-switcher slot="actions"></yk-theme-switcher>
  `);
  await frame();

  const button = host.querySelector('yk-button');
  const link = host.querySelector('yk-link');
  expect(getComputedStyle(button).display).not.toBe('none');
  expect(getComputedStyle(link).display).not.toBe('none');
  expect(button.getBoundingClientRect().height).toBeGreaterThan(0);
  expect(link.getBoundingClientRect().height).toBeGreaterThan(0);
  expect(host.hasAttribute('empty-actions')).toBe(false);
});

test('links the brand through brand-href', () => {
  const host = makeHeader(
    '<img slot="brand" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="Brand" />',
  );
  const link = partOf(host, 'brand-link');
  expect(link.hasAttribute('href')).toBe(false);

  host.setAttribute('brand-href', '/home');
  expect(link.getAttribute('href')).toBe('/home');

  host.removeAttribute('brand-href');
  expect(link.hasAttribute('href')).toBe(false);
});

test('drops an unsafe, disguised, or blank brand-href', () => {
  const host = makeHeader(
    '<img slot="brand" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="Brand" />',
  );
  const link = partOf(host, 'brand-link');
  const unsafe = [
    'javascript:alert(1)',
    ' JaVaScRiPt:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    '   ',
  ];

  for (const href of unsafe) {
    host.setAttribute('brand-href', href);
    expect(link.hasAttribute('href'), href).toBe(false);
  }

  host.setAttribute('brand-href', 'myapp://open');
  expect(link.getAttribute('href')).toBe('myapp://open');
});

test('collapses empty regions once slot assignment settles', async () => {
  const host = makeHeader();
  await frame();

  expect(host.hasAttribute('empty-brand')).toBe(true);
  expect(host.hasAttribute('empty-nav')).toBe(true);
  expect(host.hasAttribute('empty-actions')).toBe(true);
  expect(getComputedStyle(partOf(host, 'brand')).display).toBe('none');
  expect(getComputedStyle(partOf(host, 'nav')).display).toBe('none');
  expect(getComputedStyle(partOf(host, 'actions')).display).toBe('none');
  expect(getComputedStyle(partOf(host, 'toggle')).display).toBe('none');
  expect(getComputedStyle(host).display).toBe('none');
});

test('keeps bare text content in the navigation region', async () => {
  const host = makeHeader('Plain header text');
  await frame();

  expect(host.hasAttribute('empty-nav')).toBe(false);
  expect(getComputedStyle(host).display).toBe('block');
});

test('shows a region once it receives content and collapses it again', async () => {
  const host = makeHeader();
  host.style.inlineSize = '800px';
  await frame();
  expect(host.hasAttribute('empty-nav')).toBe(true);

  host.innerHTML =
    '<img slot="brand" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="" /><a href="#">Docs</a><yk-button slot="actions">Save</yk-button>';
  await frame();

  expect(host.hasAttribute('empty-brand')).toBe(false);
  expect(host.hasAttribute('empty-nav')).toBe(false);
  expect(host.hasAttribute('empty-actions')).toBe(false);
  expect(getComputedStyle(partOf(host, 'nav')).display).not.toBe('none');

  host.querySelector('a:not([slot])').remove();
  host.querySelector('img[slot="brand"]').remove();
  host.querySelector('yk-button').remove();
  await frame();

  expect(host.hasAttribute('empty-brand')).toBe(true);
  expect(host.hasAttribute('empty-nav')).toBe(true);
  expect(host.hasAttribute('empty-actions')).toBe(true);
});

test('names the navigation landmark from nav-label', () => {
  const host = makeHeader(NAV_LINKS);
  const nav = partOf(host, 'nav');

  expect(nav.getAttribute('aria-label')).toBe('Main navigation');

  host.setAttribute('nav-label', 'Primary');
  expect(nav.getAttribute('aria-label')).toBe('Primary');

  host.setAttribute('nav-label', '   ');
  expect(nav.getAttribute('aria-label')).toBe('Main navigation');
});

test('sticks to the top when the sticky attribute is present', async () => {
  const host = makeHeader();
  await frame();

  expect(getComputedStyle(host).position).toBe('static');

  host.setAttribute('sticky', '');
  await frame();

  expect(getComputedStyle(host).position).toBe('sticky');
  expect(getComputedStyle(host).top).toBe('0px');
  expect(getComputedStyle(host).zIndex).toBe('10');
});

test('sizes the slotted logo through its token', async () => {
  const host = makeHeader(
    '<img slot="brand" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="Brand" />',
  );
  await frame();

  const image = host.querySelector('img');
  expect(getComputedStyle(image).maxHeight).toBe('32px');
  expect(getComputedStyle(image).display).toBe('block');

  host.style.setProperty('--yk-header-brand-height', '3rem');
  await frame();
  expect(getComputedStyle(image).maxHeight).toBe('48px');
});

test('restyles the surface and spacing through component tokens', async () => {
  const host = makeHeader(NAV_LINKS);
  host.style.inlineSize = '800px';
  host.style.setProperty('--yk-header-bg', 'rgb(9, 8, 7)');
  host.style.setProperty('--yk-header-color', 'rgb(6, 5, 4)');
  host.style.setProperty('--yk-header-border-color', 'rgb(3, 2, 1)');
  host.style.setProperty('--yk-header-max', '480px');
  host.style.setProperty('--yk-header-padding-block', '21px');
  host.style.setProperty('--yk-header-padding-inline', '13px');
  host.style.setProperty('--yk-header-gap', '17px');
  host.style.setProperty('--yk-header-link-color', 'rgb(1, 2, 3)');
  host.style.setProperty('--yk-header-link-radius', '9px');
  host.style.setProperty('--yk-header-toggle-size', '3rem');
  await frame();

  const hostStyle = getComputedStyle(host);
  const barStyle = getComputedStyle(partOf(host, 'bar'));
  expect(hostStyle.backgroundColor).toBe('rgb(9, 8, 7)');
  expect(hostStyle.color).toBe('rgb(6, 5, 4)');
  expect(hostStyle.borderBottomColor).toBe('rgb(3, 2, 1)');
  expect(barStyle.maxWidth).toBe('480px');
  expect(barStyle.paddingTop).toBe('21px');
  expect(barStyle.paddingLeft).toBe('13px');
  expect(barStyle.columnGap).toBe('17px');
  const linkStyle = getComputedStyle(host.querySelector('a'));
  expect(linkStyle.color).toBe('rgb(1, 2, 3)');
  expect(linkStyle.borderRadius).toBe('9px');

  host.style.inlineSize = '400px';
  host.setAttribute('open', '');
  await frame();
  expect(getComputedStyle(partOf(host, 'toggle')).width).toBe('48px');
});

test('toggles open and mirrors aria-expanded on the button', () => {
  const host = makeHeader(NAV_LINKS);
  const toggle = partOf(host, 'toggle');

  expect(toggle.getAttribute('aria-expanded')).toBe('false');

  toggle.click();
  expect(host.hasAttribute('open')).toBe(true);
  expect(toggle.getAttribute('aria-expanded')).toBe('true');

  toggle.click();
  expect(host.hasAttribute('open')).toBe(false);
  expect(toggle.getAttribute('aria-expanded')).toBe('false');
});

test('mirrors an externally declared open attribute', () => {
  const host = makeHeader(NAV_LINKS);
  const toggle = partOf(host, 'toggle');

  host.setAttribute('open', '');
  expect(toggle.getAttribute('aria-expanded')).toBe('true');

  host.removeAttribute('open');
  expect(toggle.getAttribute('aria-expanded')).toBe('false');
});

test('closes on Escape and returns focus to the toggle', () => {
  const host = makeHeader(NAV_LINKS);
  host.style.inlineSize = '400px';
  host.setAttribute('open', '');
  const toggle = partOf(host, 'toggle');
  const link = host.querySelector('a');

  link.focus();
  link.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      composed: true,
    }),
  );

  expect(host.hasAttribute('open')).toBe(false);
  expect(host.shadowRoot.activeElement).toBe(toggle);
});

test('leaves focus alone at wide widths when Escape closes the header from an action', () => {
  const host = makeHeader(
    `${NAV_LINKS}<yk-button slot="actions">Save</yk-button>`,
  );
  host.style.inlineSize = '800px';
  host.setAttribute('open', '');
  const button = host.querySelector('yk-button');
  button.focus();
  const inner = button.shadowRoot.activeElement ?? button;

  inner.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      composed: true,
    }),
  );

  expect(host.hasAttribute('open')).toBe(false);
  expect(document.activeElement).toBe(button);
});

test('returns focus to the toggle when Escape closes the narrow panel from an action', async () => {
  const host = makeHeader(
    `${NAV_LINKS}<yk-button slot="actions">Save</yk-button>`,
  );
  host.style.inlineSize = '400px';
  host.setAttribute('open', '');
  await frame();
  const button = host.querySelector('yk-button');
  const toggle = partOf(host, 'toggle');

  button.focus();
  const inner = button.shadowRoot.activeElement ?? button;
  inner.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      composed: true,
    }),
  );

  expect(host.hasAttribute('open')).toBe(false);
  expect(host.shadowRoot.activeElement).toBe(toggle);
});

test('leaves focus on the action in the narrow bar fallback', async () => {
  const host = makeHeader('<yk-button slot="actions">Save</yk-button>');
  host.style.inlineSize = '400px';
  host.setAttribute('open', '');
  await frame();
  const button = host.querySelector('yk-button');

  button.focus();
  const inner = button.shadowRoot.activeElement ?? button;
  inner.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      composed: true,
    }),
  );

  expect(host.hasAttribute('open')).toBe(false);
  expect(document.activeElement).toBe(button);
});

test('moves focus from the toggle into the opened panel', async () => {
  const host = makeHeader(NAV_LINKS);
  host.style.inlineSize = '400px';
  host.setAttribute('open', '');
  await frame();
  const toggle = partOf(host, 'toggle');

  toggle.focus();
  await userEvent.tab();

  expect(document.activeElement).toBe(host.querySelector('a'));
});

test('keeps the wide layout in visual tab order', async () => {
  const host = makeHeader(
    `<img slot="brand" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="" /><a href="#">Docs</a><yk-button slot="actions">Save</yk-button>`,
  );
  host.setAttribute('brand-href', '/');
  host.style.inlineSize = '800px';
  await frame();

  partOf(host, 'brand-link').focus();
  await userEvent.tab();
  expect(document.activeElement).toBe(host.querySelector('a'));

  await userEvent.tab();
  expect(document.activeElement).toBe(host.querySelector('yk-button'));
});

test('closes when a navigation link is activated', () => {
  const host = makeHeader(NAV_LINKS);
  host.setAttribute('open', '');
  const link = host.querySelector('a');
  link.addEventListener('click', (event) => event.preventDefault());

  link.click();

  expect(host.hasAttribute('open')).toBe(false);
});

test('closes when a yk-link in the navigation is activated', () => {
  const host = makeHeader('<yk-link href="/login">Sign in</yk-link>');
  host.setAttribute('open', '');
  const anchor = host.querySelector('yk-link').shadowRoot.querySelector('a');
  anchor.addEventListener('click', (event) => event.preventDefault());

  anchor.click();

  expect(host.hasAttribute('open')).toBe(false);
});

test('names the toggle from the menu-label slot', async () => {
  const host = makeHeader(NAV_LINKS);
  const toggle = partOf(host, 'toggle');
  expect(toggle.getAttribute('aria-label')).toBe('Menu');

  host.innerHTML = `${NAV_LINKS}<span slot="menu-label">メニュー</span>`;
  await frame();
  expect(toggle.getAttribute('aria-label')).toBe('メニュー');
});

test('moves the navigation and actions into the narrow panel when open', async () => {
  const host = makeHeader(
    `${NAV_LINKS}<yk-button slot="actions">Save</yk-button>`,
  );
  host.style.inlineSize = '400px';
  await frame();

  expect(getComputedStyle(partOf(host, 'nav')).display).toBe('none');
  expect(getComputedStyle(partOf(host, 'actions')).display).toBe('none');
  expect(getComputedStyle(partOf(host, 'toggle')).display).toBe('flex');

  host.setAttribute('open', '');
  await frame();

  expect(getComputedStyle(partOf(host, 'nav')).display).toBe('flex');
  expect(getComputedStyle(partOf(host, 'actions')).display).toBe('flex');
});

test('keeps actions in the bar when there is no navigation to open', async () => {
  const host = makeHeader('<yk-button slot="actions">Save</yk-button>');
  host.style.inlineSize = '400px';
  await frame();

  expect(host.hasAttribute('empty-nav')).toBe(true);
  expect(getComputedStyle(partOf(host, 'actions')).display).toBe('flex');
  expect(getComputedStyle(partOf(host, 'toggle')).display).toBe('none');
});

test('does not render an empty actions row in an open nav-only panel', async () => {
  const host = makeHeader(NAV_LINKS);
  host.style.inlineSize = '400px';
  host.setAttribute('open', '');
  await frame();

  expect(host.hasAttribute('empty-actions')).toBe(true);
  expect(getComputedStyle(partOf(host, 'actions')).display).toBe('none');
});

test('keeps natural action sizes in the narrow bar fallback', async () => {
  const host = makeHeader(
    '<yk-link slot="actions" href="/login">Sign in</yk-link><yk-button slot="actions">Save</yk-button>',
  );
  const measure = () => {
    const link = host.querySelector('yk-link');
    const button = host.querySelector('yk-button');
    const linkFace = link.shadowRoot.querySelector('a');
    const buttonFace = button.shadowRoot.querySelector('button');
    return {
      link: link.getBoundingClientRect().width,
      button: button.getBoundingClientRect().width,
      linkFace: linkFace.getBoundingClientRect().width,
      buttonFace: buttonFace.getBoundingClientRect().width,
      linkHeight: link.getBoundingClientRect().height,
      buttonHeight: button.getBoundingClientRect().height,
    };
  };

  host.style.inlineSize = '800px';
  await frame();
  const wide = measure();
  host.style.inlineSize = '400px';
  await frame();
  const narrow = measure();

  expect(host.hasAttribute('empty-nav')).toBe(true);
  expect(getComputedStyle(partOf(host, 'actions')).display).toBe('flex');
  for (const key of Object.keys(wide)) {
    expect(narrow[key], key).toBeCloseTo(wide[key]);
  }
});

test('keeps the toggle at the inline end when actions move into the panel', async () => {
  const host = makeHeader(
    `${NAV_LINKS}<yk-button slot="actions">Save</yk-button>`,
  );
  host.style.inlineSize = '400px';
  await frame();
  const bar = partOf(host, 'bar');
  const toggle = partOf(host, 'toggle');
  const contentRight =
    bar.getBoundingClientRect().right -
    Number.parseFloat(getComputedStyle(bar).paddingInlineEnd);

  expect(toggle.getBoundingClientRect().right).toBeCloseTo(contentRight);

  host.setAttribute('open', '');
  await frame();

  expect(toggle.getBoundingClientRect().right).toBeCloseTo(contentRight);
});

test('fills the panel width with a form action', async () => {
  const host = makeHeader(`
    ${NAV_LINKS}
    <form slot="actions"><yk-button type="submit" block>Sign out</yk-button></form>
  `);
  host.style.inlineSize = '400px';
  host.setAttribute('open', '');
  await frame();

  const actionsWidth = partOf(host, 'actions').getBoundingClientRect().width;
  const formWidth = host.querySelector('form').getBoundingClientRect().width;
  const button = host.querySelector('yk-button');
  const buttonWidth = button.getBoundingClientRect().width;
  const faceWidth = button.shadowRoot
    .querySelector('button')
    .getBoundingClientRect().width;

  expect(formWidth).toBeCloseTo(actionsWidth);
  expect(buttonWidth).toBeCloseTo(formWidth);
  expect(faceWidth).toBeCloseTo(formWidth);
});

test('tabs from the links into the actions in the narrow panel', async () => {
  const host = makeHeader(
    `${NAV_LINKS}<yk-button slot="actions">Save</yk-button>`,
  );
  host.style.inlineSize = '400px';
  host.setAttribute('open', '');
  await frame();

  host.querySelectorAll('a')[1].focus();
  await userEvent.tab();

  expect(document.activeElement).toBe(host.querySelector('yk-button'));
});

test('restores the row layout at wide widths', async () => {
  const host = makeHeader(
    `${NAV_LINKS}<yk-button slot="actions">Save</yk-button>`,
  );
  host.style.inlineSize = '800px';
  await frame();

  expect(getComputedStyle(partOf(host, 'nav')).display).toBe('flex');
  expect(getComputedStyle(partOf(host, 'actions')).display).toBe('flex');
  expect(getComputedStyle(partOf(host, 'toggle')).display).toBe('none');
});

test('reuses a declarative shadow root and wires the toggle', async () => {
  const host = makeDSDHeader(
    '<img slot="brand" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="" /><a href="#">Docs</a><yk-button slot="actions">Sign in</yk-button>',
  );
  host.style.inlineSize = '800px';
  await frame();

  expect(host.shadowRoot.querySelector('style')).not.toBeNull();
  expect(host.shadowRoot.adoptedStyleSheets.length).toBe(2);
  expect(host.hasAttribute('empty-brand')).toBe(false);
  expect(host.hasAttribute('empty-nav')).toBe(false);
  expect(host.hasAttribute('empty-actions')).toBe(false);
  expect(partOf(host, 'actions').id).toBe('actions');
  expect(getComputedStyle(partOf(host, 'nav')).display).not.toBe('none');

  partOf(host, 'toggle').click();
  expect(host.hasAttribute('open')).toBe(true);
  expect(partOf(host, 'toggle').getAttribute('aria-expanded')).toBe('true');
  expect(partOf(host, 'toggle').getAttribute('aria-controls')).toBe(
    'nav actions',
  );
});
