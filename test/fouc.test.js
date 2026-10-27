// @ts-check
import { afterEach, expect, test } from 'vitest';
import foucCss from '../fouc.css?raw';

// Import every layout module so the comparison has a defined host to measure.
// The iframe below has its own custom element registry, so the same tags stay
// undefined there.
const layoutModules = import.meta.glob('../src/layout/*.js', { eager: true });
const layoutStyles = import.meta.glob('../src/layout/*.css', {
  eager: true,
  query: '?raw',
  import: 'default',
});

const layoutTags = Object.keys(layoutModules)
  .map((path) => path.split('/').at(-1).replace(/\.js$/, ''))
  .sort();

const fallbackTags = [
  ...foucCss.matchAll(/:where\((yk-[\w-]+):not\(:defined\)\)/g),
]
  .map((match) => match[1])
  .sort();

// Host properties used by the current primitives. The declaration-level test
// below is the exact mirror guard, including margin-inline: auto; this list
// only proves the fallback rules actually apply to undefined elements.
const HOST_PROPERTIES = [
  'display',
  'flex-direction',
  'flex-wrap',
  'justify-content',
  'align-items',
  'gap',
  'grid-template-columns',
  'box-sizing',
  'padding-block-start',
  'padding-block-end',
  'padding-inline-start',
  'padding-inline-end',
  'max-inline-size',
];

afterEach(() => {
  document.querySelectorAll('iframe').forEach((frame) => {
    frame.remove();
  });
  document.body.replaceChildren();
});

function declarationsOf(css, selector) {
  const withoutComments = css.replaceAll(/\/\*[\s\S]*?\*\//g, '');
  const selectorStart = withoutComments.indexOf(selector);
  if (selectorStart < 0) {
    throw new Error(`missing selector: ${selector}`);
  }

  const open = withoutComments.indexOf('{', selectorStart);
  let depth = 0;
  for (let index = open; index < withoutComments.length; index += 1) {
    if (withoutComments[index] === '{') {
      depth += 1;
    } else if (withoutComments[index] === '}') {
      depth -= 1;
      if (depth === 0) {
        return withoutComments
          .slice(open + 1, index)
          .split(';')
          .map((declaration) => declaration.replaceAll(/\s+/g, ' ').trim())
          .filter(Boolean);
      }
    }
  }

  throw new Error(`unclosed block: ${selector}`);
}

function documentWithFallback() {
  const iframe = document.createElement('iframe');
  iframe.style.cssText =
    'position: absolute; visibility: hidden; width: 800px; height: 600px;';
  document.body.append(iframe);

  const doc = iframe.contentDocument;
  const style = doc.createElement('style');
  style.textContent = foucCss;
  doc.head.append(style);
  return doc;
}

test('every layout primitive has exactly one pre-upgrade fallback rule', () => {
  expect(layoutTags.length).toBeGreaterThan(0);
  expect(fallbackTags).toEqual(layoutTags);
  for (const tag of layoutTags) {
    expect(customElements.get(tag), tag).toBeDefined();
  }
});

test('fallback declarations mirror each primitive :host rule', () => {
  for (const tag of layoutTags) {
    const source = layoutStyles[`../src/layout/${tag}.css`];
    expect(source, tag).toBeTypeOf('string');
    expect(
      declarationsOf(foucCss, `:where(${tag}:not(:defined))`),
      tag,
    ).toEqual(declarationsOf(source, ':host'));
  }
});

test('fallback host layout matches the defined components', () => {
  const doc = documentWithFallback();

  for (const tag of layoutTags) {
    const defined = document.createElement(tag);
    defined.style.inlineSize = '800px';
    document.body.append(defined);

    const undefinedHost = doc.createElement(tag);
    undefinedHost.style.inlineSize = '800px';
    doc.body.append(undefinedHost);

    const definedStyle = getComputedStyle(defined);
    const fallbackStyle = doc.defaultView.getComputedStyle(undefinedHost);

    for (const property of HOST_PROPERTIES) {
      expect(
        fallbackStyle.getPropertyValue(property),
        `${tag} ${property}`,
      ).toBe(definedStyle.getPropertyValue(property));
    }

    defined.remove();
  }
});
