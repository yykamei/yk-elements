// @ts-check
import { afterEach, expect, test } from 'vitest';
import '../src/components/yk-progress.js';

afterEach(() => {
  document.body.replaceChildren();
});

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

function makeProgress(attributes = {}) {
  const host = document.createElement('yk-progress');
  for (const [name, value] of Object.entries(attributes)) {
    host.setAttribute(name, value);
  }
  document.body.appendChild(host);
  return host;
}

const progressOf = (host) => host.shadowRoot.querySelector('progress');

test('self-registers in the custom element registry', () => {
  expect(customElements.get('yk-progress')).toBeDefined();
});

test('adopts its stylesheet as a constructable CSSStyleSheet', () => {
  const host = makeProgress();

  expect(host.shadowRoot.adoptedStyleSheets.length).toBe(1);
  expect(host.shadowRoot.adoptedStyleSheets[0]).toBeInstanceOf(CSSStyleSheet);
});

test('renders an internal progress element marked as a part', () => {
  const host = makeProgress();

  expect(progressOf(host)).not.toBeNull();
  expect(progressOf(host).getAttribute('part')).toBe('progress');
});

test('mirrors the value and max attributes onto the internal progress', () => {
  const host = makeProgress({ value: '40', max: '100' });

  expect(progressOf(host).value).toBe(40);
  expect(progressOf(host).max).toBe(100);

  host.setAttribute('value', '70');
  expect(progressOf(host).value).toBe(70);

  host.removeAttribute('value');
  expect(progressOf(host).hasAttribute('value')).toBe(false);
});

test('exposes value and max properties backed by the internal progress', () => {
  const host = makeProgress();

  host.value = 3;
  host.max = 10;

  expect(host.value).toBe(3);
  expect(host.max).toBe(10);
  expect(progressOf(host).value).toBe(3);
  expect(progressOf(host).max).toBe(10);
});

test('is indeterminate while no value is set', () => {
  const host = makeProgress();

  expect(progressOf(host).matches(':indeterminate')).toBe(true);
  expect(host.value).toBeNull();

  host.value = 1;
  expect(progressOf(host).matches(':indeterminate')).toBe(false);
});

test('clears the value and returns to indeterminate when set to null', () => {
  const host = makeProgress({ value: '3', max: '10' });
  expect(host.value).toBe(3);

  host.value = null;

  expect(host.hasAttribute('value')).toBe(false);
  expect(host.value).toBeNull();
  expect(progressOf(host).matches(':indeterminate')).toBe(true);
});

test('uses the native max default of 1', () => {
  const host = makeProgress();

  expect(host.max).toBe(1);
});

test('forwards aria-label to the internal progress', () => {
  const host = makeProgress({ 'aria-label': 'Progress' });

  expect(progressOf(host).getAttribute('aria-label')).toBe('Progress');

  host.setAttribute('aria-label', 'Learning progress');
  expect(progressOf(host).getAttribute('aria-label')).toBe('Learning progress');
});

test('forwards aria-labelledby to the internal progress', () => {
  const host = makeProgress({ 'aria-labelledby': 'progress-label' });

  expect(progressOf(host).getAttribute('aria-labelledby')).toBe(
    'progress-label',
  );
});

test('restyles the bar through the component tokens', async () => {
  const host = makeProgress({ value: '1' });
  host.style.setProperty('--yk-progress-height', '1rem');
  host.style.setProperty('--yk-progress-bg', 'rgb(9, 8, 7)');
  host.style.setProperty('--yk-progress-radius', '2px');
  await frame();

  const style = getComputedStyle(progressOf(host));
  expect(style.height).toBe('16px');
  expect(style.backgroundColor).toBe('rgb(9, 8, 7)');
  expect(style.borderTopLeftRadius).toBe('2px');
});

test('paints the filled portion through the fill token', () => {
  const host = makeProgress({ value: '1' });
  const rules = [...host.shadowRoot.adoptedStyleSheets[0].cssRules];
  const valueRule = rules.find(
    (rule) => rule.selectorText === 'progress::-webkit-progress-value',
  );

  // getComputedStyle does not resolve the progress pseudo-elements, so the
  // token is pinned structurally instead; the Firefox rule uses the same token
  // (its rule is not retained in the Chromium CSSOM).
  expect(valueRule?.cssText).toContain('--yk-progress-fill-bg');
});
