// @ts-check
import { afterEach, expect, test } from 'vitest';
import '../src/components/yk-input-checkbox.js';

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

afterEach(() => {
  document.body.replaceChildren();
  // The link-activation tests navigate the page's hash, so reset it to keep
  // later tests on the same URL.
  history.replaceState(null, '', location.pathname + location.search);
});

const hostOf = () => document.createElement('yk-input-checkbox');
const inputOf = (host) => host.shadowRoot.querySelector('input');
const labelOf = (host) => host.shadowRoot.querySelector('[part=label]');
const markOf = (host) => host.shadowRoot.querySelector('[part=mark]');

test('self-registers in the custom element registry', () => {
  expect(customElements.get('yk-input-checkbox')).toBeDefined();
});

test('renders an internal checkbox input marked as a part', async () => {
  const host = hostOf();
  document.body.appendChild(host);
  await frame();

  const input = inputOf(host);
  expect(input).not.toBeNull();
  expect(input.type).toBe('checkbox');
  expect(input.getAttribute('part')).toBe('input');
  expect(labelOf(host).querySelector('input')).toBe(input);
  expect(markOf(host).getAttribute('aria-hidden')).toBe('true');
});

test('mirrors the value attribute onto the internal input', () => {
  const host = hostOf();
  host.setAttribute('value', 'weekly');
  document.body.appendChild(host);

  expect(inputOf(host).getAttribute('value')).toBe('weekly');

  host.removeAttribute('value');
  expect(inputOf(host).hasAttribute('value')).toBe(false);
});

test('exposes the value property backed by the internal input', () => {
  const host = hostOf();
  host.value = 'weekly';
  document.body.appendChild(host);

  expect(host.value).toBe('weekly');
  expect(inputOf(host).value).toBe('weekly');
  // A native checkbox's value reflects its content attribute.
  expect(host.getAttribute('value')).toBe('weekly');
});

test('keeps the checked attribute as the default and the property as the live state', async () => {
  const host = hostOf();
  host.setAttribute('checked', '');
  document.body.appendChild(host);
  await frame();

  expect(host.checked).toBe(true);
  expect(inputOf(host).checked).toBe(true);

  host.checked = false;
  expect(host.hasAttribute('checked')).toBe(true);
  expect(inputOf(host).checked).toBe(false);

  host.checked = true;
  expect(inputOf(host).checked).toBe(true);
  // Like the native property, the setter never writes the attribute.
  expect(host.getAttribute('checked')).toBe('');
});

test('does not create the checked attribute when only the property is set', () => {
  const host = hostOf();
  document.body.appendChild(host);

  host.checked = true;

  expect(host.checked).toBe(true);
  expect(host.hasAttribute('checked')).toBe(false);
});

test('adopts its own face stylesheet instead of the shared form-control one', async () => {
  const host = hostOf();
  document.body.appendChild(host);
  await frame();

  expect(host.shadowRoot.adoptedStyleSheets.length).toBe(1);
  // The shared input-core face would pad the control like a text field.
  expect(getComputedStyle(inputOf(host)).paddingTop).toBe('0px');
});

test('mirrors a later checked attribute change onto the internal input', () => {
  const host = hostOf();
  document.body.appendChild(host);

  host.setAttribute('checked', '');
  expect(inputOf(host).checked).toBe(true);

  host.removeAttribute('checked');
  expect(inputOf(host).checked).toBe(false);
});

test('updates the form value from the checked property without emitting events', () => {
  const form = document.createElement('form');
  const host = hostOf();
  host.setAttribute('name', 'newsletter');
  host.setAttribute('value', 'yes');
  form.append(host);
  document.body.appendChild(form);

  const events = [];
  for (const type of ['input', 'change']) {
    host.addEventListener(type, () => events.push(type));
  }
  host.checked = true;

  expect(new FormData(form).get('newsletter')).toBe('yes');
  expect(events).toEqual([]);
});

test('reflects the indeterminate property to the attribute and the internal input', async () => {
  const host = hostOf();
  document.body.appendChild(host);
  await frame();

  expect(host.indeterminate).toBe(false);
  expect(host.hasAttribute('indeterminate')).toBe(false);

  host.indeterminate = true;
  expect(host.indeterminate).toBe(true);
  expect(host.hasAttribute('indeterminate')).toBe(true);
  expect(inputOf(host).indeterminate).toBe(true);
  expect(inputOf(host).matches(':indeterminate')).toBe(true);

  host.indeterminate = false;
  expect(host.indeterminate).toBe(false);
  expect(host.hasAttribute('indeterminate')).toBe(false);
  expect(inputOf(host).indeterminate).toBe(false);
});

test('renders the dash face from the indeterminate attribute', async () => {
  const host = hostOf();
  host.setAttribute('indeterminate', '');
  document.body.appendChild(host);
  await frame();

  expect(inputOf(host).indeterminate).toBe(true);
  expect(inputOf(host).matches(':indeterminate')).toBe(true);

  host.removeAttribute('indeterminate');
  expect(inputOf(host).indeterminate).toBe(false);
});

test('clears the indeterminate attribute when the user toggles the box', async () => {
  const host = hostOf();
  host.setAttribute('indeterminate', '');
  document.body.appendChild(host);
  await frame();

  host.click();

  expect(host.checked).toBe(true);
  expect(host.indeterminate).toBe(false);
  expect(host.hasAttribute('indeterminate')).toBe(false);
});

test('keeps the indeterminate state when the checked property changes programmatically', async () => {
  const host = hostOf();
  document.body.appendChild(host);
  await frame();

  host.indeterminate = true;
  host.checked = true;

  expect(host.indeterminate).toBe(true);
  expect(host.hasAttribute('indeterminate')).toBe(true);
});

test('ignores input events from slotted controls when syncing the attribute', async () => {
  const host = hostOf();
  host.setAttribute('indeterminate', '');
  const slotted = document.createElement('input');
  slotted.type = 'checkbox';
  host.append(slotted);
  document.body.appendChild(host);
  await frame();

  slotted.click();

  expect(slotted.checked).toBe(true);
  expect(host.indeterminate).toBe(true);
  expect(host.hasAttribute('indeterminate')).toBe(true);
});

test('treats indeterminate as appearance only for submission and validation', () => {
  const form = document.createElement('form');
  const host = hostOf();
  host.setAttribute('name', 'agree');
  host.setAttribute('value', 'yes');
  host.required = true;
  host.setAttribute('indeterminate', '');
  form.append(host);
  document.body.appendChild(form);

  expect(host.validity.valueMissing).toBe(true);
  expect(new FormData(form).has('agree')).toBe(false);

  host.checked = true;

  expect(host.validity.valueMissing).toBe(false);
  expect(new FormData(form).get('agree')).toBe('yes');
});

test('renders the label text from the default slot and names the input with it', async () => {
  const host = hostOf();
  host.textContent = 'Subscribe to newsletter';
  document.body.appendChild(host);
  await frame();

  const label = labelOf(host);
  expect(
    label
      .querySelector('slot')
      .assignedNodes()
      .some((node) => node.textContent.trim()),
  ).toBe(true);
  // The implicit label association is what assistive tech reads as the name.
  expect([...inputOf(host).labels]).toContain(label);
});

test('toggles when the slotted label area is clicked', async () => {
  const host = hostOf();
  const text = document.createElement('span');
  text.textContent = 'Toggle me';
  host.append(text);
  document.body.appendChild(host);
  await frame();

  text.click();
  expect(host.checked).toBe(true);
  text.click();
  expect(host.checked).toBe(false);
});

test('toggles once for a direct click on the internal input', async () => {
  const host = hostOf();
  document.body.appendChild(host);
  await frame();

  inputOf(host).click();
  expect(host.checked).toBe(true);
});

test('toggles when the host itself is clicked', async () => {
  const host = hostOf();
  document.body.appendChild(host);
  await frame();

  host.click();
  expect(host.checked).toBe(true);
  host.click();
  expect(host.checked).toBe(false);
});

test('is labelable: an external label toggles the host', async () => {
  const label = document.createElement('label');
  label.htmlFor = 'yk-checkbox-labelable';
  const host = hostOf();
  host.id = 'yk-checkbox-labelable';
  document.body.append(label, host);
  await frame();

  expect([...host.labels]).toContain(label);

  label.click();
  expect(host.checked).toBe(true);
});

test('does not toggle when the click is canceled', async () => {
  const host = hostOf();
  host.addEventListener('click', (event) => event.preventDefault());
  document.body.appendChild(host);
  await frame();

  host.click();
  expect(host.checked).toBe(false);
});

test('does not toggle and keeps the default action when a slotted button is clicked', async () => {
  const host = hostOf();
  const button = document.createElement('button');
  button.type = 'button';
  let buttonClicks = 0;
  button.addEventListener('click', () => {
    buttonClicks += 1;
  });
  host.append(button);
  document.body.appendChild(host);
  await frame();

  button.click();
  expect(buttonClicks).toBe(1);
  expect(host.checked).toBe(false);
});

test('does not toggle and lets a slotted link navigate', async () => {
  const host = hostOf();
  const link = document.createElement('a');
  link.href = '#terms';
  link.textContent = 'terms';
  host.append(link);
  document.body.appendChild(host);
  await frame();

  link.click();
  expect(host.checked).toBe(false);
  expect(location.hash).toBe('#terms');
});

test('focuses the internal input when the host is focused', async () => {
  const host = hostOf();
  document.body.appendChild(host);
  await frame();

  host.focus();
  expect(host.shadowRoot.activeElement).toBe(inputOf(host));
});

test('contributes name=value to the owner form only while checked', () => {
  const form = document.createElement('form');
  const host = hostOf();
  host.setAttribute('name', 'newsletter');
  host.setAttribute('value', 'yes');
  form.append(host);
  document.body.appendChild(form);

  expect(new FormData(form).has('newsletter')).toBe(false);

  host.checked = true;
  expect(new FormData(form).get('newsletter')).toBe('yes');

  host.checked = false;
  expect(new FormData(form).has('newsletter')).toBe(false);
});

test('contributes the default value "on" while checked without a value attribute', () => {
  const form = document.createElement('form');
  const host = hostOf();
  host.setAttribute('name', 'flag');
  host.checked = true;
  form.append(host);
  document.body.appendChild(form);

  expect(new FormData(form).get('flag')).toBe('on');
});

test('contributes no entry while the host has no name even when checked', () => {
  const form = document.createElement('form');
  const host = hostOf();
  host.checked = true;
  form.append(host);
  document.body.appendChild(form);

  expect(new FormData(form).entries().next().done).toBe(true);
});

test('submits when the field is checked before it is named', () => {
  const form = document.createElement('form');
  const host = hostOf();
  host.checked = true;
  host.setAttribute('name', 'later');
  form.append(host);
  document.body.appendChild(form);

  expect(new FormData(form).get('later')).toBe('on');
});

test('follows user clicks to update the form value', async () => {
  const form = document.createElement('form');
  const host = hostOf();
  host.setAttribute('name', 'newsletter');
  host.setAttribute('value', 'yes');
  form.append(host);
  document.body.appendChild(form);
  await frame();

  host.click();
  expect(new FormData(form).get('newsletter')).toBe('yes');

  host.click();
  expect(new FormData(form).has('newsletter')).toBe(false);
});

test('surfaces valueMissing and blocks form submission until checked', () => {
  const form = document.createElement('form');
  const host = hostOf();
  host.setAttribute('name', 'agree');
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

  host.checked = true;
  expect(host.checkValidity()).toBe(true);
  form.requestSubmit();
  expect(submissions.length).toBe(1);
});

test('excludes a disabled field from the owner form', () => {
  const form = document.createElement('form');
  const host = hostOf();
  host.setAttribute('name', 'newsletter');
  host.checked = true;
  host.disabled = true;
  form.append(host);
  document.body.appendChild(form);

  expect(inputOf(host).disabled).toBe(true);
  expect(new FormData(form).has('newsletter')).toBe(false);
});

test('excludes the field from the form while a fieldset ancestor is disabled and restores it after', async () => {
  const form = document.createElement('form');
  const fieldset = document.createElement('fieldset');
  fieldset.disabled = true;
  const host = hostOf();
  host.setAttribute('name', 'newsletter');
  host.checked = true;
  fieldset.append(host);
  form.append(fieldset);
  document.body.appendChild(form);
  await frame();

  expect(new FormData(form).has('newsletter')).toBe(false);

  fieldset.disabled = false;
  expect(new FormData(form).get('newsletter')).toBe('on');
});

test('restores the checked attribute default when the owner form resets', () => {
  const form = document.createElement('form');
  const host = hostOf();
  host.setAttribute('name', 'newsletter');
  host.setAttribute('checked', '');
  form.append(host);
  document.body.appendChild(form);

  host.checked = false;
  form.reset();

  expect(host.checked).toBe(true);
  expect(new FormData(form).get('newsletter')).toBe('on');
});

test('drops the checked default from the submitted value after a reset without the attribute', () => {
  const form = document.createElement('form');
  const host = hostOf();
  host.setAttribute('name', 'newsletter');
  form.append(host);
  document.body.appendChild(form);

  host.checked = true;
  form.reset();

  expect(host.checked).toBe(false);
  expect(new FormData(form).has('newsletter')).toBe(false);
});

test('preserves the indeterminate state when the owner form resets', () => {
  const form = document.createElement('form');
  const host = hostOf();
  host.setAttribute('name', 'newsletter');
  form.append(host);
  document.body.appendChild(form);

  host.indeterminate = true;
  form.reset();

  expect(host.indeterminate).toBe(true);
  expect(host.hasAttribute('indeterminate')).toBe(true);
});

test('leaves an absent indeterminate attribute absent when the owner form resets', () => {
  const form = document.createElement('form');
  const host = hostOf();
  host.setAttribute('name', 'newsletter');
  form.append(host);
  document.body.appendChild(form);

  form.reset();

  expect(host.indeterminate).toBe(false);
  expect(host.hasAttribute('indeterminate')).toBe(false);
});

test('dims the face and label while the field is disabled', async () => {
  const enabled = hostOf();
  enabled.textContent = 'on';
  const disabled = hostOf();
  disabled.textContent = 'off';
  disabled.disabled = true;
  document.body.append(enabled, disabled);
  await frame();

  expect(getComputedStyle(labelOf(enabled)).opacity).toBe('1');
  expect(getComputedStyle(labelOf(disabled)).opacity).not.toBe('1');
});

test('restyles the face through the component tokens', async () => {
  const host = hostOf();
  host.style.setProperty('--yk-input-checkbox-size', '2em');
  host.style.setProperty('--yk-input-checkbox-bg', 'rgb(9, 8, 7)');
  host.style.setProperty('--yk-input-checkbox-border-color', 'rgb(3, 2, 1)');
  host.style.setProperty('--yk-input-checkbox-radius', '8px');
  document.body.appendChild(host);
  await frame();

  const style = getComputedStyle(inputOf(host));
  expect(style.width).toBe('32px');
  expect(style.height).toBe('32px');
  expect(style.backgroundColor).toBe('rgb(9, 8, 7)');
  expect(style.borderTopColor).toBe('rgb(3, 2, 1)');
  expect(style.borderTopLeftRadius).toBe('8px');
});

test('restyles the checked face and glyph through the component tokens', async () => {
  const host = hostOf();
  host.style.setProperty('--yk-input-checkbox-checked-bg', 'rgb(1, 2, 3)');
  host.style.setProperty('--yk-input-checkbox-checked-color', 'rgb(4, 5, 6)');
  host.checked = true;
  document.body.appendChild(host);
  await frame();

  expect(getComputedStyle(inputOf(host)).backgroundColor).toBe('rgb(1, 2, 3)');
  expect(getComputedStyle(markOf(host), '::before').borderBottomColor).toBe(
    'rgb(4, 5, 6)',
  );
  expect(
    getComputedStyle(markOf(host), '::before').borderInlineStartColor,
  ).toBe('rgb(4, 5, 6)');
});

test('draws the dash glyph with the checked color while indeterminate', async () => {
  const host = hostOf();
  host.style.setProperty('--yk-input-checkbox-checked-color', 'rgb(4, 5, 6)');
  host.indeterminate = true;
  document.body.appendChild(host);
  await frame();

  expect(getComputedStyle(markOf(host), '::before').backgroundColor).toBe(
    'rgb(4, 5, 6)',
  );
});
