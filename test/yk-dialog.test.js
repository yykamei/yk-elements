// @ts-check
import { afterEach, expect, test } from 'vitest';
import '../src/components/yk-dialog.js';

afterEach(() => {
  for (const host of document.querySelectorAll('yk-dialog')) {
    if (host.open) host.close();
  }
  document.body.replaceChildren();
});

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

function makeDialog(innerHTML = '') {
  const host = document.createElement('yk-dialog');
  host.innerHTML = innerHTML;
  document.body.appendChild(host);
  return host;
}

const dialogOf = (host) => host.shadowRoot.querySelector('dialog');
const regionOf = (host, part) =>
  host.shadowRoot.querySelector(`[part="${part}"]`);

test('self-registers in the custom element registry', () => {
  expect(customElements.get('yk-dialog')).toBeDefined();
});

test('adopts its stylesheet as a constructable CSSStyleSheet', () => {
  const host = makeDialog();

  expect(host.shadowRoot.adoptedStyleSheets.length).toBe(1);
  expect(host.shadowRoot.adoptedStyleSheets[0]).toBeInstanceOf(CSSStyleSheet);
});

test('renders an internal dialog with header, body, and footer regions', () => {
  const host = makeDialog('<p>Body</p>');

  expect(dialogOf(host).getAttribute('part')).toBe('dialog');
  expect(regionOf(host, 'header')).not.toBeNull();
  expect(regionOf(host, 'body')).not.toBeNull();
  expect(regionOf(host, 'footer')).not.toBeNull();
});

test('stays hidden while closed', () => {
  const host = makeDialog('<p>Body</p>');

  expect(getComputedStyle(dialogOf(host)).display).toBe('none');
});

test('collapses the header and footer regions while they are empty', async () => {
  const host = makeDialog('<p>Body</p>');
  await frame();

  expect(getComputedStyle(regionOf(host, 'header')).height).toBe('0px');
  expect(getComputedStyle(regionOf(host, 'footer')).height).toBe('0px');
});

test('shows the header and footer regions once content is assigned', async () => {
  const host = makeDialog(
    '<h2 slot="header">Title</h2><p>Body</p><span slot="footer">Footer</span>',
  );
  await frame();

  expect(host.hasAttribute('has-header')).toBe(true);
  expect(host.hasAttribute('has-footer')).toBe(true);
  expect(getComputedStyle(regionOf(host, 'header')).height).not.toBe('0px');
  expect(getComputedStyle(regionOf(host, 'footer')).height).not.toBe('0px');
});

test('opens as a modal when the open attribute is set', () => {
  const host = makeDialog('<p>Body</p>');

  host.setAttribute('open', '');

  expect(host.open).toBe(true);
  expect(dialogOf(host).open).toBe(true);
  expect(dialogOf(host).matches(':modal')).toBe(true);
});

test('opens through showModal and reflects the open attribute', () => {
  const host = makeDialog('<p>Body</p>');

  host.showModal();

  expect(host.open).toBe(true);
  expect(host.hasAttribute('open')).toBe(true);
});

test('closes when the open attribute is removed', () => {
  const host = makeDialog('<p>Body</p>');
  host.setAttribute('open', '');

  host.removeAttribute('open');

  expect(host.open).toBe(false);
  expect(dialogOf(host).open).toBe(false);
});

test('closes on a backdrop click by default', () => {
  const host = makeDialog('<p>Body</p>');
  host.showModal();

  dialogOf(host).dispatchEvent(
    new MouseEvent('click', { clientX: 99999, clientY: 99999, bubbles: true }),
  );

  expect(host.open).toBe(false);
});

test('ignores a backdrop click when closedby is none', () => {
  const host = makeDialog('<p>Body</p>');
  host.setAttribute('closedby', 'none');
  host.showModal();

  dialogOf(host).dispatchEvent(
    new MouseEvent('click', { clientX: 99999, clientY: 99999, bubbles: true }),
  );

  expect(host.open).toBe(true);
});

test('ignores a click inside the dialog', () => {
  const host = makeDialog('<p>Body</p>');
  host.showModal();
  const rect = dialogOf(host).getBoundingClientRect();

  dialogOf(host).dispatchEvent(
    new MouseEvent('click', {
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
      bubbles: true,
    }),
  );

  expect(host.open).toBe(true);
});

test('suppresses the cancel event (Escape) when closedby is none', () => {
  const host = makeDialog('<p>Body</p>');
  host.setAttribute('closedby', 'none');
  host.showModal();

  const cancel = new Event('cancel', { cancelable: true });
  dialogOf(host).dispatchEvent(cancel);

  expect(cancel.defaultPrevented).toBe(true);
});

test('lets the cancel event (Escape) proceed by default', () => {
  const host = makeDialog('<p>Body</p>');
  host.showModal();

  const cancel = new Event('cancel', { cancelable: true });
  dialogOf(host).dispatchEvent(cancel);

  expect(cancel.defaultPrevented).toBe(false);
});

test('renders a close button named Close by default', () => {
  const host = makeDialog('<p>Body</p>');

  const close = host.shadowRoot.querySelector('[part="close"]');
  expect(close).not.toBeNull();
  expect(close.getAttribute('aria-label')).toBe('Close');
});

test('the close button closes the dialog and emits yk-dialog-close', async () => {
  const host = makeDialog('<p>Body</p>');
  const closes = [];
  host.addEventListener('yk-dialog-close', (event) => closes.push(event));
  host.showModal();

  host.shadowRoot.querySelector('[part="close"]').click();
  await frame();

  expect(host.open).toBe(false);
  expect(host.hasAttribute('open')).toBe(false);
  expect(closes.length).toBe(1);
  expect(closes[0].detail.returnValue).toBe('');
});

test('the close button closes even when closedby is none', async () => {
  const host = makeDialog('<p>Body</p>');
  host.setAttribute('closedby', 'none');
  host.showModal();

  host.shadowRoot.querySelector('[part="close"]').click();
  await frame();

  expect(host.open).toBe(false);
});

test('localizes the close button through the close-label slot', async () => {
  const host = document.createElement('yk-dialog');
  const label = document.createElement('span');
  label.setAttribute('slot', 'close-label');
  label.textContent = '閉じる';
  host.append(label, document.createTextNode('Body'));
  document.body.appendChild(host);
  await frame();

  expect(
    host.shadowRoot.querySelector('[part="close"]').getAttribute('aria-label'),
  ).toBe('閉じる');
});

test('falls back to Close when the close-label text is blank', async () => {
  const host = document.createElement('yk-dialog');
  const label = document.createElement('span');
  label.setAttribute('slot', 'close-label');
  label.textContent = '   ';
  host.append(label, document.createTextNode('Body'));
  document.body.appendChild(host);
  await frame();

  expect(
    host.shadowRoot.querySelector('[part="close"]').getAttribute('aria-label'),
  ).toBe('Close');
});

test('reserves corner space for the close button', () => {
  const withHeader = makeDialog('<h2 slot="header">Title</h2><p>Body</p>');
  const withoutHeader = makeDialog('<p>Body</p>');

  expect(
    getComputedStyle(regionOf(withHeader, 'header')).paddingInlineEnd,
  ).toBe('48px');
  expect(getComputedStyle(regionOf(withHeader, 'body')).paddingInlineEnd).toBe(
    '16px',
  );
  expect(
    getComputedStyle(regionOf(withoutHeader, 'body')).paddingInlineEnd,
  ).toBe('48px');
});

test('keeps the close button in place while the body scrolls', async () => {
  const host = makeDialog(`<p>${'long '.repeat(400)}</p>`);
  host.style.setProperty('--yk-dialog-max-block-size', '10rem');
  host.showModal();
  await frame();

  const close = host.shadowRoot.querySelector('[part="close"]');
  const before = close.getBoundingClientRect().top;

  regionOf(host, 'body').scrollTop = 200;
  await frame();

  expect(regionOf(host, 'body').scrollTop).toBeGreaterThan(0);
  expect(close.getBoundingClientRect().top).toBe(before);
});

test('focuses the first content control when opened with the open attribute', async () => {
  document.body.innerHTML = `
    <yk-dialog open>
      <a slot="header" href="#">Title</a>
      <p>Body</p>
    </yk-dialog>
  `;
  const host = document.querySelector('yk-dialog');
  await frame();

  expect(host.open).toBe(true);
  // Slotted content is focused in the light tree, so the shadow root reports no
  // active element; the close button must not have taken focus instead.
  expect(host.querySelector('a').matches(':focus')).toBe(true);
  expect(
    host.shadowRoot.querySelector('[part="close"]').matches(':focus'),
  ).toBe(false);
});

test('close sets the return value, clears open, and emits yk-dialog-close', async () => {
  const host = makeDialog('<p>Body</p>');
  const closes = [];
  host.addEventListener('yk-dialog-close', (event) => closes.push(event));
  host.showModal();

  host.close('confirm');
  await frame();

  expect(host.open).toBe(false);
  expect(host.hasAttribute('open')).toBe(false);
  expect(host.returnValue).toBe('confirm');
  expect(closes.length).toBe(1);
  expect(closes[0].detail.returnValue).toBe('confirm');
  expect(closes[0].composed).toBe(true);
});

test('a slotted form with method=dialog closes it with the button value', async () => {
  const host = makeDialog(`
    <p>Delete this target?</p>
    <form method="dialog" slot="footer">
      <button value="confirm">Delete</button>
    </form>
  `);
  host.showModal();

  host.querySelector('button').click();
  await frame();

  expect(host.open).toBe(false);
  expect(host.returnValue).toBe('confirm');
});

test('forwards aria-label to the internal dialog', () => {
  const host = makeDialog('<p>Body</p>');

  host.setAttribute('aria-label', 'Delete this target?');

  expect(dialogOf(host).getAttribute('aria-label')).toBe('Delete this target?');
});

test('forwards aria-labelledby to the internal dialog', () => {
  const host = makeDialog('<p>Body</p>');

  host.setAttribute('aria-labelledby', 'dialog-title');

  expect(dialogOf(host).getAttribute('aria-labelledby')).toBe('dialog-title');
});

test('showModal is a no-op when the dialog is already open', () => {
  const host = makeDialog('<p>Body</p>');
  host.showModal();

  expect(() => host.showModal()).not.toThrow();
  expect(host.open).toBe(true);
});

test('ignores a form that does not use method=dialog', () => {
  const host = makeDialog(`
    <form slot="footer">
      <button type="submit">Send</button>
    </form>
  `);
  host.showModal();
  host
    .querySelector('form')
    .addEventListener('submit', (event) => event.preventDefault());

  host.querySelector('button').click();

  expect(host.open).toBe(true);
});

test('a dialog-method submit only closes its own dialog', () => {
  const outer = makeDialog('<p>Outer</p>');
  const inner = document.createElement('yk-dialog');
  inner.innerHTML = `
    <form method="dialog" slot="footer">
      <button value="ok">OK</button>
    </form>
  `;
  outer.append(inner);
  outer.showModal();
  inner.showModal();

  inner.querySelector('button').click();

  expect(inner.open).toBe(false);
  expect(outer.open).toBe(true);
});

test('mirrors closedby onto the internal dialog, defaulting to any', () => {
  const host = makeDialog('<p>Body</p>');

  expect(dialogOf(host).getAttribute('closedby')).toBe('any');

  host.setAttribute('closedby', 'none');
  expect(dialogOf(host).getAttribute('closedby')).toBe('none');

  host.setAttribute('closedby', 'NONE');
  expect(dialogOf(host).getAttribute('closedby')).toBe('none');

  host.removeAttribute('closedby');
  expect(dialogOf(host).getAttribute('closedby')).toBe('any');
});

test('clears the previous return value when it opens again', () => {
  const host = makeDialog('<p>Body</p>');
  host.showModal();
  host.close('confirm');
  expect(host.returnValue).toBe('confirm');

  host.showModal();

  expect(host.returnValue).toBe('');
});

test('restyles the surface through the component tokens', async () => {
  const host = makeDialog('<p>Body</p>');
  host.style.setProperty('--yk-dialog-bg', 'rgb(9, 8, 7)');
  host.style.setProperty('--yk-dialog-border-color', 'rgb(3, 2, 1)');
  host.style.setProperty('--yk-dialog-radius', '2px');
  host.style.setProperty('--yk-dialog-padding', '20px');
  await frame();

  const style = getComputedStyle(dialogOf(host));
  const body = getComputedStyle(regionOf(host, 'body'));
  expect(style.backgroundColor).toBe('rgb(9, 8, 7)');
  expect(style.borderTopColor).toBe('rgb(3, 2, 1)');
  expect(style.borderTopLeftRadius).toBe('2px');
  expect(body.paddingTop).toBe('20px');
});
