/**
 * Single-choice selector that renders a native `<select>` kept in Shadow DOM
 * with the shared Bootstrap form-control face and an arrow indicator.
 *
 * Options come from the light DOM so the markup stays declarative: the direct
 * `<option>` children are mirrored into the internal select on connect and
 * rebuilt whenever they change, and the light options are hidden because they
 * are data rather than rendered content. A rebuild keeps the current selection
 * while an option with that value remains, and a `selected` attribute change is
 * the one edit that moves it; `<optgroup>` is not mirrored.
 *
 * The host carries the same form behavior as the other fields: it is
 * form-associated, mirrors `required` validation through ElementInternals,
 * supports disabled form/fieldset ancestors, is labelable, and reset restores
 * the option marked `selected`. Like a native select there is no value content
 * attribute; the `value` property reads and selects the current option.
 *
 * ```html
 * <script type="module" src="./index.js"></script>
 * <label for="part">Part of speech</label>
 * <yk-select id="part" name="part" required>
 *   <option value="" selected disabled>Choose…</option>
 *   <option value="noun">noun</option>
 *   <option value="verb">verb</option>
 * </yk-select>
 * ```
 */
import { YKFieldElement } from './field-base.js';
import sheet from './yk-select.css' with { type: 'css' };

class YKSelect extends YKFieldElement {
  // A select has no placeholder, length, or pattern constraints; `required`
  // is the only constraint it shares with the text fields.
  static inputAttributes = ['required'];

  #observer;

  #pendingValue;

  constructor() {
    super();
    this.shadowRoot.adoptedStyleSheets.push(sheet);
    const arrow = document.createElement('span');
    arrow.setAttribute('part', 'arrow');
    arrow.setAttribute('aria-hidden', 'true');
    this.shadowRoot.append(arrow);
    // The base does not mirror a `value` attribute (a native select has none),
    // so a pre-upgrade `value` write is held here and applied once the options
    // exist; see syncOptions().
    if (Object.hasOwn(this, 'value')) {
      this.#pendingValue = this.value;
      delete this.value;
    }
  }

  connectedCallback() {
    // Re-observing after a move would stack a second observer on the same
    // element, so drop any previous one first.
    this.#observer?.disconnect();
    this.#observer = new MutationObserver((records) =>
      this.#onOptionsChanged(records),
    );
    this.#observer.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      // The hidden flag is set by syncOptions() on the light options, so it is
      // excluded to keep the rebuild from retriggering itself.
      attributeFilter: ['disabled', 'label', 'selected', 'value'],
    });
    this.#syncOptions();
  }

  disconnectedCallback() {
    this.#observer?.disconnect();
  }

  createControl() {
    const select = document.createElement('select');
    select.setAttribute('part', 'select');
    return select;
  }

  formResetCallback() {
    // The base swaps in a fresh, empty control; refill it from the light DOM
    // so the reset lands on the option marked `selected`.
    super.formResetCallback();
    this.#syncOptions();
  }

  // Attribute changes land on the host itself too (the base writes `disabled`),
  // and those are not option-list changes: rebuilding for them would drop the
  // live selection. A `selected` change is the one attribute edit that is meant
  // to move the selection, so it is the only rebuild that does not preserve it.
  #onOptionsChanged(records) {
    if (
      records.every(
        (record) => record.target === this && record.type !== 'childList',
      )
    ) {
      return;
    }
    const selectedChanged = records.some(
      (record) =>
        record.target !== this &&
        record.type === 'attributes' &&
        record.attributeName === 'selected',
    );
    this.#syncOptions(!selectedChanged);
  }

  // Rebuilds the internal options from the light DOM so the two cannot drift.
  // The current selection is restored when an option with that value still
  // exists; otherwise the native default (the option marked `selected`, or the
  // first one) stands, matching a native select whose options were replaced.
  #syncOptions(preserveSelection = true) {
    const select = this.shadowRoot.querySelector('select');
    const previous =
      preserveSelection && select.options.length > 0 ? select.value : null;
    const options = [...this.querySelectorAll(':scope > option')];
    select.replaceChildren(
      ...options.map((option) => {
        const mirror = document.createElement('option');
        mirror.value = option.value;
        mirror.textContent = option.textContent;
        mirror.defaultSelected = option.hasAttribute('selected');
        mirror.disabled = option.disabled;
        if (option.hasAttribute('label')) {
          mirror.label = option.label;
        }
        return mirror;
      }),
    );
    const restore = this.#pendingValue ?? previous;
    if (
      restore !== null &&
      restore !== undefined &&
      [...select.options].some((option) => option.value === restore)
    ) {
      select.value = restore;
    }
    this.#pendingValue = undefined;
    for (const option of options) {
      option.hidden = true;
    }
    this.refreshFormState();
  }
}

if (!customElements.get('yk-select')) {
  customElements.define('yk-select', YKSelect);
}
