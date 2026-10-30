// @ts-check
import { afterAll, afterEach, beforeAll, expect, test } from 'vitest';
// Components import their own CSS, but the tokens are a page-level stylesheet
// the consumer links, so the test injects them the way a real page does.
import tokensCss from '../tokens.css?raw';
import { channels, contrast } from './helpers/color.js';
import '../src/components/yk-alert.js';

let tokens;

beforeAll(() => {
  tokens = document.createElement('style');
  tokens.textContent = tokensCss;
  document.head.append(tokens);
});

afterAll(() => {
  tokens.remove();
});

afterEach(() => {
  document.body.replaceChildren();
});

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

function makeAlert({ variant, dismissible, label, scheme } = {}) {
  const host = document.createElement('yk-alert');
  if (variant) host.setAttribute('variant', variant);
  if (dismissible) host.setAttribute('dismissible', '');
  if (scheme) host.style.colorScheme = scheme;
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

const VARIANTS = ['info', 'danger', 'warning', 'success'];

test('tints each variant toward its own hue in both schemes', () => {
  for (const scheme of ['light', 'dark']) {
    const tint = (variant) =>
      channels(
        getComputedStyle(makeAlert({ variant, scheme })).backgroundColor,
      );

    const info = tint('info');
    expect(info[2], `info blue over red (${scheme})`).toBeGreaterThan(info[0]);
    expect(info[1], `info green over red (${scheme})`).toBeGreaterThan(info[0]);
    expect(info[2], `info blue over green (${scheme})`).toBeGreaterThan(
      info[1],
    );

    const success = tint('success');
    expect(success[1], `success green over red (${scheme})`).toBeGreaterThan(
      success[0],
    );
    expect(success[1], `success green over blue (${scheme})`).toBeGreaterThan(
      success[2],
    );

    const danger = tint('danger');
    expect(danger[0], `danger red over green (${scheme})`).toBeGreaterThan(
      danger[1],
    );
    expect(danger[0], `danger red over blue (${scheme})`).toBeGreaterThan(
      danger[2],
    );

    const warning = tint('warning');
    expect(warning[0], `warning red over green (${scheme})`).toBeGreaterThan(
      warning[1],
    );
    expect(warning[0], `warning red over blue (${scheme})`).toBeGreaterThan(
      warning[2],
    );
    expect(warning[1], `warning green over blue (${scheme})`).toBeGreaterThan(
      warning[2],
    );
  }
});

test('keeps variant text at AA contrast on its tint in both schemes', () => {
  for (const scheme of ['light', 'dark']) {
    for (const variant of VARIANTS) {
      const style = getComputedStyle(makeAlert({ variant, scheme }));
      expect(
        contrast(style.color, style.backgroundColor),
        `${variant} (${scheme})`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  }
});

test('keeps the dismiss icon above non-text contrast in both schemes', () => {
  for (const scheme of ['light', 'dark']) {
    for (const variant of VARIANTS) {
      const host = makeAlert({ variant, dismissible: true, scheme });
      const face = getComputedStyle(host).backgroundColor;
      const dismiss = dismissOf(host);
      const icon = getComputedStyle(dismiss).color;
      const opacity = Number(getComputedStyle(dismiss).opacity);
      const rendered = `color-mix(in srgb, ${icon} ${opacity * 100}%, ${face})`;
      expect(
        contrast(rendered, face),
        `${variant} (${scheme})`,
      ).toBeGreaterThanOrEqual(3);
    }
  }
});

test('derives the info and success colors from their palette tokens', () => {
  const info = makeAlert({ variant: 'info', scheme: 'light' });
  const infoDefault = channels(getComputedStyle(info).backgroundColor);
  const infoTextDefault = channels(getComputedStyle(info).color);
  info.style.setProperty('--yk-color-info', 'rgb(255, 0, 0)');
  const infoRed = channels(getComputedStyle(info).backgroundColor);
  const infoTextRed = channels(getComputedStyle(info).color);
  expect(infoRed[0]).toBeGreaterThan(infoDefault[0]);
  expect(infoRed[0]).toBeGreaterThan(infoRed[2]);
  expect(infoTextRed[0]).toBeGreaterThan(infoTextDefault[0]);
  expect(infoTextRed[0]).toBeGreaterThan(infoTextRed[2]);

  const success = makeAlert({ variant: 'success', scheme: 'light' });
  const successDefault = channels(getComputedStyle(success).backgroundColor);
  success.style.setProperty('--yk-color-success', 'rgb(255, 0, 0)');
  const successRed = channels(getComputedStyle(success).backgroundColor);
  expect(successRed[0]).toBeGreaterThan(successDefault[0]);
  expect(successRed[0]).toBeGreaterThan(successRed[1]);
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
  host.style.setProperty('--yk-alert-color', 'rgb(4, 5, 6)');
  host.style.setProperty('--yk-alert-border-color', 'rgb(3, 2, 1)');
  host.style.setProperty('--yk-alert-radius', '2px');
  host.style.setProperty('--yk-alert-padding', '20px');

  const style = getComputedStyle(host);
  expect(style.backgroundColor).toBe('rgb(9, 8, 7)');
  expect(style.color).toBe('rgb(4, 5, 6)');
  expect(style.borderTopColor).toBe('rgb(3, 2, 1)');
  expect(style.borderTopLeftRadius).toBe('2px');
  expect(style.paddingTop).toBe('20px');
});

test('reuses a declarative shadow root and keeps naming the dismiss button', () => {
  const container = document.createElement('div');
  container.setHTMLUnsafe(
    '<yk-alert><template shadowrootmode="open"><style>:host{--dsd:1px}</style><div part="content"><slot></slot></div><button part="dismiss" type="button"></button><slot name="dismiss-label" hidden>Dismiss</slot></template>Something happened</yk-alert>',
  );
  document.body.appendChild(container);
  const host = container.querySelector('yk-alert');

  expect(host.shadowRoot.querySelector('style')).not.toBeNull();
  expect(host.shadowRoot.querySelectorAll('button').length).toBe(1);
  expect(host.shadowRoot.adoptedStyleSheets.length).toBe(1);
  expect(
    host.shadowRoot
      .querySelector('[part="dismiss"]')
      .getAttribute('aria-label'),
  ).toBe('Dismiss');
});
