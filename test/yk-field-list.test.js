// @ts-check
import { afterEach, expect, test } from 'vitest';
import '../src/components/yk-field-list.js';
import '../src/components/yk-field-list-item.js';
import '../src/components/yk-textarea.js';

afterEach(() => {
  document.body.replaceChildren();
});

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

function makeList({ addLabel, removeLabel, template, items = [] } = {}) {
  const host = document.createElement('yk-field-list');
  if (addLabel) host.setAttribute('add-label', addLabel);
  if (removeLabel) host.setAttribute('remove-label', removeLabel);
  if (template) {
    const element = document.createElement('template');
    element.innerHTML = template;
    host.append(element);
  }
  for (const content of items) {
    const item = document.createElement('yk-field-list-item');
    item.innerHTML = content;
    host.append(item);
  }
  document.body.appendChild(host);
  return host;
}

const addOf = (host) => host.shadowRoot.querySelector('[part="add"]');
const addLabelOf = (host) =>
  host.shadowRoot.querySelector('[part="add-label"]');
const itemsOf = (host) => [
  ...host.querySelectorAll(':scope > yk-field-list-item'),
];
const removeLabelOf = (item) =>
  item.shadowRoot.querySelector('[part="remove"]').getAttribute('aria-label');

test('self-registers in the custom element registry', () => {
  expect(customElements.get('yk-field-list')).toBeDefined();
});

test('adopts its stylesheet as a constructable CSSStyleSheet', () => {
  const host = makeList();

  expect(host.shadowRoot.adoptedStyleSheets.length).toBe(1);
  expect(host.shadowRoot.adoptedStyleSheets[0]).toBeInstanceOf(CSSStyleSheet);
});

test('renders the items slot and the add button', () => {
  const host = makeList({ items: ['<p>Existing row</p>'] });

  const slot = host.shadowRoot.querySelector('[part="items"] slot');
  expect(slot?.assignedElements()).toEqual(itemsOf(host));
  expect(addOf(host)).not.toBeNull();
  expect(addOf(host).type).toBe('button');
});

test('names the add button Add item by default and from add-label', () => {
  const host = makeList();
  expect(addLabelOf(host).textContent).toBe('Add item');

  host.setAttribute('add-label', '例文を追加');
  expect(addLabelOf(host).textContent).toBe('例文を追加');
});

test('clones the template into a new item and emits yk-field-list-add', () => {
  const host = makeList({
    template: '<label>Text <input name="text"></label>',
  });
  const events = [];
  host.addEventListener('yk-field-list-add', (event) => events.push(event));

  addOf(host).click();

  const [item] = itemsOf(host);
  const field = item.querySelector('input[name="text"]');
  expect(field).not.toBeNull();
  expect(events.length).toBe(1);
  expect(events[0].bubbles).toBe(true);
  expect(events[0].composed).toBe(true);
  expect(events[0].detail.item).toBe(item);
  expect(document.activeElement).toBe(field);
});

test('focuses the first visible named field in the new row', () => {
  const host = makeList({
    template:
      '<input type="hidden" name="id" value="1">' +
      '<input name="disabled" disabled>' +
      '<input name="hidden" hidden>' +
      '<yk-textarea name="text"></yk-textarea>',
  });

  addOf(host).click();

  const [item] = itemsOf(host);
  const field = item.querySelector('yk-textarea[name="text"]');
  expect(document.activeElement).toBe(field);
  expect(field.shadowRoot.activeElement).toBe(
    field.shadowRoot.querySelector('textarea'),
  );
});

test('propagates remove-label to existing and new items', () => {
  const host = makeList({
    removeLabel: 'Remove this example',
    template: '<input name="text">',
    items: ['<p>Existing row</p>'],
  });

  expect(removeLabelOf(itemsOf(host)[0])).toBe('Remove this example');

  addOf(host).click();

  expect(removeLabelOf(itemsOf(host)[1])).toBe('Remove this example');
});

test('refreshes existing items when remove-label changes', () => {
  const host = makeList({
    removeLabel: 'Remove this example',
    items: ['<p>Existing row</p>'],
  });
  const [item] = itemsOf(host);

  host.setAttribute('remove-label', 'この例文を削除');

  expect(removeLabelOf(item)).toBe('この例文を削除');
});

test('keeps an item remove-label that overrides the list label', () => {
  const host = makeList({
    removeLabel: 'Remove this example',
    items: ['<p>Existing row</p>'],
  });
  const [item] = itemsOf(host);
  item.setAttribute('remove-label', 'Remove this row');

  host.setAttribute('remove-label', 'この例文を削除');

  expect(removeLabelOf(item)).toBe('Remove this row');
});

test('disables the add button while no template exists', async () => {
  const host = makeList({ items: ['<p>Existing row</p>'] });
  expect(addOf(host).disabled).toBe(true);

  const template = document.createElement('template');
  template.innerHTML = '<input name="text">';
  host.append(template);
  await frame();

  expect(addOf(host).disabled).toBe(false);
});

test('disables the add button again when the template is removed', async () => {
  const host = makeList({ template: '<input name="text">' });
  expect(addOf(host).disabled).toBe(false);

  host.querySelector(':scope > template').remove();
  await frame();

  expect(addOf(host).disabled).toBe(true);
});

test('styles the add button as a full-width dashed control', () => {
  const host = makeList({ template: '<input name="text">' });
  host.style.inlineSize = '320px';

  const button = addOf(host);
  const style = getComputedStyle(button);
  expect(style.borderTopStyle).toBe('dashed');
  expect(Math.round(button.getBoundingClientRect().width)).toBe(
    Math.round(host.getBoundingClientRect().width),
  );
});

test('leaves the template and the add button when an item removes itself', () => {
  const host = makeList({
    template: '<input name="text">',
    items: ['<p>Existing row</p>'],
  });

  itemsOf(host)[0].shadowRoot.querySelector('[part="remove"]').click();

  expect(itemsOf(host).length).toBe(0);
  expect(host.querySelector(':scope > template')).not.toBeNull();
  expect(addOf(host)).not.toBeNull();
});

test('hides itself through the hidden attribute', () => {
  const host = makeList();
  host.hidden = true;

  expect(getComputedStyle(host).display).toBe('none');
});

test('reuses a declarative shadow root and applies its labels', () => {
  const container = document.createElement('div');
  container.setHTMLUnsafe(
    '<yk-field-list add-label="Add row" remove-label="Remove row"><template shadowrootmode="open"><style>:host{--dsd:1px}</style><div part="items"><slot></slot></div><button part="add" type="button"><span part="add-label">Add item</span></button></template><template><p>New row</p></template><yk-field-list-item><p>Existing row</p></yk-field-list-item></yk-field-list>',
  );
  document.body.appendChild(container);
  const host = container.querySelector('yk-field-list');

  expect(host.shadowRoot.querySelector('style')).not.toBeNull();
  expect(host.shadowRoot.querySelectorAll('button').length).toBe(1);
  expect(host.shadowRoot.adoptedStyleSheets.length).toBe(1);
  expect(addLabelOf(host).textContent).toBe('Add row');
  expect(addOf(host).disabled).toBe(false);
  expect(removeLabelOf(itemsOf(host)[0])).toBe('Remove row');
});
