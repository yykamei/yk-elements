/**
 * Repeatable form group that renders a full-width add button and clones a
 * template into `yk-field-list-item` rows.
 *
 * Place the row content once inside a `<template>` and put any existing rows
 * next to it as `<yk-field-list-item>` children. Clicking the add button
 * clones the template into a new item, appends it, focuses its first visible
 * named field, and emits `yk-field-list-add` (`detail.item` is the new row).
 * The add button's label comes from `add-label` and defaults to "Add item".
 * The list's `remove-label` is the fallback accessible name for its items'
 * remove buttons; an item's own `remove-label` still wins. Renaming the list
 * label updates the existing rows through `refreshRemoveLabel()`. Without a
 * template the add button is disabled.
 *
 * ```html
 * <script type="module" src="./index.js"></script>
 * <yk-field-list add-label="Add example" remove-label="Remove this example">
 *   <template>
 *     <label>Text <yk-textarea name="examples[][text]"></yk-textarea></label>
 *   </template>
 *   <yk-field-list-item>
 *     <label>Text <yk-textarea name="examples[][text]"></yk-textarea></label>
 *   </yk-field-list-item>
 * </yk-field-list>
 * ```
 */
import '../base.js';
import './yk-field-list-item.js';
import { ensureShadow } from '../dsd.js';
import sheet from './yk-field-list.css' with { type: 'css' };

const DEFAULT_ADD_LABEL = 'Add item';

const addIcon = `
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 3.25v9.5M3.25 8h9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
  </svg>
`;

class YKFieldList extends HTMLElement {
  static observedAttributes = ['add-label', 'remove-label'];

  #add;

  #addLabel;

  constructor() {
    super();
    const shadowRoot = ensureShadow(this, {
      styles: [sheet],
      render: (root) => {
        root.innerHTML = `
      <div part="items"><slot></slot></div>
      <button part="add" type="button">
        ${addIcon}
        <span part="add-label">${DEFAULT_ADD_LABEL}</span>
      </button>
    `;
      },
    });
    this.#add = shadowRoot.querySelector('[part="add"]');
    this.#addLabel = shadowRoot.querySelector('[part="add-label"]');
    shadowRoot
      .querySelector('slot')
      .addEventListener('slotchange', () => this.#syncState());
    this.#add.addEventListener('click', () => this.#addItem());
    this.#syncAddLabel();
  }

  connectedCallback() {
    this.#syncState();
  }

  attributeChangedCallback(name) {
    if (name === 'add-label') {
      this.#syncAddLabel();
    } else if (name === 'remove-label') {
      this.#refreshItemLabels();
    }
  }

  #syncState() {
    this.#add.disabled = !this.#template();
    this.#refreshItemLabels();
  }

  #syncAddLabel() {
    this.#addLabel.textContent =
      this.getAttribute('add-label') || DEFAULT_ADD_LABEL;
  }

  #refreshItemLabels() {
    for (const item of this.#items()) {
      // A parser-created row may still be an unupgraded element when the
      // list's attributes are applied; its connectedCallback reads the label.
      item.refreshRemoveLabel?.();
    }
  }

  #items() {
    return [...this.children].filter(
      (child) => child.localName === 'yk-field-list-item',
    );
  }

  #template() {
    return (
      [...this.children].find((child) => child.localName === 'template') ?? null
    );
  }

  #addItem() {
    const template = this.#template();
    if (!template) return;

    const item = document.createElement('yk-field-list-item');
    item.append(template.content.cloneNode(true));
    this.append(item);
    this.#focusFirstField(item);
    this.dispatchEvent(
      new CustomEvent('yk-field-list-add', {
        bubbles: true,
        composed: true,
        detail: { item },
      }),
    );
  }

  // A visible named control is the row's entry point; hidden inputs,
  // disabled controls, and CSS-hidden fields cannot take focus, so skip them.
  #focusFirstField(item) {
    const field = [...item.querySelectorAll('[name]')].find((element) => {
      if (element instanceof HTMLInputElement && element.type === 'hidden') {
        return false;
      }
      if (element.hidden || element.disabled) return false;
      return element.checkVisibility?.() ?? true;
    });
    field?.focus();
  }
}

if (!customElements.get('yk-field-list')) {
  customElements.define('yk-field-list', YKFieldList);
}
