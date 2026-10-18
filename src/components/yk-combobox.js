/**
 * Searchable selector that renders an editable combobox kept in Shadow DOM: a
 * text input (`part="input"`, `role="combobox"`) over a listbox
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
 * With the `multiple` attribute the host selects several options: choosing one
 * toggles it and keeps the popup open, each choice shows as a chip with a
 * remove button, `value` is an array normalized to option order, and the form
 * receives one `name=value` entry per selected option. Chips wrap inside the
 * field and scroll, showing an overflow shadow, once they pass a few rows.
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

  // `name` is observed so the multi-value form payload is rebuilt when it
  // changes after a selection, and `multiple` so the selection model and the
  // chips follow it. Neither is mirrored onto the internal input.
  static get observedAttributes() {
    // biome-ignore lint/complexity/noThisInStatic: super must dispatch through the base getter so this class's `inputAttributes` override is honored
    return [...super.observedAttributes, 'name', 'multiple'];
  }

  #id;

  #open = false;

  // The text the user typed to filter with. Kept apart from the input value
  // because, while the popup is closed, the input shows the selected option's
  // label; filtered browsing must start from the full list, not from that
  // label. It is non-empty only between typing and the next close.
  #query = '';

  #observer;

  #overflowObserver;

  #overflowFrame;

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
    const chips = document.createElement('ul');
    const arrow = document.createElement('span');
    const removeLabel = document.createElement('slot');
    const popup = document.createElement('div');
    const listbox = document.createElement('ul');
    const empty = document.createElement('div');
    field.setAttribute('part', 'field');
    chips.setAttribute('part', 'chips');
    arrow.setAttribute('part', 'arrow');
    arrow.setAttribute('aria-hidden', 'true');
    // Hidden data source for the chip remove labels, localized the same way as
    // the file field's remove-label slot.
    removeLabel.name = 'remove-label';
    removeLabel.hidden = true;
    removeLabel.textContent = 'Remove';
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
    // The input comes first in DOM order so `delegatesFocus` (and thus
    // clicking a `<label for>`) lands on it, not on a chip remove button; the
    // chips are placed before it visually with flex `order`.
    field.append(shadowRoot.querySelector('input'), chips, arrow);
    popup.append(listbox, empty);
    shadowRoot.append(field, popup, removeLabel);
    popup.addEventListener('mousedown', (event) => {
      if (event.target.closest('[part="option"]')) event.preventDefault();
    });
    popup.addEventListener('click', (event) => this.#onOptionClick(event));
    chips.addEventListener('click', (event) => this.#onChipClick(event));
    removeLabel.addEventListener('slotchange', () => this.#renderChips());
    this.addEventListener('input', (event) => this.#onInput(event));
    this.addEventListener('keydown', (event) => this.#onKeydown(event));
    this.addEventListener('click', (event) => this.#onClick(event));
    this.addEventListener('focusin', (event) => this.#onFocusIn(event));
    // Pre-upgrade writes to `value` and `multiple` are not in the base capture
    // list (a native select has neither as a mirrored property), so they are
    // routed through the accessors here instead.
    for (const name of ['value', 'multiple']) {
      if (Object.hasOwn(this, name)) {
        const value = this[name];
        delete this[name];
        this[name] = value;
      }
    }
    this.#syncAria();
    this.#syncMultiple();
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
    this.#overflowObserver?.disconnect();
    this.#overflowObserver = new ResizeObserver(() => this.#syncOverflow());
    this.#overflowObserver.observe(this.#chips());
    this.#syncAria();
    this.#syncOptions();
  }

  disconnectedCallback() {
    this.#observer?.disconnect();
    this.#overflowObserver?.disconnect();
    if (this.#overflowFrame) cancelAnimationFrame(this.#overflowFrame);
    this.#overflowFrame = 0;
    this.#hide();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'name' || name === 'multiple') {
      // Host-only attributes: mirroring them onto the internal text input is
      // meaningless, so they never reach it. `#syncMultiple` refreshes the
      // form state itself.
      if (name === 'multiple') this.#syncMultiple();
      else this.refreshFormState();
      return;
    }
    super.attributeChangedCallback(name, oldValue, newValue);
    // The base mirrors `required` onto the input; multiple mode must undo it.
    if (name === 'required') this.#syncRequired();
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
    // The base's fresh input re-mirrors `required`, which multiple mode undoes.
    this.#syncRequired();
    this.#defaultsPending = true;
    this.#pendingValue = undefined;
    this.#syncOptions();
  }

  get value() {
    const selected = selectionValues(this);
    return this.multiple ? selected : (selected[0] ?? '');
  }

  set value(value) {
    const wanted = (
      value == null ? [] : Array.isArray(value) ? value : [value]
    ).map(String);
    if (this.#rows().length === 0 && wanted.length > 0) {
      this.#pendingValue = wanted;
      return;
    }
    this.#setSelection(this.multiple ? wanted : wanted.slice(0, 1));
  }

  get multiple() {
    return this.hasAttribute('multiple');
  }

  set multiple(value) {
    this.toggleAttribute('multiple', Boolean(value));
  }

  formValue() {
    if (!this.multiple) return this.value;
    const values = selectionValues(this);
    // Nothing selected contributes no entry, like a native select multiple;
    // values are normalized to option order by the rows themselves.
    if (this.name === '' || values.length === 0) return null;
    const data = new FormData();
    for (const value of values) data.append(this.name, value);
    return data;
  }

  formValidity() {
    const input = this.shadowRoot.querySelector('[part="input"]');
    const selected = selectionValues(this);
    const missing = this.multiple
      ? selected.length === 0
      : selected.length === 0 || selected[0] === '';
    if (!missing || !this.required) return { validity: {}, message: '' };
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

  #chips() {
    return this.shadowRoot.querySelector('[part="chips"]');
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

  // Marks the rows whose values are in `values` as selected and refreshes the
  // chips, the field, and the form state to match. A value that matches several
  // rows marks only the first, and single-select mode keeps only the first
  // value, so the selection never outruns what the field can show.
  #setSelection(values) {
    const wanted = new Set(values);
    const seen = new Set();
    for (const row of this.#rows()) {
      const value = row.dataset.value ?? '';
      const selected =
        wanted.has(value) &&
        !seen.has(value) &&
        (this.multiple || seen.size === 0);
      row.setAttribute('aria-selected', String(selected));
      if (selected) seen.add(value);
    }
    this.#renderChips();
    this.#renderField();
    this.refreshFormState();
  }

  // Shows the selected option's label in the input while the popup is closed;
  // an in-progress query is left alone while it is open. The label is selected
  // while the field keeps focus so the next keystroke starts a fresh search
  // instead of appending to the label. In multiple mode the input only ever
  // holds a query, so it is cleared once the popup is closed.
  #renderField() {
    if (this.#open) return;
    const input = this.#input();
    if (this.multiple) {
      input.value = '';
      return;
    }
    const selected = this.#rows().find(
      (row) => row.getAttribute('aria-selected') === 'true',
    );
    input.value = selected?.dataset.label ?? '';
    if (input.value !== '' && this.shadowRoot.activeElement === input) {
      input.select();
    }
  }

  #renderChips() {
    const chips = this.#chips();
    if (!this.multiple) {
      chips.replaceChildren();
      this.#scheduleOverflowSync();
      return;
    }
    const selected = this.#rows().filter(
      (row) => row.getAttribute('aria-selected') === 'true',
    );
    const verb = this.#removeLabel();
    chips.replaceChildren(
      ...selected.map((row) => {
        const chip = document.createElement('li');
        const label = document.createElement('span');
        const remove = document.createElement('button');
        chip.setAttribute('part', 'chip');
        chip.dataset.value = row.dataset.value ?? '';
        label.setAttribute('part', 'chip-label');
        label.textContent = row.dataset.label ?? '';
        remove.setAttribute('part', 'chip-remove');
        remove.type = 'button';
        remove.setAttribute('aria-label', `${verb} ${row.dataset.label ?? ''}`);
        remove.append(this.#removeIcon());
        chip.append(label, remove);
        return chip;
      }),
    );
    this.#scheduleOverflowSync();
  }

  // The remove verb localizes through the remove-label slot; assigned light
  // DOM text wins over the fallback text, matching the file field.
  #removeLabel() {
    const slot = this.shadowRoot.querySelector('slot[name="remove-label"]');
    const assigned = slot
      .assignedNodes()
      .find((node) => (node.textContent ?? '').trim() !== '');
    return (assigned?.textContent ?? slot.textContent).trim();
  }

  #removeIcon() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 16 16');
    svg.setAttribute('width', '12');
    svg.setAttribute('height', '12');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M4 4l8 8M12 4l-8 8');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '1.5');
    path.setAttribute('stroke-linecap', 'round');
    svg.append(path);
    return svg;
  }

  // Recomputes the overflow affordance in the next frame rather than inline,
  // because reading scrollHeight forces a layout; deferring keeps the style
  // and layout work off the current task (the repository avoids forced
  // synchronous layout). The ResizeObserver covers pure size changes.
  #scheduleOverflowSync() {
    if (this.#overflowFrame) return;
    this.#overflowFrame = requestAnimationFrame(() => {
      this.#overflowFrame = 0;
      this.#syncOverflow();
    });
  }

  // Marks an overflow shadow affordance on the chip list once its content is
  // taller than the box, so a scrolled-away selection stays discoverable.
  #syncOverflow() {
    const chips = this.#chips();
    chips.toggleAttribute(
      'data-overflow',
      chips.scrollHeight > chips.clientHeight,
    );
  }

  #syncMultiple() {
    const listbox = this.#listbox();
    if (listbox) {
      listbox.setAttribute('aria-multiselectable', String(this.multiple));
    }
    this.#syncRequired();
    const selected = selectionValues(this);
    this.#setSelection(this.multiple ? selected : selected.slice(0, 1));
  }

  // In multiple mode the input holds only a search query, so it must not carry
  // the required constraint: an always-empty required input would report
  // valueMissing and paint the invalid face even while a chip is selected. The
  // host's formValidity() owns the constraint there, while single-select keeps
  // the native required on the input so its message stays localized.
  #syncRequired() {
    this.#input().required = !this.multiple && this.hasAttribute('required');
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
    if (this.multiple) {
      this.#toggleValue(value);
      return;
    }
    const changed = selectionValues(this)[0] !== value;
    this.#setSelection([value]);
    // A native select fires change only when the value actually changes, so
    // re-committing the current option is silent.
    if (changed) this.#emitChange();
    this.#hide();
  }

  #toggleValue(value) {
    const selected = selectionValues(this);
    const next = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value];
    this.#setSelection(next);
    this.#emitChange();
  }

  #onChipClick(event) {
    const remove = event.target.closest?.('[part="chip-remove"]');
    if (!remove) return;
    // Keep the click from reaching the field handler, which would reopen the
    // popup instead of just removing the chip.
    event.stopPropagation();
    const chip = remove.closest('[part="chip"]');
    this.#toggleValue(chip.dataset.value ?? '');
    this.#input().focus();
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
  // new search, matching the click path in onKeydown's sibling handler. In
  // multiple mode the input holds only a query, so there is nothing to select.
  #onFocusIn(event) {
    if (event.composedPath()[0] !== this.#input()) return;
    if (!this.multiple && selectionValues(this).length > 0) {
      this.#input().select();
    }
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
      if (!this.multiple && selectionValues(this).length > 0) input.select();
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
    } else if (
      key === 'Backspace' &&
      this.multiple &&
      this.#input().value === ''
    ) {
      const values = selectionValues(this);
      if (values.length > 0) {
        event.preventDefault();
        this.#toggleValue(values[values.length - 1]);
      }
    }
  }
}

if (!customElements.get('yk-combobox')) {
  customElements.define('yk-combobox', YKCombobox);
}
