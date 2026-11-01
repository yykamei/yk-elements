// @ts-check
import { afterEach, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../src/components/yk-header.js';
import '../src/components/yk-header-menu.js';
import '../src/components/yk-link.js';

afterEach(() => {
  document.body.replaceChildren();
});

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

function makeMenu(innerHTML = '') {
  const host = document.createElement('yk-header-menu');
  host.innerHTML = innerHTML;
  document.body.appendChild(host);
  return host;
}

function makeHeaderWithMenu(width = '400px') {
  const header = document.createElement('yk-header');
  header.style.inlineSize = width;
  header.innerHTML = `
    <yk-header-menu>
      <span slot="summary">Products</span>
      <a href="#">Cloud</a>
      <a href="#">Edge</a>
    </yk-header-menu>
  `;
  document.body.appendChild(header);
  return header;
}

const partOf = (host, part) =>
  host.shadowRoot.querySelector(`[part="${part}"]`);

const MENU_CONTENT = `
  <span slot="summary">Products</span>
  <a href="#">Cloud</a>
  <a href="#">Edge</a>
`;

const DSD_SHADOW =
  '<template shadowrootmode="open"><style>:host{--dsd:1px}</style><div part="disclosure"><button part="toggle" type="button" aria-expanded="false" aria-controls="panel"><slot name="summary">Menu</slot><svg part="chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4" /></svg></button><div part="panel" id="panel"><slot></slot></div></div></template>';

function makeDSDMenu(content = '') {
  const container = document.createElement('div');
  container.setHTMLUnsafe(
    `<yk-header-menu>${DSD_SHADOW}${content}</yk-header-menu>`,
  );
  document.body.appendChild(container);
  return container.querySelector('yk-header-menu');
}

test('self-registers in the custom element registry', () => {
  expect(customElements.get('yk-header-menu')).toBeDefined();
});

test('adopts the shared and component stylesheets', () => {
  const host = makeMenu();

  expect(host.shadowRoot.adoptedStyleSheets.length).toBe(2);
  for (const sheet of host.shadowRoot.adoptedStyleSheets) {
    expect(sheet).toBeInstanceOf(CSSStyleSheet);
  }
});

test('renders the disclosure with a button, chevron, panel, and two slots', () => {
  const host = makeMenu();

  expect(partOf(host, 'disclosure')).not.toBeNull();
  expect(partOf(host, 'toggle')).not.toBeNull();
  expect(partOf(host, 'chevron')).not.toBeNull();
  expect(partOf(host, 'panel')).not.toBeNull();
  expect(partOf(host, 'toggle').getAttribute('aria-controls')).toBe(
    partOf(host, 'panel').id,
  );
  expect(host.shadowRoot.querySelectorAll('slot').length).toBe(2);
});

test('assigns the summary and the panel links', () => {
  const host = makeMenu(MENU_CONTENT);

  expect(
    host.shadowRoot.querySelector('slot[name="summary"]').assignedElements(),
  ).toEqual([host.querySelector('span[slot="summary"]')]);
  expect(
    host.shadowRoot.querySelector('slot:not([name])').assignedElements(),
  ).toEqual([...host.querySelectorAll('a:not([slot])')]);
});

test('falls back to Menu when the summary slot is empty', () => {
  const host = makeMenu();

  expect(partOf(host, 'toggle').textContent.trim()).toContain('Menu');
});

test('toggles open and mirrors aria-expanded on the button', () => {
  const host = makeMenu(MENU_CONTENT);
  const toggle = partOf(host, 'toggle');

  expect(toggle.getAttribute('aria-expanded')).toBe('false');

  toggle.click();
  expect(host.hasAttribute('open')).toBe(true);
  expect(toggle.getAttribute('aria-expanded')).toBe('true');
  expect(getComputedStyle(partOf(host, 'chevron')).transform).not.toBe('none');

  toggle.click();
  expect(host.hasAttribute('open')).toBe(false);
  expect(toggle.getAttribute('aria-expanded')).toBe('false');
});

test('mirrors an externally declared open attribute', () => {
  const host = makeMenu(MENU_CONTENT);
  const toggle = partOf(host, 'toggle');

  host.setAttribute('open', '');
  expect(toggle.getAttribute('aria-expanded')).toBe('true');

  host.removeAttribute('open');
  expect(toggle.getAttribute('aria-expanded')).toBe('false');
});

test('closes on Escape and returns focus to the toggle', () => {
  const host = makeMenu(MENU_CONTENT);
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

test('closes on a pointerdown outside the menu', () => {
  const host = makeMenu(MENU_CONTENT);
  host.setAttribute('open', '');
  const outside = document.createElement('button');
  document.body.appendChild(outside);

  outside.dispatchEvent(
    new PointerEvent('pointerdown', { bubbles: true, composed: true }),
  );

  expect(host.hasAttribute('open')).toBe(false);
});

test('keeps the panel open on a pointerdown inside it', () => {
  const host = makeMenu(MENU_CONTENT);
  host.setAttribute('open', '');

  partOf(host, 'panel').dispatchEvent(
    new PointerEvent('pointerdown', { bubbles: true, composed: true }),
  );

  expect(host.hasAttribute('open')).toBe(true);
});

test('closes when a panel link is activated', () => {
  const host = makeMenu(MENU_CONTENT);
  host.setAttribute('open', '');
  const link = host.querySelector('a');
  link.addEventListener('click', (event) => event.preventDefault());

  link.click();

  expect(host.hasAttribute('open')).toBe(false);
});

test('closes when a yk-link in the panel is activated', () => {
  const host = makeMenu(
    '<span slot="summary">Products</span><yk-link href="/cloud">Cloud</yk-link>',
  );
  host.setAttribute('open', '');
  const anchor = host.querySelector('yk-link').shadowRoot.querySelector('a');
  anchor.addEventListener('click', (event) => event.preventDefault());

  anchor.click();

  expect(host.hasAttribute('open')).toBe(false);
});

test('moves focus from the toggle into the panel', async () => {
  const host = makeMenu(MENU_CONTENT);
  host.setAttribute('open', '');
  await frame();

  partOf(host, 'toggle').focus();
  await userEvent.tab();

  expect(document.activeElement).toBe(host.querySelector('a'));
});

test('uses a floating panel when no container bounds the menu', async () => {
  const host = makeMenu(MENU_CONTENT);
  const panel = partOf(host, 'panel');

  expect(getComputedStyle(panel).position).toBe('absolute');
  expect(getComputedStyle(panel).display).toBe('none');

  host.setAttribute('open', '');
  await frame();

  expect(getComputedStyle(panel).display).toBe('block');
});

test('keeps the panel floating inside a wide header', async () => {
  const header = makeHeaderWithMenu('800px');
  await frame();
  const menu = header.querySelector('yk-header-menu');

  expect(getComputedStyle(partOf(menu, 'panel')).position).toBe('absolute');
});

test('closes the menu before the header on Escape', async () => {
  const header = makeHeaderWithMenu();
  header.setAttribute('open', '');
  const menu = header.querySelector('yk-header-menu');
  menu.setAttribute('open', '');
  await frame();
  const toggle = partOf(menu, 'toggle');
  const link = menu.querySelector('a');

  link.focus();
  link.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      composed: true,
    }),
  );

  expect(menu.hasAttribute('open')).toBe(false);
  expect(header.hasAttribute('open')).toBe(true);
  expect(menu.shadowRoot.activeElement).toBe(toggle);
});

test('lets Escape reach the header when the menu is closed', async () => {
  const header = makeHeaderWithMenu();
  header.setAttribute('open', '');
  await frame();
  const menu = header.querySelector('yk-header-menu');
  const toggle = partOf(menu, 'toggle');

  toggle.focus();
  toggle.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      composed: true,
    }),
  );

  expect(menu.hasAttribute('open')).toBe(false);
  expect(header.hasAttribute('open')).toBe(false);
});

test('restyles the panel and chevron through component tokens', async () => {
  const host = makeMenu(MENU_CONTENT);
  host.style.setProperty('--yk-header-menu-panel-bg', 'rgb(9, 8, 7)');
  host.style.setProperty('--yk-header-menu-panel-border-color', 'rgb(3, 2, 1)');
  host.style.setProperty('--yk-header-menu-panel-radius', '9px');
  host.style.setProperty(
    '--yk-header-menu-panel-shadow',
    '0 1px 2px rgb(1, 2, 3)',
  );
  host.style.setProperty('--yk-header-menu-panel-padding', '13px');
  host.style.setProperty('--yk-header-menu-chevron-size', '2rem');
  host.setAttribute('open', '');
  await frame();

  const panel = partOf(host, 'panel');
  const panelStyle = getComputedStyle(panel);
  expect(panelStyle.backgroundColor).toBe('rgb(9, 8, 7)');
  expect(panelStyle.borderTopColor).toBe('rgb(3, 2, 1)');
  expect(panelStyle.borderTopLeftRadius).toBe('9px');
  expect(panelStyle.boxShadow).not.toBe('none');
  expect(panelStyle.paddingTop).toBe('13px');
  expect(getComputedStyle(partOf(host, 'chevron')).width).toBe('32px');
});

test('reuses a declarative shadow root and wires the toggle', async () => {
  const host = makeDSDMenu(MENU_CONTENT);
  await frame();

  expect(host.shadowRoot.querySelector('style')).not.toBeNull();
  expect(host.shadowRoot.adoptedStyleSheets.length).toBe(2);
  expect(host.shadowRoot.querySelector('slot[name="summary"]')).not.toBeNull();

  partOf(host, 'toggle').click();
  expect(host.hasAttribute('open')).toBe(true);
  expect(partOf(host, 'toggle').getAttribute('aria-expanded')).toBe('true');
});
