/**
 * Searchable single-choice selector that renders an editable combobox kept in
 * Shadow DOM: a text input (`part="input"`, `role="combobox"`) over a listbox
 * popup (`part="popup"`, `role="listbox"`) that opens below the field and flips
 * above it when there is no room.
 *
 * Options come from the light DOM, like `yk-select`: the direct `<option>`
 * children are data, so they are hidden and mirrored into the popup as rows.
 * Each row shows the option label, plus the `data-description` attribute as a
 * second line when present. The popup filters rows by the text typed into the
 * input (case-insensitive substring of the label or the description) while the
 * input keeps focus and the active row is tracked with
 * `aria-activedescendant`. A selected option is committed on Enter or a click
 * and closes the popup; Escape or an outside interaction closes it without
 * changing the selection and restores the label.
 *
 * The host carries the same form behavior as the other fields: it is
 * form-associated, contributes `name=value`, mirrors `required` validation
 * through ElementInternals, supports disabled form/fieldset ancestors, and is
 * labelable. Like a native select there is no value content attribute; the
 * `value` property reads and selects the current option and returns the empty
 * string while nothing is selected. The `selected` attribute on an option marks
 * the default that the initial state and form reset restore; changing it after
 * the element is live does not move the current selection, so a default can be
 * updated for a later reset without overriding what the user has chosen.
 *
 * ```html
 * <script type="module" src="./index.js"></script>
 * <label for="part">Part of speech</label>
 * <yk-combobox id="part" name="part" required placeholder="Search…">
 *   <option value="noun" data-description="A naming word">noun</option>
 *   <option value="verb" data-description="An action word">verb</option>
 * </yk-combobox>
 * ```
 */
import { YKFieldElement } from './field-base.js';
import sheet from './yk-combobox.css' with { type: 'css' };

const POPUP_GAP = 4;
const EMPTY_TEXT = 'No options';

let instanceCount = 0;

// Reads the live selection straight from the rows, which are the state (the
// yk-input-checkbox precedent). A module-level function, not a method, because
// the base constructor calls the form hooks before the subclass's private
// members are branded; a private method call there would throw.
function selectionValues(host) {
  const listbox = host.shadowRoot.querySelector('[part="listbox"]');
  if (!listbox) return [];
  return [...listbox.children]
    .filter((row) => row.getAttribute('aria-selected') === 'true')
    .map((row) => row.dataset.value ?? '');
}

class YKCombobox extends YKFieldElement {
  // A combobox has no placeholder, length, or pattern constraints; `required`,
  // `placeholder`, and `readonly` are the constraints and hints it shares with
  // the text fields. `value` is not mirrored: it is the selected option, not
  // the text the input happens to show.
  static inputAttributes = ['placeholder', 'required', 'readonly'];

  static coreStylesheet = sheet;

  #id;

  #open = false;

  // The text the user typed to filter with. Kept apart from the input value
  // because, while the popup is closed, the input shows the selected option's
  // label; filtered browsing must start from the full list, not from that
  // label. It is non-empty only between typing and the next close.
  #query = '';

  #observer;

  // A pre-upgrade `value` write (or one made before the options exist) is held
  // here and applied once the popup rows are built; see syncOptions().
  #pendingValue;

  // True until the defaults (the options marked `selected`) have been applied
  // to a non-empty option list. A parser connects the element before its
  // children are parsed, so the first sync may see no options; keeping the flag
  // set until one arrives is what makes the marked defaults win over the empty
  // first sync without resurrecting them after the user clears the selection.
  #defaultsPending = true;

  #onDocumentPointerDown = (event) => {
    if (!event.composedPath().includes(this)) this.#hide();
  };

  #onDocumentFocusIn = (event) => {
    if (!event.composedPath().includes(this)) this.#hide();
  };

  #onViewportChange = () => this.#position();

  constructor() {
    super();
    this.#id = `yk-combobox-${++instanceCount}`;
    const shadowRoot = this.shadowRoot;
    const field = document.createElement('span');
    const arrow = document.createElement('span');
    const popup = document.createElement('div');
    const listbox = document.createElement('ul');
    const empty = document.createElement('div');
    field.setAttribute('part', 'field');
    arrow.setAttribute('part', 'arrow');
    arrow.setAttribute('aria-hidden', 'true');
    popup.setAttribute('part', 'popup');
    popup.setAttribute('popover', 'manual');
    listbox.setAttribute('part', 'listbox');
    listbox.setAttribute('role', 'listbox');
    listbox.id = `${this.#id}-listbox`;
    empty.setAttribute('part', 'empty');
    const emptySlot = document.createElement('slot');
    emptySlot.name = 'empty';
    emptySlot.textContent = EMPTY_TEXT;
    empty.append(emptySlot);
    field.append(shadowRoot.querySelector('input'), arrow);
    popup.append(listbox, empty);
    shadowRoot.append(field, popup);
    popup.addEventListener('mousedown', (event) => {
      if (event.target.closest('[part="option"]')) event.preventDefault();
    });
    popup.addEventListener('click', (event) => this.#onOptionClick(event));
    this.addEventListener('input', (event) => this.#onInput(event));
    this.addEventListener('keydown', (event) => this.#onKeydown(event));
    this.addEventListener('click', (event) => this.#onClick(event));
    this.addEventListener('focusin', (event) => this.#onFocusIn(event));
    // Pre-upgrade writes to `value` are not in the base capture list (a native
    // select has no value attribute), so they are routed through the accessor
    // here instead.
    if (Object.hasOwn(this, 'value')) {
      const value = this.value;
      delete this.value;
      this.value = value;
    }
    this.#syncAria();
    this.refreshFormState();
  }

  connectedCallback() {
    // Re-observing after a move would stack a second observer on the same
    // element, so drop any previous one first.
    this.#observer?.disconnect();
    this.#observer = new MutationObserver(() => this.#syncOptions());
    this.#observer.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      // `hidden` is set by syncOptions() on the light options, so it is
      // excluded to keep the rebuild from retriggering itself.
      attributeFilter: [
        'disabled',
        'label',
        'selected',
        'value',
        'data-description',
      ],
    });
    this.#syncAria();
    this.#syncOptions();
  }

  disconnectedCallback() {
    this.#observer?.disconnect();
    this.#hide();
  }

  createControl() {
    const input = document.createElement('input');
    input.type = 'text';
    input.setAttribute('part', 'input');
    return input;
  }

  formResetCallback() {
    // The base swaps in a fresh, empty control; re-wire its ARIA and rebuild
    // the rows so the reset lands on the options marked `selected`.
    super.formResetCallback();
    this.#syncAria();
    this.#defaultsPending = true;
    this.#pendingValue = undefined;
    this.#syncOptions();
  }

  get value() {
    return selectionValues(this)[0] ?? '';
  }

  set value(value) {
    const wanted = (value == null ? [] : Array.isArray(value) ? value : [value])
      .map(String)
      .slice(0, 1);
    if (this.#rows().length === 0 && wanted.length > 0) {
      this.#pendingValue = wanted;
      return;
    }
    this.#setSelection(wanted);
  }

  formValue() {
    return this.value;
  }

  formValidity() {
    const input = this.shadowRoot.querySelector('[part="input"]');
    const selected = selectionValues(this);
    const missing =
      this.required && (selected.length === 0 || selected[0] === '');
    if (!missing) return { validity: {}, message: '' };
    return {
      validity: { valueMissing: true },
      message: input?.validationMessage || 'Please select an item in the list.',
    };
  }

  #input() {
    return this.shadowRoot.querySelector('[part="input"]');
  }

  #field() {
    return this.shadowRoot.querySelector('[part="field"]');
  }

  #popup() {
    return this.shadowRoot.querySelector('[part="popup"]');
  }

  #listbox() {
    return this.shadowRoot.querySelector('[part="listbox"]');
  }

  #empty() {
    return this.shadowRoot.querySelector('[part="empty"]');
  }

  #rows() {
    const listbox = this.#listbox();
    return listbox ? [...listbox.children] : [];
  }

  #visibleRows() {
    return this.#rows().filter(
      (row) => !row.hidden && row.getAttribute('aria-disabled') !== 'true',
    );
  }

  #activeRow() {
    const listbox = this.#listbox();
    return listbox?.querySelector('[part="option"][data-active]') ?? null;
  }

  #syncAria() {
    const input = this.#input();
    input.setAttribute('role', 'combobox');
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-haspopup', 'listbox');
    input.setAttribute('aria-controls', `${this.#id}-listbox`);
    input.setAttribute('aria-expanded', String(this.#open));
  }

  #optionData() {
    return [...this.querySelectorAll(':scope > option')].map((option) => ({
      value: option.value,
      label: option.label.trim(),
      description: (option.dataset.description ?? '').trim(),
      disabled: option.disabled,
      selected: option.hasAttribute('selected'),
    }));
  }

  // Rebuilds the popup rows from the light options so the two cannot drift.
  // The live selection is restored for values that still exist; the options
  // marked `selected` supply the initial and reset default.
  #syncOptions() {
    const previous = selectionValues(this);
    const options = this.#optionData();
    let values;
    if (this.#pendingValue !== undefined) {
      values = this.#pendingValue;
    } else if (this.#defaultsPending) {
      values = options.filter((option) => option.selected).map((o) => o.value);
    } else {
      values = previous;
    }
    this.#pendingValue = undefined;
    if (options.length > 0) {
      this.#defaultsPending = false;
    }
    this.#rebuildRows(options);
    this.#setSelection(values);
    for (const option of this.querySelectorAll(':scope > option')) {
      option.hidden = true;
    }
    this.#applyFilter();
    if (options.length === 0 && this.#open) this.#hide();
  }

  #rebuildRows(options) {
    const rows = options.map((data, index) => {
      const row = document.createElement('li');
      row.setAttribute('part', 'option');
      row.setAttribute('role', 'option');
      row.id = `${this.#id}-option-${index}`;
      row.setAttribute('aria-selected', 'false');
      row.dataset.value = data.value;
      row.dataset.label = data.label;
      if (data.description) row.dataset.description = data.description;
      if (data.disabled) row.setAttribute('aria-disabled', 'true');
      const label = document.createElement('span');
      label.setAttribute('part', 'option-label');
      label.textContent = data.label;
      row.append(label);
      if (data.description) {
        const description = document.createElement('span');
        description.setAttribute('part', 'option-description');
        description.textContent = data.description;
        row.append(description);
      }
      return row;
    });
    this.#listbox().replaceChildren(...rows);
  }

  // Marks the rows whose values are in `values` as selected (the first match
  // only, since this component selects one option at a time) and refreshes the
  // field and the form state to match.
  #setSelection(values) {
    const wanted = new Set(values);
    let assigned = false;
    for (const row of this.#rows()) {
      const selected = wanted.has(row.dataset.value ?? '') && !assigned;
      row.setAttribute('aria-selected', String(selected));
      if (selected) assigned = true;
    }
    this.#renderField();
    this.refreshFormState();
  }

  // Shows the selected option's label in the input while the popup is closed;
  // an in-progress query is left alone while it is open. The label is selected
  // while the field keeps focus so the next keystroke starts a fresh search
  // instead of appending to the label.
  #renderField() {
    if (this.#open) return;
    const input = this.#input();
    const selected = this.#rows().find(
      (row) => row.getAttribute('aria-selected') === 'true',
    );
    input.value = selected?.dataset.label ?? '';
    if (input.value !== '' && this.shadowRoot.activeElement === input) {
      input.select();
    }
  }

  #applyFilter() {
    const query = this.#query.trim().toLowerCase();
    for (const row of this.#rows()) {
      row.hidden = query !== '' && !this.#matches(row, query);
    }
    const visible = this.#visibleRows();
    this.#empty().hidden = visible.length > 0;
    if (this.#open) {
      const active = this.#activeRow();
      if (!active || active.hidden) this.#activate();
      else this.#setActive(active);
    }
  }

  #matches(row, query) {
    const label = (row.dataset.label ?? '').toLowerCase();
    const description = (row.dataset.description ?? '').toLowerCase();
    return label.includes(query) || description.includes(query);
  }

  #show({ fromEnd = false } = {}) {
    if (this.#open) return;
    const input = this.#input();
    if (input.disabled) return;
    this.#open = true;
    this.#popup().showPopover();
    this.#applyFilter();
    this.#activate(fromEnd);
    this.#position();
    input.setAttribute('aria-expanded', 'true');
    document.addEventListener('pointerdown', this.#onDocumentPointerDown, true);
    document.addEventListener('focusin', this.#onDocumentFocusIn, true);
    window.addEventListener('scroll', this.#onViewportChange, true);
    window.addEventListener('resize', this.#onViewportChange);
  }

  #hide() {
    if (!this.#open) return;
    this.#open = false;
    this.#popup().hidePopover();
    const input = this.#input();
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    document.removeEventListener(
      'pointerdown',
      this.#onDocumentPointerDown,
      true,
    );
    document.removeEventListener('focusin', this.#onDocumentFocusIn, true);
    window.removeEventListener('scroll', this.#onViewportChange, true);
    window.removeEventListener('resize', this.#onViewportChange);
    this.#query = '';
    this.#renderField();
  }

  // Places the popup under the field, flipping it above when the space below
  // is tighter than the space above, and matching the field width.
  #position() {
    const rect = this.#field().getBoundingClientRect();
    const popup = this.#popup();
    popup.style.left = `${rect.left}px`;
    popup.style.width = `${rect.width}px`;
    const below = window.innerHeight - rect.bottom;
    if (below < popup.offsetHeight + POPUP_GAP && rect.top > below) {
      popup.style.top = 'auto';
      popup.style.bottom = `${window.innerHeight - rect.top + POPUP_GAP}px`;
    } else {
      popup.style.bottom = 'auto';
      popup.style.top = `${rect.bottom + POPUP_GAP}px`;
    }
  }

  // Highlights the selected row when one is visible, otherwise the first row;
  // `fromEnd` starts at the last row instead, for ArrowUp on a closed popup.
  #activate(fromEnd = false) {
    const rows = this.#visibleRows();
    if (rows.length === 0) {
      this.#setActive(null);
      return;
    }
    const selected = rows.find(
      (row) => row.getAttribute('aria-selected') === 'true',
    );
    this.#setActive(fromEnd ? rows[rows.length - 1] : (selected ?? rows[0]));
  }

  #setActive(row) {
    for (const candidate of this.#rows()) {
      candidate.removeAttribute('data-active');
    }
    const input = this.#input();
    if (row) {
      row.setAttribute('data-active', '');
      input.setAttribute('aria-activedescendant', row.id);
      row.scrollIntoView({ block: 'nearest' });
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  }

  #moveActive(delta) {
    const rows = this.#visibleRows();
    if (rows.length === 0) return;
    const active = this.#activeRow();
    const index = active ? rows.indexOf(active) : -1;
    const next = Math.min(Math.max(index + delta, 0), rows.length - 1);
    this.#setActive(rows[next]);
  }

  #chooseRow(row) {
    const value = row.dataset.value ?? '';
    const changed = selectionValues(this)[0] !== value;
    this.#setSelection([value]);
    // A native select fires change only when the value actually changes, so
    // re-committing the current option is silent.
    if (changed) this.#emitChange();
    this.#hide();
  }

  #emitChange() {
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }

  #onOptionClick(event) {
    const row = event.target.closest?.('[part="option"]');
    if (!row || row.hidden) return;
    if (row.getAttribute('aria-disabled') === 'true') return;
    event.stopPropagation();
    this.#chooseRow(row);
  }

  // Selecting the label on focus lets a keyboard user type straight into a
  // new search, matching the click path in onKeydown's sibling handler.
  #onFocusIn(event) {
    if (event.composedPath()[0] !== this.#input()) return;
    if (selectionValues(this).length > 0) this.#input().select();
  }

  #onInput(event) {
    // The component dispatches input/change itself on commit; only events that
    // reach the host from the internal input (composedPath()[0] is the input)
    // are typing, so a commit does not reopen a popup it just closed.
    if (event.composedPath()[0] !== this.#input()) return;
    this.#query = this.#input().value;
    if (!this.#open) this.#show();
    else this.#applyFilter();
  }

  #onClick(event) {
    const path = event.composedPath();
    const input = this.#input();
    if (input.disabled) return;
    if (path[0] === input) {
      if (!this.#open) this.#show();
      if (selectionValues(this).length > 0) input.select();
      return;
    }
    if (path.includes(this.#field()) && !path.includes(this.#popup())) {
      input.focus();
      this.#show();
    }
  }

  #onKeydown(event) {
    if (event.composedPath()[0] !== this.#input()) return;
    const { key } = event;
    if (key === 'ArrowDown') {
      event.preventDefault();
      if (this.#open) this.#moveActive(1);
      else this.#show();
    } else if (key === 'ArrowUp') {
      event.preventDefault();
      if (this.#open) this.#moveActive(-1);
      else this.#show({ fromEnd: true });
    } else if (key === 'Home' || key === 'End') {
      if (!this.#open) return;
      event.preventDefault();
      const rows = this.#visibleRows();
      if (rows.length > 0) {
        this.#setActive(key === 'Home' ? rows[0] : rows[rows.length - 1]);
      }
    } else if (key === 'Enter') {
      if (!this.#open) return;
      event.preventDefault();
      const active = this.#activeRow();
      if (active) this.#chooseRow(active);
    } else if (key === 'Escape') {
      if (!this.#open) return;
      event.preventDefault();
      event.stopPropagation();
      this.#hide();
    } else if (key === 'Tab') {
      if (this.#open) this.#hide();
    }
  }
}

if (!customElements.get('yk-combobox')) {
  customElements.define('yk-combobox', YKCombobox);
}
