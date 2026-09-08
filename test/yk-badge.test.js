// @ts-check
import { afterEach, expect, test } from 'vitest';
import '../src/components/yk-badge.js';

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

afterEach(() => {
  document.body.replaceChildren();
  for (const name of [
    '--yk-color-secondary',
    '--yk-color-primary',
    '--yk-color-danger',
  ]) {
    document.documentElement.style.removeProperty(name);
  }
});

test('self-registers in the custom element registry', () => {
  expect(customElements.get('yk-badge')).toBeDefined();
});

test('adopts its stylesheet as a constructable CSSStyleSheet', async () => {
  const host = document.createElement('yk-badge');
  document.body.appendChild(host);
  await frame();

  expect(host.shadowRoot.adoptedStyleSheets.length).toBe(1);
  for (const sheet of host.shadowRoot.adoptedStyleSheets) {
    expect(sheet).toBeInstanceOf(CSSStyleSheet);
  }
});

test('renders slotted content into the badge', async () => {
  const host = document.createElement('yk-badge');
  const label = document.createElement('span');
  label.textContent = 'New';
  host.append(label);
  document.body.appendChild(host);
  await frame();

  const slot = host.shadowRoot.querySelector('slot');
  expect(slot).not.toBeNull();
  expect(label.assignedSlot).toBe(slot);
});

test('renders a solid secondary face by default', async () => {
  document.documentElement.style.setProperty(
    '--yk-color-secondary',
    'rgb(4, 5, 6)',
  );
  const host = document.createElement('yk-badge');
  document.body.appendChild(host);
  await frame();

  const style = getComputedStyle(host);
  expect(style.backgroundColor).toBe('rgb(4, 5, 6)');
  expect(style.color).toBe('rgb(255, 255, 255)');
});

test('tints the face per variant through the global color tokens', async () => {
  document.documentElement.style.setProperty(
    '--yk-color-primary',
    'rgb(1, 2, 3)',
  );
  document.documentElement.style.setProperty(
    '--yk-color-danger',
    'rgb(7, 8, 9)',
  );
  const primary = document.createElement('yk-badge');
  primary.setAttribute('variant', 'primary');
  const danger = document.createElement('yk-badge');
  danger.setAttribute('variant', 'danger');
  document.body.append(primary, danger);
  await frame();

  expect(getComputedStyle(primary).backgroundColor).toBe('rgb(1, 2, 3)');
  expect(getComputedStyle(danger).backgroundColor).toBe('rgb(7, 8, 9)');
});

test('scales with the parent font size through em units', async () => {
  const parent = document.createElement('div');
  parent.style.fontSize = '20px';
  const host = document.createElement('yk-badge');
  parent.append(host);
  document.body.appendChild(parent);
  await frame();

  const style = getComputedStyle(host);
  expect(style.fontSize).toBe('15px'); // 20px × 0.75
  expect(style.paddingBlockStart).toBe('5.25px'); // 15px × 0.35
  expect(style.paddingInlineStart).toBe('9.75px'); // 15px × 0.65
});

test('rounds the corners into a pill when the pill attribute is set', async () => {
  const plain = document.createElement('yk-badge');
  plain.style.setProperty('--yk-badge-radius', '2px');
  const pill = document.createElement('yk-badge');
  pill.setAttribute('pill', '');
  pill.style.setProperty('--yk-badge-pill-radius', '99px');
  document.body.append(plain, pill);
  await frame();

  expect(getComputedStyle(plain).borderRadius).toBe('2px');
  expect(getComputedStyle(pill).borderRadius).toBe('99px');
});

test('restyles the face through the badge tokens', async () => {
  const host = document.createElement('yk-badge');
  host.style.setProperty('--yk-badge-bg', 'rgb(10, 11, 12)');
  host.style.setProperty('--yk-badge-color', 'rgb(13, 14, 15)');
  document.body.appendChild(host);
  await frame();

  const style = getComputedStyle(host);
  expect(style.backgroundColor).toBe('rgb(10, 11, 12)');
  expect(style.color).toBe('rgb(13, 14, 15)');
});

test('falls back to the secondary face for an unknown variant', async () => {
  document.documentElement.style.setProperty(
    '--yk-color-secondary',
    'rgb(4, 5, 6)',
  );
  const host = document.createElement('yk-badge');
  host.setAttribute('variant', 'bogus');
  document.body.appendChild(host);
  await frame();

  expect(getComputedStyle(host).backgroundColor).toBe('rgb(4, 5, 6)');
});

test('collapses when it has no content', async () => {
  const host = document.createElement('yk-badge');
  document.body.appendChild(host);
  await frame();

  expect(getComputedStyle(host).display).toBe('none');
});
