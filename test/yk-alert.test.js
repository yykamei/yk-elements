// @ts-check
import { afterEach, expect, test } from 'vitest';
import '../src/components/yk-alert.js';

afterEach(() => {
  document.body.replaceChildren();
});

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

function makeAlert({ variant, dismissible, label } = {}) {
  const host = document.createElement('yk-alert');
  if (variant) host.setAttribute('variant', variant);
  if (dismissible) host.setAttribute('dismissible', '');
  if (label) {
    const span = document.createElement('span');
    span.setAttribute('slot', 'dismiss-label');
    span.textContent = label;
    host.append(span);
  }
  host.append(document.createTextNode('Something happened'));
  document.body.appendChild(host);
  return host;
}

const dismissOf = (host) => host.shadowRoot.querySelector('[part="dismiss"]');

test('self-registers in the custom element registry', () => {
  expect(customElements.get('yk-alert')).toBeDefined();
});

test('adopts its stylesheet as a constructable CSSStyleSheet', () => {
  const host = makeAlert();

  expect(host.shadowRoot.adoptedStyleSheets.length).toBe(1);
  expect(host.shadowRoot.adoptedStyleSheets[0]).toBeInstanceOf(CSSStyleSheet);
});

test('renders its content through the content part', () => {
  const host = makeAlert();

  const slot = host.shadowRoot.querySelector('[part="content"] slot');
  expect(slot.assignedNodes().map((node) => node.textContent)).toContain(
    'Something happened',
  );
});

test('tints the face per variant, defaulting to the info tone', () => {
  const defaultTone = getComputedStyle(makeAlert()).backgroundColor;
  const info = getComputedStyle(makeAlert({ variant: 'info' })).backgroundColor;
  const danger = getComputedStyle(
    makeAlert({ variant: 'danger' }),
  ).backgroundColor;
  const warning = getComputedStyle(
    makeAlert({ variant: 'warning' }),
  ).backgroundColor;
  const success = getComputedStyle(
    makeAlert({ variant: 'success' }),
  ).backgroundColor;

  expect(defaultTone).toBe(info);
  expect(new Set([info, danger, warning, success]).size).toBe(4);
});

test('hides the dismiss button unless dismissible is set', () => {
  const plain = makeAlert();
  const dismissible = makeAlert({ dismissible: true });

  expect(getComputedStyle(dismissOf(plain)).display).toBe('none');
  expect(getComputedStyle(dismissOf(dismissible)).display).not.toBe('none');
});

test('names the dismiss button Dismiss by default', () => {
  const host = makeAlert({ dismissible: true });

  expect(dismissOf(host).getAttribute('aria-label')).toBe('Dismiss');
});

test('localizes the dismiss button through the dismiss-label slot', async () => {
  const host = makeAlert({ dismissible: true, label: '閉じる' });
  await frame();

  expect(dismissOf(host).getAttribute('aria-label')).toBe('閉じる');
});

test('removes itself and emits yk-alert-dismiss when the button is clicked', () => {
  const host = makeAlert({ dismissible: true });
  const events = [];
  host.addEventListener('yk-alert-dismiss', (event) => events.push(event));

  dismissOf(host).click();

  expect(events.length).toBe(1);
  expect(events[0].bubbles).toBe(true);
  expect(events[0].composed).toBe(true);
  expect(host.isConnected).toBe(false);
});

test('keeps the alert when the dismiss event is canceled', () => {
  const host = makeAlert({ dismissible: true });
  host.addEventListener('yk-alert-dismiss', (event) => event.preventDefault());

  dismissOf(host).click();

  expect(host.isConnected).toBe(true);
});

test('restyles the face through the component tokens', () => {
  const host = makeAlert({ variant: 'danger' });
  host.style.setProperty('--yk-alert-bg', 'rgb(9, 8, 7)');
  host.style.setProperty('--yk-alert-border-color', 'rgb(3, 2, 1)');
  host.style.setProperty('--yk-alert-radius', '2px');
  host.style.setProperty('--yk-alert-padding', '20px');

  const style = getComputedStyle(host);
  expect(style.backgroundColor).toBe('rgb(9, 8, 7)');
  expect(style.borderTopColor).toBe('rgb(3, 2, 1)');
  expect(style.borderTopLeftRadius).toBe('2px');
  expect(style.paddingTop).toBe('20px');
});
