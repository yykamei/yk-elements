// @ts-check
import { afterAll, beforeAll, expect, test } from 'vitest';
// The `?raw` suffix asks Vite for the stylesheet text; a bare fetch would get
// the dev server's JavaScript module wrapping it instead.
import tokensCss from '../tokens.css?raw';
import { channels, contrast } from './helpers/color.js';

// Components import their own CSS, but tokens.css is a plain stylesheet the
// consumer links site-wide, so the tokens are absent from this document until
// the test injects them. Resolving them through real elements (rather than
// reading the custom properties back) is what proves they reach a used value:
// custom properties keep light-dark() unevaluated until a real property uses
// them.
let sheet;

beforeAll(() => {
  sheet = document.createElement('style');
  sheet.textContent = tokensCss;
  document.head.append(sheet);
});

afterAll(() => {
  sheet.remove();
  document.documentElement.removeAttribute('data-theme');
});

const PREFIX = '--yk-color-';

// The pairs whose contrast carries meaning for readability: body text on both
// page and surface backgrounds, and the tone faces' text. Borders and focus
// rings are excluded because the light values predate this change and are not
// asserted by the design.
const PAIRS = [
  ['text', 'bg'],
  ['text', 'surface'],
  ['text-muted', 'bg'],
  ['text-muted', 'surface'],
  ['on-tone', 'primary'],
  ['on-tone', 'secondary'],
  ['on-tone', 'danger'],
];

function setScheme(scheme) {
  document.documentElement.dataset.theme = scheme;
}

for (const scheme of ['light', 'dark']) {
  test(`resolves every text pair to at least 4.5:1 in the ${scheme} scheme`, () => {
    setScheme(scheme);
    for (const [foreground, background] of PAIRS) {
      const ratio = contrast(
        `var(${PREFIX}${foreground})`,
        `var(${PREFIX}${background})`,
      );
      expect(
        ratio,
        `${foreground} on ${background} (${scheme})`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
}

test('maps the data-theme attribute to the used color-scheme', () => {
  setScheme('dark');
  expect(getComputedStyle(document.documentElement).colorScheme).toBe('dark');
  setScheme('light');
  expect(getComputedStyle(document.documentElement).colorScheme).toBe('light');
});

test('follows the operating system setting until a theme is forced', () => {
  document.documentElement.removeAttribute('data-theme');
  expect(getComputedStyle(document.documentElement).colorScheme).toBe(
    'light dark',
  );
});

test('switches the resolved text color between schemes', () => {
  setScheme('light');
  const light = channels(`var(${PREFIX}text)`);
  setScheme('dark');
  const dark = channels(`var(${PREFIX}text)`);
  expect(light).not.toEqual(dark);
});

test('declares the status tones used by the alert', () => {
  const styles = getComputedStyle(document.documentElement);
  for (const name of ['--yk-color-info', '--yk-color-success']) {
    const value = styles.getPropertyValue(name).trim();
    expect(value, name).not.toBe('');
    expect(CSS.supports('color', value), name).toBe(true);
  }
});
