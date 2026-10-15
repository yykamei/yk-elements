/**
 * Base class for single-line input fields (`yk-input-text`, `yk-input-email`,
 * `yk-input-tel`, ...). It renders a native `<input>` of `inputType` kept in
 * Shadow DOM with the shared Bootstrap form-control face from `input-core.css`;
 * the form participation, reset, and validation behavior comes from
 * `YKFieldElement`.
 *
 * Subclasses are self-registering modules that normally only pick the input
 * type and list any type-specific stored attributes; accessors for extra
 * attributes live in the subclass.
 *
 * ```js
 * // src/components/yk-input-password.js
 * import { YKInputElement } from './input-base.js';
 *
 * class YKInputPassword extends YKInputElement {
 *   static inputType = 'password';
 * }
 *
 * if (!customElements.get('yk-input-password')) {
 *   customElements.define('yk-input-password', YKInputPassword);
 * }
 * ```
 */
import { YKFieldElement } from './field-base.js';

export class YKInputElement extends YKFieldElement {
  static inputType = 'text';

  createControl() {
    const input = document.createElement('input');
    input.type = this.constructor.inputType;
    input.setAttribute('part', 'input');
    return input;
  }
}
