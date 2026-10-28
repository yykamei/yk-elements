// @ts-check
import { afterEach, expect, test } from 'vitest';
import '../src/components/yk-field-list-item.js';

afterEach(() => {
  document.body.replaceChildren();
});

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
const settle = async () => {
  await frame();
  await frame();
};

function makeItem({ removeLabel, content = '<p>Example sentence</p>' } = {}) {
  const host = document.createElement('yk-field-list-item');
  if (removeLabel) host.setAttribute('remove-label', removeLabel);
  host.innerHTML = content;
  document.body.appendChild(host);
  return host;
}

const removeOf = (host) => host.shadowRoot.querySelector('[part="remove"]');

test('self-registers in the custom element registry', () => {
  expect(customElements.get('yk-field-list-item')).toBeDefined();
});

test('adopts its stylesheet as a constructable CSSStyleSheet', () => {
  const host = makeItem();

  expect(host.shadowRoot.adoptedStyleSheets.length).toBe(1);
  expect(host.shadowRoot.adoptedStyleSheets[0]).toBeInstanceOf(CSSStyleSheet);
});

test('renders the content through the content part and the remove button', () => {
  const host = makeItem({ content: '<p>Example sentence</p>' });

  const slot = host.shadowRoot.querySelector('[part="content"] slot');
  expect(slot?.assignedElements()).toEqual([host.querySelector('p')]);
  expect(removeOf(host)).not.toBeNull();
  expect(removeOf(host).type).toBe('button');
  expect(removeOf(host).querySelector('svg path').getAttribute('d')).toContain(
    'M6 2.75h4',
  );
  expect(removeOf(host).querySelector('svg circle')).toBeNull();
});

test('names the remove button Remove item by default', () => {
  const host = makeItem();

  expect(removeOf(host).getAttribute('aria-label')).toBe('Remove item');
});

test('names the remove button from the remove-label attribute', () => {
  const host = makeItem({ removeLabel: 'この例文を削除' });

  expect(removeOf(host).getAttribute('aria-label')).toBe('この例文を削除');

  host.setAttribute('remove-label', '例文を削除');
  expect(removeOf(host).getAttribute('aria-label')).toBe('例文を削除');
});

test('falls back to the closest field list remove-label', () => {
  const list = document.createElement('yk-field-list');
  list.setAttribute('remove-label', 'Remove this example');
  const host = document.createElement('yk-field-list-item');
  list.append(host);
  document.body.appendChild(list);

  expect(removeOf(host).getAttribute('aria-label')).toBe('Remove this example');
});

test('prefers its own remove-label over the closest field list', () => {
  const list = document.createElement('yk-field-list');
  list.setAttribute('remove-label', 'Remove this example');
  const host = document.createElement('yk-field-list-item');
  host.setAttribute('remove-label', 'Remove this row');
  list.append(host);
  document.body.appendChild(list);

  expect(removeOf(host).getAttribute('aria-label')).toBe('Remove this row');
});

test('refreshes the fallback label when the closest list changes its wording', () => {
  const list = document.createElement('yk-field-list');
  list.setAttribute('remove-label', 'Remove this example');
  const host = document.createElement('yk-field-list-item');
  list.append(host);
  document.body.appendChild(list);

  list.setAttribute('remove-label', 'この例文を削除');
  host.refreshRemoveLabel();

  expect(removeOf(host).getAttribute('aria-label')).toBe('この例文を削除');
});

test('emits a cancelable remove event and removes itself when clicked', () => {
  const host = makeItem();
  const events = [];
  host.addEventListener('yk-field-list-item-remove', (event) =>
    events.push(event),
  );

  removeOf(host).click();

  expect(events.length).toBe(1);
  expect(events[0].bubbles).toBe(true);
  expect(events[0].composed).toBe(true);
  expect(events[0].cancelable).toBe(true);
  expect(events[0].detail.item).toBe(host);
  expect(host.isConnected).toBe(false);
});

test('keeps itself when the remove event is canceled', () => {
  const host = makeItem();
  host.addEventListener('yk-field-list-item-remove', (event) =>
    event.preventDefault(),
  );

  removeOf(host).click();

  expect(host.isConnected).toBe(true);
});

test('hides itself through the hidden attribute', () => {
  const host = makeItem();
  host.hidden = true;

  expect(getComputedStyle(host).display).toBe('none');
});

test('centers the remove button against short content', async () => {
  const host = makeItem({
    content: '<div style="block-size: 40px">Content</div>',
  });
  await settle();

  const content = host.shadowRoot.querySelector('[part="content"]');
  const button = removeOf(host);
  const contentRect = content.getBoundingClientRect();
  const buttonRect = button.getBoundingClientRect();
  const contentCenter = contentRect.top + contentRect.height / 2;
  const buttonCenter = buttonRect.top + buttonRect.height / 2;

  expect(host.hasAttribute('data-top-aligned')).toBe(false);
  expect(Math.abs(contentCenter - buttonCenter)).toBeLessThan(1);
});

test('top-aligns the remove button against tall content', async () => {
  const host = makeItem({
    content: '<div style="block-size: 200px">Content</div>',
  });
  await settle();

  const content = host.shadowRoot.querySelector('[part="content"]');
  const button = removeOf(host);
  const contentRect = content.getBoundingClientRect();
  const buttonRect = button.getBoundingClientRect();

  expect(host.hasAttribute('data-top-aligned')).toBe(true);
  expect(Math.abs(buttonRect.top - contentRect.top)).toBeLessThan(1);
});

test('switches alignment at the content threshold', async () => {
  const short = makeItem({
    content: '<div style="block-size: 80px">Content</div>',
  });
  const tall = makeItem({
    content: '<div style="block-size: 96px">Content</div>',
  });
  await settle();

  expect(short.hasAttribute('data-top-aligned')).toBe(false);
  expect(tall.hasAttribute('data-top-aligned')).toBe(true);
});

test('switches alignment when the content grows past the threshold', async () => {
  const host = makeItem({
    content: '<div style="block-size: 40px">Content</div>',
  });
  await settle();
  expect(host.hasAttribute('data-top-aligned')).toBe(false);

  host.querySelector('div').style.blockSize = '200px';
  await settle();

  expect(host.hasAttribute('data-top-aligned')).toBe(true);
});

test('restyles the surface and the remove button through the component tokens', async () => {
  const host = makeItem();
  const button = removeOf(host);
  // The button animates color changes; disable the transition so the token
  // resolves to its final value within the frame.
  button.style.transition = 'none';
  host.style.setProperty('--yk-field-list-item-bg', 'rgb(9, 8, 7)');
  host.style.setProperty('--yk-field-list-item-color', 'rgb(6, 5, 4)');
  host.style.setProperty('--yk-field-list-item-border-color', 'rgb(3, 2, 1)');
  host.style.setProperty('--yk-field-list-item-radius', '2px');
  host.style.setProperty('--yk-field-list-item-padding', '20px');
  host.style.setProperty('--yk-field-list-item-remove-color', 'rgb(1, 2, 3)');
  await frame();

  const style = getComputedStyle(host);
  expect(style.backgroundColor).toBe('rgb(9, 8, 7)');
  expect(style.color).toBe('rgb(6, 5, 4)');
  expect(style.borderTopColor).toBe('rgb(3, 2, 1)');
  expect(style.borderTopLeftRadius).toBe('2px');
  expect(style.paddingTop).toBe('20px');
  expect(getComputedStyle(button).color).toBe('rgb(1, 2, 3)');
});

test('reuses a declarative shadow root and keeps naming the remove button', () => {
  const container = document.createElement('div');
  container.setHTMLUnsafe(
    '<yk-field-list-item remove-label="Remove this row"><template shadowrootmode="open"><style>:host{--dsd:1px}</style><div part="content"><slot></slot></div><button part="remove" type="button" aria-label="Remove item"></button></template><p>Content</p></yk-field-list-item>',
  );
  document.body.appendChild(container);
  const host = container.querySelector('yk-field-list-item');

  expect(host.shadowRoot.querySelector('style')).not.toBeNull();
  expect(host.shadowRoot.querySelectorAll('button').length).toBe(1);
  expect(host.shadowRoot.adoptedStyleSheets.length).toBe(1);
  expect(removeOf(host).getAttribute('aria-label')).toBe('Remove this row');
});
