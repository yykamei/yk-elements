// @ts-check
import { afterEach, expect, test } from 'vitest';
import '../src/components/yk-input-checkbox.js';

afterEach(() => {
  document.body.replaceChildren();
});

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const hostOf = () => document.createElement('yk-input-checkbox');
const inputOf = (host) => host.shadowRoot.querySelector('input');

const click = (host) => {
  // Click the host, not the internal input, so the label-activation path
  // (host click → forwarded to the input) is what gets exercised.
  host.click();
};

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
});

test('mirrors the value attribute onto the internal input', () => {
  const host = hostOf();
  host.setAttribute('value', 'newsletter');
  document.body.appendChild(host);

  expect(inputOf(host).getAttribute('value')).toBe('newsletter');

  host.removeAttribute('value');
  expect(inputOf(host).hasAttribute('value')).toBe(false);
});

test('keeps the checked attribute as the default and the property as the live state', async () => {
  const host = hostOf();
  host.setAttribute('checked', '');
  document.body.appendChild(host);
  await frame();

  expect(host.checked).toBe(true);
  expect(inputOf(host).checked).toBe(true);

  // Unchecking via the property keeps the default attribute in place, like a
  // native checkbox keeps its checked attribute after user interaction.
  host.checked = false;
  expect(host.hasAttribute('checked')).toBe(true);
  expect(inputOf(host).checked).toBe(false);

  host.checked = true;
  expect(inputOf(host).checked).toBe(true);
});

test('mirrors a later checked attribute change onto the internal input', () => {
  const host = hostOf();
  document.body.appendChild(host);

  host.setAttribute('checked', '');
  expect(inputOf(host).checked).toBe(true);

  host.removeAttribute('checked');
  expect(inputOf(host).checked).toBe(false);
});

test('exposes the indeterminate property backed by the internal input', async () => {
  const host = hostOf();
  document.body.appendChild(host);
  await frame();

  expect(host.indeterminate).toBe(false);

  host.indeterminate = true;
  expect(host.indeterminate).toBe(true);
  expect(inputOf(host).indeterminate).toBe(true);
  expect(inputOf(host).matches(':indeterminate')).toBe(true);
});

test('renders the label text from the default slot', async () => {
  const host = hostOf();
  host.textContent = 'Subscribe to newsletter';
  document.body.appendChild(host);
  await frame();

  const label = host.shadowRoot.querySelector('label[part=label]');
  expect(label).not.toBeNull();
  expect(label.querySelector('input')).toBe(inputOf(host));
  expect(
    label
      .querySelector('slot')
      .assignedNodes()
      .some((node) => node.textContent.trim()),
  ).toBe(true);
});

test('names the internal checkbox through the shadow label', async () => {
  const host = hostOf();
  host.textContent = 'Subscribe to newsletter';
  document.body.appendChild(host);
  await frame();

  // The implicit association is what assistive tech reads as the name when
  // keyboard focus lands on the internal input.
  const label = host.shadowRoot.querySelector('label[part=label]');
  expect([...inputOf(host).labels]).toContain(label);
});

test('toggles once for a direct click on the internal input', async () => {
  const host = hostOf();
  host.textContent = 'Toggle me';
  document.body.appendChild(host);
  await frame();

  // The click guard must not re-forward a click that already reached the
  // input, or the box would flip twice.
  inputOf(host).click();
  expect(host.checked).toBe(true);
});

test('does not toggle when the click is canceled', async () => {
  const host = hostOf();
  host.textContent = 'Toggle me';
  host.addEventListener('click', (event) => event.preventDefault());
  document.body.appendChild(host);
  await frame();

  host.click();
  expect(host.checked).toBe(false);
});

test('does not toggle when the label text carries a link and the link is clicked', async () => {
  const host = hostOf();
  const text = document.createTextNode('Read the ');
  const link = document.createElement('a');
  link.textContent = 'terms';
  link.id = 'yk-checkbox-link';
  host.append(text, link);
  document.body.appendChild(host);
  await frame();

  link.click();
  expect(host.checked).toBe(false);

  // Clicks outside the link still toggle.
  host.click();
  expect(host.checked).toBe(true);
});

test('toggles when the slotted label area is clicked', async () => {
  const host = hostOf();
  host.textContent = 'Toggle me';
  document.body.appendChild(host);
  await frame();

  click(host);
  expect(host.checked).toBe(true);
  click(host);
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

test('focuses the internal input when the host is focused', async () => {
  const host = hostOf();
  document.body.appendChild(host);
  await frame();

  host.focus();
  expect(host.shadowRoot.activeElement).toBe(inputOf(host));
});

test('contributes name=value to the owner form while checked', () => {
  const form = document.createElement('form');
  const host = hostOf();
  host.setAttribute('name', 'newsletter');
  host.setAttribute('value', 'yes');
  form.append(host);
  document.body.appendChild(form);

  expect(new FormData(form).has('newsletter')).toBe(false);

  host.checked = true;
  expect(new FormData(form).get('newsletter')).toBe('yes');
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

test('follows user clicks to update the form value', async () => {
  const form = document.createElement('form');
  const host = hostOf();
  host.setAttribute('name', 'newsletter');
  host.setAttribute('value', 'yes');
  form.append(host);
  document.body.appendChild(form);
  await frame();

  click(host);
  expect(new FormData(form).get('newsletter')).toBe('yes');
  click(host);
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

  expect(new FormData(form).has('newsletter')).toBe(false);
  expect(inputOf(host).disabled).toBe(true);
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

test('drops the checked default from the submitted value after a form reset without the attribute', () => {
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

test('dims the face and label while the field is disabled', async () => {
  const enabled = hostOf();
  enabled.textContent = 'on';
  const disabled = hostOf();
  disabled.textContent = 'off';
  disabled.disabled = true;
  document.body.append(enabled, disabled);
  await frame();

  const enabledStyle = getComputedStyle(inputOf(enabled));
  const disabledStyle = getComputedStyle(inputOf(disabled));
  expect(enabledStyle.opacity).toBe('1');
  expect(disabledStyle.opacity).not.toBe('1');
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
  expect(style.backgroundColor).toBe('rgb(9, 8, 7)');
  expect(style.borderTopColor).toBe('rgb(3, 2, 1)');
  expect(style.borderTopLeftRadius).toBe('8px');
});

test('restyles the checked face through the component tokens', async () => {
  const host = hostOf();
  host.style.setProperty('--yk-input-checkbox-checked-bg', 'rgb(1, 2, 3)');
  host.style.setProperty(
    '--yk-input-checkbox-checked-image',
    'url("data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\'/>" )',
  );
  host.checked = true;
  document.body.appendChild(host);
  await frame();

  const style = getComputedStyle(inputOf(host));
  expect(style.backgroundColor).toBe('rgb(1, 2, 3)');
  // The SVG data URI cannot interpolate a CSS variable, so the whole image is
  // the overridable unit.
  expect(style.backgroundImage).toContain('<svg');
  expect(style.backgroundImage).not.toContain('%20viewBox');
});
