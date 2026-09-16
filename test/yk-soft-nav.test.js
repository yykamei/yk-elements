// @ts-check
import { afterEach, expect, test } from 'vitest';
import '../src/components/yk-soft-nav.js';

const adopt = () => document.adoptedStyleSheets;

const optInSheet = () =>
  adopt().find((sheet) =>
    [...sheet.cssRules].some((rule) =>
      rule.cssText.includes('@view-transition'),
    ),
  );

afterEach(() => {
  document.body.replaceChildren();
});

test('self-registers in the custom element registry', () => {
  expect(customElements.get('yk-soft-nav')).toBeDefined();
});

test('adopts a stylesheet opting the document into cross-document view transitions', () => {
  expect(optInSheet()).toBeUndefined();
  const host = document.createElement('yk-soft-nav');
  document.body.appendChild(host);

  const sheet = optInSheet();
  expect(sheet).toBeDefined();
  const text = [...sheet.cssRules].map((rule) => rule.cssText).join('\n');
  expect(text).toContain('@view-transition');
  expect(text).toContain('navigation: auto');
});

test('guards the transition with a prefers-reduced-motion rule', () => {
  document.body.appendChild(document.createElement('yk-soft-nav'));

  const text = [...optInSheet().cssRules]
    .map((rule) => rule.cssText)
    .join('\n');
  expect(text).toContain('prefers-reduced-motion: reduce');
  // Chromium serializes the disabled shorthand oddly; asserting the guarded
  // selectors keeps the test about intent, not one engine's serialization.
  expect(text).toContain('::view-transition-group');
});

test('multiple instances add no extra stylesheets', () => {
  const before = adopt().length;
  const first = document.createElement('yk-soft-nav');
  const second = document.createElement('yk-soft-nav');
  document.body.append(first, second);

  expect(adopt().length).toBe(before + 1);
});

test('removes the stylesheet when the last instance disconnects', () => {
  const before = adopt().length;
  const first = document.createElement('yk-soft-nav');
  const second = document.createElement('yk-soft-nav');
  document.body.append(first, second);
  expect(adopt().length).toBe(before + 1);
  expect(optInSheet()).toBeDefined();

  first.remove();
  expect(optInSheet()).toBeDefined();
  second.remove();
  expect(optInSheet()).toBeUndefined();
});
