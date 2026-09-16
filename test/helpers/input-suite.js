// @ts-check
import { expect, test } from 'vitest';

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

/**
 * Runs the behavior contract shared by every input component. Per-type test
 * files call this with their tag and type-specific sample values and only add
 * tests for behavior that differs between input types.
 *
 * ```js
 * runInputBehaviorSuite('yk-input-tel', {
 *   inputType: 'tel',
 *   shortPrefill: 'ab',
 *   shortMinlength: '3',
 *   fillValue: '090-1234-5678',
 *   pattern: '[0-9\\-]+',
 *   invalidPatternValue: 'abc!',
 *   sharedFaceWith: [
 *     'yk-input-text',
 *     new URL('../src/components/yk-input-text.js', import.meta.url).href,
 *   ],
 * });
 * ```
 *
 * @param {string} tag
 * @param {{
 *   inputType: string,
 *   fillValue: string,
 *   shortPrefill: string,
 *   shortMinlength: string,
 *   pattern: string,
 *   invalidPatternValue: string,
 *   sharedFaceWith?: [tag: string, moduleUrl: string],
 * }} options
 *
 * `sharedFaceWith.moduleUrl` must be resolved against the caller (e.g.
 * `new URL('../src/components/yk-input-text.js', import.meta.url).href`),
 * because the suite imports it from its own location.
 */
export function runInputBehaviorSuite(
  tag,
  {
    inputType,
    fillValue,
    shortPrefill,
    shortMinlength,
    pattern,
    invalidPatternValue,
    sharedFaceWith,
  },
) {
  const hostOf = () => document.createElement(tag);
  const inputOf = (host) => host.shadowRoot.querySelector('input');

  test('adopts its stylesheet as a constructable CSSStyleSheet', async () => {
    const host = hostOf();
    document.body.appendChild(host);

    expect(host.shadowRoot.adoptedStyleSheets.length).toBe(1);
    expect(host.shadowRoot.adoptedStyleSheets[0]).toBeInstanceOf(CSSStyleSheet);
  });

  test(`renders an internal ${inputType} input marked as a part`, async () => {
    const host = hostOf();
    document.body.appendChild(host);
    await frame();

    const input = inputOf(host);
    expect(input).not.toBeNull();
    expect(input.type).toBe(inputType);
    expect(input.getAttribute('part')).toBe('input');
  });

  test('mirrors field attributes onto the internal input', () => {
    const host = hostOf();
    host.setAttribute('placeholder', 'Your name');
    host.setAttribute('maxlength', '10');
    host.setAttribute('minlength', '3');
    host.setAttribute('pattern', pattern);
    host.setAttribute('value', fillValue);
    host.setAttribute('readonly', '');
    host.setAttribute('required', '');
    document.body.appendChild(host);

    const input = inputOf(host);
    expect(input.getAttribute('placeholder')).toBe('Your name');
    expect(input.getAttribute('maxlength')).toBe('10');
    expect(input.getAttribute('minlength')).toBe('3');
    expect(input.getAttribute('pattern')).toBe(pattern);
    expect(input.getAttribute('value')).toBe(fillValue);
    expect(input.readOnly).toBe(true);
    expect(input.required).toBe(true);
  });

  test('keeps mirrored attributes in sync when they change later', () => {
    const host = hostOf();
    host.setAttribute('maxlength', '10');
    document.body.appendChild(host);

    const input = inputOf(host);
    host.setAttribute('maxlength', '5');
    host.setAttribute('placeholder', 'Updated');
    expect(input.getAttribute('maxlength')).toBe('5');
    expect(input.getAttribute('placeholder')).toBe('Updated');

    host.removeAttribute('maxlength');
    host.removeAttribute('placeholder');
    expect(input.hasAttribute('maxlength')).toBe(false);
    expect(input.hasAttribute('placeholder')).toBe(false);
  });

  test('exposes field properties backed by the internal input', () => {
    const host = hostOf();
    host.value = fillValue;
    host.name = 'field';
    host.placeholder = 'Type here';
    host.maxLength = 12;
    host.pattern = pattern;
    host.required = true;
    host.readOnly = true;
    document.body.appendChild(host);

    expect(host.value).toBe(fillValue);
    expect(host.name).toBe('field');
    expect(host.placeholder).toBe('Type here');
    expect(host.maxLength).toBe(12);
    expect(host.pattern).toBe(pattern);
    expect(host.required).toBe(true);
    expect(host.readOnly).toBe(true);
    expect(inputOf(host).readOnly).toBe(true);
  });

  test('uses the value attribute as the initial value', () => {
    const host = hostOf();
    host.setAttribute('value', fillValue);
    document.body.appendChild(host);

    expect(host.value).toBe(fillValue);
    expect(inputOf(host).value).toBe(fillValue);
  });

  test('contributes name=value to the owner form', () => {
    const form = document.createElement('form');
    const host = hostOf();
    host.setAttribute('name', 'field');
    host.value = fillValue;
    form.append(host);
    document.body.appendChild(form);

    expect(new FormData(form).get('field')).toBe(fillValue);
  });

  test('excludes a disabled field from the owner form', () => {
    const form = document.createElement('form');
    const host = hostOf();
    host.setAttribute('name', 'field');
    host.value = fillValue;
    host.disabled = true;
    form.append(host);
    document.body.appendChild(form);

    expect(new FormData(form).has('field')).toBe(false);
  });

  test('updates the form value as the user types', async () => {
    const form = document.createElement('form');
    const host = hostOf();
    host.setAttribute('name', 'field');
    form.append(host);
    document.body.appendChild(form);
    await frame();

    const input = inputOf(host);
    input.value = 'yk';
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));

    expect(new FormData(form).get('field')).toBe('yk');
  });

  test('keeps the typed value when the value attribute changes afterwards', () => {
    const host = hostOf();
    host.setAttribute('value', 'default');
    document.body.appendChild(host);

    host.value = 'typed';
    host.setAttribute('value', 'changed');

    expect(host.value).toBe('typed');
  });

  test('lets the value attribute set a new default after a form reset', () => {
    const form = document.createElement('form');
    const host = hostOf();
    host.setAttribute('name', 'field');
    host.setAttribute('value', 'default');
    form.append(host);
    document.body.appendChild(form);

    host.value = 'edited';
    form.reset();
    host.setAttribute('value', 'new-default');

    expect(host.value).toBe('new-default');
    expect(new FormData(form).get('field')).toBe('new-default');
  });

  test('keeps the fresh input wired and focused after a form reset', async () => {
    const form = document.createElement('form');
    const host = hostOf();
    host.setAttribute('name', 'field');
    host.setAttribute('value', 'default');
    form.append(host);
    document.body.appendChild(form);
    await frame();

    host.focus();
    form.reset();

    const input = inputOf(host);
    expect(input.getAttribute('part')).toBe('input');
    expect(host.shadowRoot.activeElement).toBe(input);

    input.value = 'typed';
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));

    expect(new FormData(form).get('field')).toBe('typed');
  });

  test('surfaces pattern violations and blocks form submission until fixed', () => {
    const form = document.createElement('form');
    const host = hostOf();
    host.setAttribute('name', 'field');
    host.setAttribute('pattern', pattern);
    host.value = invalidPatternValue;
    const submissions = [];
    form.addEventListener('submit', (event) => {
      submissions.push(event);
      event.preventDefault();
    });
    form.append(host);
    document.body.appendChild(form);

    expect(host.validity.patternMismatch).toBe(true);
    expect(host.checkValidity()).toBe(false);
    expect(host.validationMessage).not.toBe('');
    expect(host.matches(':invalid')).toBe(true);

    form.requestSubmit();
    expect(submissions.length).toBe(0);

    host.value = fillValue;
    expect(host.checkValidity()).toBe(true);
    form.requestSubmit();
    expect(submissions.length).toBe(1);
  });

  test('does not flag a prefilled too-short value as invalid', () => {
    const host = hostOf();
    host.setAttribute('minlength', shortMinlength);
    host.setAttribute('value', shortPrefill);
    document.body.appendChild(host);

    expect(host.validity.tooShort).toBe(false);
    expect(host.checkValidity()).toBe(true);
  });

  test('bars readonly fields from validation', () => {
    const host = hostOf();
    host.setAttribute('readonly', '');
    host.required = true;
    document.body.appendChild(host);

    expect(host.willValidate).toBe(false);
    expect(host.checkValidity()).toBe(true);
    expect(host.validity.valueMissing).toBe(false);
  });

  test('surfaces valueMissing and blocks form submission until filled', () => {
    const form = document.createElement('form');
    const host = hostOf();
    host.setAttribute('name', 'field');
    host.required = true;
    const submissions = [];
    form.addEventListener('submit', (event) => {
      submissions.push(event);
      event.preventDefault();
    });
    form.append(host);
    document.body.appendChild(form);

    expect(host.validity.valueMissing).toBe(true);
    expect(host.checkValidity()).toBe(false);
    expect(host.validationMessage).not.toBe('');
    expect(host.matches(':invalid')).toBe(true);

    form.requestSubmit();
    expect(submissions.length).toBe(0);

    host.value = fillValue;
    expect(host.checkValidity()).toBe(true);
    form.requestSubmit();
    expect(submissions.length).toBe(1);
  });

  test('focuses the internal input when reportValidity reports a violation', async () => {
    const host = hostOf();
    host.setAttribute('pattern', pattern);
    host.value = invalidPatternValue;
    document.body.appendChild(host);
    await frame();

    expect(host.reportValidity()).toBe(false);
    expect(document.activeElement).toBe(host);
    expect(host.shadowRoot.activeElement).toBe(inputOf(host));
  });

  test('restores the value attribute default when the owner form resets', () => {
    const form = document.createElement('form');
    const host = hostOf();
    host.setAttribute('name', 'field');
    host.setAttribute('value', 'default');
    form.append(host);
    document.body.appendChild(form);

    host.value = 'edited';
    form.reset();

    expect(host.value).toBe('default');
    expect(new FormData(form).get('field')).toBe('default');
  });

  test('mirrors the disabled attribute onto the internal input and bars validation', () => {
    const host = hostOf();
    host.disabled = true;
    document.body.appendChild(host);

    expect(inputOf(host).disabled).toBe(true);
    expect(host.willValidate).toBe(false);
  });

  test('disables the internal input while a form or fieldset ancestor is disabled', async () => {
    const form = document.createElement('form');
    const fieldset = document.createElement('fieldset');
    fieldset.disabled = true;
    const host = hostOf();
    fieldset.append(host);
    form.append(fieldset);
    document.body.appendChild(form);
    await frame();

    expect(inputOf(host).disabled).toBe(true);

    fieldset.disabled = false;
    expect(inputOf(host).disabled).toBe(false);
  });

  test('excludes the field from the form while a fieldset ancestor is disabled and restores it after', async () => {
    const form = document.createElement('form');
    const fieldset = document.createElement('fieldset');
    fieldset.disabled = true;
    const host = hostOf();
    host.setAttribute('name', 'field');
    host.value = fillValue;
    fieldset.append(host);
    form.append(fieldset);
    document.body.appendChild(form);
    await frame();

    expect(new FormData(form).has('field')).toBe(false);

    fieldset.disabled = false;
    expect(new FormData(form).get('field')).toBe(fillValue);
  });

  test('focuses the internal input when the host is focused', async () => {
    const host = hostOf();
    document.body.appendChild(host);
    await frame();

    host.focus();
    expect(host.shadowRoot.activeElement).toBe(inputOf(host));
  });

  test('is activated by a label pointing at the host', async () => {
    const label = document.createElement('label');
    label.htmlFor = 'catalog-labelable';
    const host = hostOf();
    host.id = 'catalog-labelable';
    document.body.append(label, host);
    await frame();

    expect([...host.labels]).toContain(label);

    label.click();
    expect(host.shadowRoot.activeElement).toBe(inputOf(host));
  });

  test('styles the face like the Bootstrap form control', async () => {
    const host = hostOf();
    document.body.appendChild(host);
    await frame();

    const hostStyle = getComputedStyle(host);
    const style = getComputedStyle(inputOf(host));
    expect(hostStyle.display).toBe('block');
    expect(style.display).toBe('block');
    expect(style.boxSizing).toBe('border-box');
    expect(style.backgroundColor).toBe('rgb(255, 255, 255)');
    expect(style.borderTopWidth).toBe('1px');
    expect(style.borderTopLeftRadius).toBe('6px');
    expect(style.paddingTop).toBe('6px');
  });

  if (sharedFaceWith) {
    const [siblingTag, siblingModuleUrl] = sharedFaceWith;
    test('reuses the appearance of a sibling input through the shared stylesheet', async () => {
      const host = hostOf();
      const sibling = document.createElement(siblingTag);
      document.body.append(host, sibling);
      await Promise.all([import(siblingModuleUrl), frame()]);

      const style = getComputedStyle(inputOf(host));
      expect(style.display).toBe('block');
      expect(style.backgroundColor).toBe('rgb(255, 255, 255)');
      expect(style.borderTopWidth).toBe('1px');
      expect(style.paddingTop).toBe('6px');
    });
  }

  test('restyles the face through the component tokens', async () => {
    const host = hostOf();
    host.style.setProperty('--yk-input-bg', 'rgb(9, 8, 7)');
    host.style.setProperty('--yk-input-color', 'rgb(6, 5, 4)');
    host.style.setProperty('--yk-input-border-color', 'rgb(3, 2, 1)');
    host.style.setProperty('--yk-input-radius', '2px');
    document.body.appendChild(host);
    await frame();

    const style = getComputedStyle(inputOf(host));
    expect(style.backgroundColor).toBe('rgb(9, 8, 7)');
    expect(style.color).toBe('rgb(6, 5, 4)');
    expect(style.borderTopColor).toBe('rgb(3, 2, 1)');
    expect(style.borderTopLeftRadius).toBe('2px');
  });

  test('styles the disabled and readonly faces with a muted background', async () => {
    const disabled = hostOf();
    disabled.disabled = true;
    const readonly = hostOf();
    readonly.readOnly = true;
    document.body.append(disabled, readonly);
    await frame();

    const white = 'rgb(255, 255, 255)';
    expect(getComputedStyle(inputOf(disabled)).backgroundColor).not.toBe(white);
    expect(getComputedStyle(inputOf(readonly)).backgroundColor).not.toBe(white);
  });
}
