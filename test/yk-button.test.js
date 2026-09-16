// @ts-check
import { afterEach, expect, test } from 'vitest';
import '../src/components/yk-button.js';

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

afterEach(() => {
  document.body.replaceChildren();
  document.documentElement.style.removeProperty('--yk-color-primary');
  document.documentElement.style.removeProperty('--yk-space-sm');
});

test('self-registers in the custom element registry', () => {
  expect(customElements.get('yk-button')).toBeDefined();
});

test('adopts its core and component stylesheets as constructable CSSStyleSheets', () => {
  const host = document.createElement('yk-button');
  document.body.appendChild(host);

  expect(host.shadowRoot.adoptedStyleSheets.length).toBe(2);
  for (const sheet of host.shadowRoot.adoptedStyleSheets) {
    expect(sheet).toBeInstanceOf(CSSStyleSheet);
  }
});

test('renders an internal button that receives the slotted label', async () => {
  const host = document.createElement('yk-button');
  const label = document.createElement('span');
  label.textContent = 'Save';
  host.append(label);
  document.body.appendChild(host);
  await frame();

  const button = host.shadowRoot.querySelector('button');
  expect(button).not.toBeNull();
  expect(button.getAttribute('part')).toBe('button');
  expect(label.assignedSlot).toBe(button.querySelector('slot'));
});

test('defaults to type="button" and never submits its owner form', () => {
  const form = document.createElement('form');
  const host = document.createElement('yk-button');
  let submitted = false;
  form.addEventListener('submit', (event) => {
    submitted = true;
    event.preventDefault();
  });
  form.append(host);
  document.body.appendChild(form);

  host.shadowRoot.querySelector('button').click();
  expect(host.shadowRoot.querySelector('button').type).toBe('button');
  expect(submitted).toBe(false);
});

test('treats unknown type values as button', () => {
  const host = document.createElement('yk-button');
  host.setAttribute('type', 'reset');
  document.body.appendChild(host);

  expect(host.shadowRoot.querySelector('button').type).toBe('button');
});

test('submits the owner form when type is submit', () => {
  const form = document.createElement('form');
  const host = document.createElement('yk-button');
  host.setAttribute('type', 'submit');
  const events = [];
  form.addEventListener('submit', (event) => {
    events.push(event);
    event.preventDefault();
  });
  form.append(host);
  document.body.appendChild(form);

  host.shadowRoot.querySelector('button').click();
  expect(events.length).toBe(1);
});

test('submits nothing when type="submit" has no owner form', () => {
  const host = document.createElement('yk-button');
  host.setAttribute('type', 'submit');
  document.body.appendChild(host);

  expect(() => host.shadowRoot.querySelector('button').click()).not.toThrow();
});

test('mirrors the disabled attribute onto the internal button and suppresses clicks', () => {
  const host = document.createElement('yk-button');
  host.disabled = true;
  document.body.appendChild(host);

  const button = host.shadowRoot.querySelector('button');
  expect(button.disabled).toBe(true);
  let clicked = false;
  button.addEventListener('click', () => {
    clicked = true;
  });
  button.click();
  expect(clicked).toBe(false);
});

test('disables the internal button while a form or fieldset ancestor is disabled', async () => {
  const form = document.createElement('form');
  const fieldset = document.createElement('fieldset');
  fieldset.disabled = true;
  const host = document.createElement('yk-button');
  fieldset.append(host);
  form.append(fieldset);
  document.body.appendChild(form);
  await frame();

  expect(host.shadowRoot.querySelector('button').disabled).toBe(true);

  fieldset.disabled = false;
  expect(host.shadowRoot.querySelector('button').disabled).toBe(false);
});

test('tints the button face per variant through the global color token', async () => {
  document.documentElement.style.setProperty(
    '--yk-color-primary',
    'rgb(1, 2, 3)',
  );
  const host = document.createElement('yk-button');
  host.setAttribute('variant', 'primary');
  document.body.appendChild(host);
  await frame();

  const style = getComputedStyle(host.shadowRoot.querySelector('button'));
  expect(style.backgroundColor).toBe('rgb(1, 2, 3)');
});

test('distinguishes primary from the default tone', async () => {
  const def = document.createElement('yk-button');
  const primary = document.createElement('yk-button');
  primary.setAttribute('variant', 'primary');
  document.body.append(def, primary);
  await frame();

  const defaultColor = getComputedStyle(
    def.shadowRoot.querySelector('button'),
  ).backgroundColor;
  const primaryColor = getComputedStyle(
    primary.shadowRoot.querySelector('button'),
  ).backgroundColor;
  expect(defaultColor).not.toBe(primaryColor);
});

test('styles the default face as a light bordered button, distinct from secondary', async () => {
  const def = document.createElement('yk-button');
  const secondary = document.createElement('yk-button');
  secondary.setAttribute('variant', 'secondary');
  document.body.append(def, secondary);
  await frame();

  const defStyle = getComputedStyle(def.shadowRoot.querySelector('button'));
  const secondaryStyle = getComputedStyle(
    secondary.shadowRoot.querySelector('button'),
  );
  expect(defStyle.backgroundColor).toBe('rgb(255, 255, 255)');
  expect(defStyle.backgroundColor).not.toBe(secondaryStyle.backgroundColor);
  expect(defStyle.color).not.toBe(secondaryStyle.color);
});

test('restyles the default face through the component color tokens', async () => {
  const host = document.createElement('yk-button');
  host.style.setProperty('--yk-button-bg', 'rgb(9, 8, 7)');
  host.style.setProperty('--yk-button-color', 'rgb(6, 5, 4)');
  host.style.setProperty('--yk-button-border-color', 'rgb(3, 2, 1)');
  document.body.appendChild(host);
  await frame();

  const style = getComputedStyle(host.shadowRoot.querySelector('button'));
  expect(style.backgroundColor).toBe('rgb(9, 8, 7)');
  expect(style.color).toBe('rgb(6, 5, 4)');
  expect(style.borderTopColor).toBe('rgb(3, 2, 1)');
});

test('restyles solid tone text through the on-tone token', async () => {
  const host = document.createElement('yk-button');
  host.setAttribute('variant', 'primary');
  host.style.setProperty('--yk-button-on-tone', 'rgb(3, 2, 1)');
  document.body.appendChild(host);
  await frame();

  expect(getComputedStyle(host.shadowRoot.querySelector('button')).color).toBe(
    'rgb(3, 2, 1)',
  );
});

test('lays the host out as an inline-flex face driven by padding tokens', async () => {
  document.documentElement.style.setProperty('--yk-space-sm', '2px');
  const host = document.createElement('yk-button');
  host.style.setProperty('--yk-button-padding-inline', '7px');
  document.body.appendChild(host);
  await frame();

  const hostStyle = getComputedStyle(host);
  expect(hostStyle.display).toBe('inline-flex');
  const buttonStyle = getComputedStyle(host.shadowRoot.querySelector('button'));
  expect(buttonStyle.paddingBlock).toBe('2px');
  expect(buttonStyle.paddingLeft).toBe('7px');
});

test('focuses the internal button when the host is focused', async () => {
  const host = document.createElement('yk-button');
  document.body.appendChild(host);
  await frame();

  host.focus();
  expect(host.shadowRoot.activeElement).toBe(
    host.shadowRoot.querySelector('button'),
  );
});
