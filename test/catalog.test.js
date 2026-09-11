// @ts-check
import { afterEach, expect, test, vi } from 'vitest';
import { categories, components, tokens } from '../catalog/catalog.js';

const VARIATIONS = {
  'yk-vstack': 3,
  'yk-hstack': 2,
  'yk-cluster': 15,
  'yk-grid': 2,
  'yk-pad': 4,
  'yk-button': 6,
  'yk-link': 5,
  'yk-badge': 5,
  'yk-input-text': 9,
  'yk-input-email': 10,
  'yk-input-tel': 9,
  'yk-input-url': 9,
};

afterEach(() => {
  document.querySelectorAll('iframe').forEach((frame) => {
    frame.remove();
  });
});

async function fetchHtml(path) {
  const res = await fetch(path);
  expect(res.ok, path).toBe(true);
  return new DOMParser().parseFromString(await res.text(), 'text/html');
}

function loadIframe(path) {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.src = path;
    iframe.style.display = 'none';
    iframe.addEventListener('load', () => resolve(iframe));
    iframe.addEventListener('error', () =>
      reject(new Error(`failed to load ${path}`)),
    );
    document.body.appendChild(iframe);
  });
}

const tags = components.map(({ tag }) => tag);

test('every catalog page references the library entry point, tokens, and shared chrome', async () => {
  const pages = [
    '/catalog/index.html',
    ...tags.map((tag) => `/catalog/${tag}.html`),
  ];
  for (const path of pages) {
    const doc = await fetchHtml(path);
    expect(
      doc.querySelector('script[type="module"][src="../index.js"]'),
      path,
    ).not.toBeNull();
    expect(
      doc.querySelector('link[rel="stylesheet"][href="../tokens.css"]'),
      path,
    ).not.toBeNull();
    expect(
      doc.querySelector('script[type="module"][src="./catalog.js"]'),
      path,
    ).not.toBeNull();
    expect(doc.querySelector('[data-sidebar]'), path).not.toBeNull();
  }
});

test('landing page declares the overview layout with a landing container', async () => {
  const doc = await fetchHtml('/catalog/index.html');
  expect(doc.querySelector('[data-landing]')).not.toBeNull();
  expect(doc.querySelector('[data-tokens]')).not.toBeNull();
});

test('bare /catalog URL is normalized to the trailing-slash form', async () => {
  const iframe = await loadIframe('/catalog');
  // The load event can fire before the redirect replaces the document and
  // the module scripts render the shared chrome, so wait for the chrome
  // itself instead of asserting right after the navigation settles.
  await vi.waitFor(() => {
    expect(
      iframe.contentDocument.querySelector('.brand')?.textContent.trim(),
    ).toBe('yk-elements');
  });
  expect(iframe.contentWindow.location.pathname.endsWith('/')).toBe(true);
  expect(
    iframe.contentDocument.querySelectorAll('nav a').length,
  ).toBeGreaterThan(0);
});

test('each component page declares its component and lists its variations', async () => {
  for (const { tag } of components) {
    const variations = VARIATIONS[tag];
    expect(variations, tag).toBeDefined();
    const doc = await fetchHtml(`/catalog/${tag}.html`);
    expect(doc.body.dataset.component).toBe(tag);
    expect(doc.querySelector('[data-component-header]')).not.toBeNull();
    expect(doc.querySelectorAll('figure').length).toBe(variations);
  }
});

test('every component declares a known category', () => {
  const names = categories.map(({ name }) => name);
  expect(names).toEqual(['Layout', 'Components']);
  for (const { tag, category } of components) {
    expect(names, tag).toContain(category);
  }
  expect(categories.flatMap(({ components: group }) => group)).toEqual(
    components,
  );
});

const CONTROL_KINDS = ['boolean', 'select', 'text'];

test('every attribute declares a valid playground control', () => {
  for (const { tag, attributes } of components) {
    for (const { name, control, options } of attributes) {
      const label = `${tag} ${name}`;
      expect(CONTROL_KINDS, label).toContain(control);
      if (control === 'select') {
        expect(Array.isArray(options) && options.length > 0, label).toBe(true);
      }
    }
  }
});

test('every component declares playground content', () => {
  for (const { tag, playground } of components) {
    expect(typeof playground?.content, tag).toBe('string');
  }
});

test('attribute and CSS custom property names are safe identifiers', () => {
  const attributeName = /^[a-z][a-z0-9-]*$/;
  const propertyName = /^--[a-z][a-z0-9-]*$/;
  for (const { tag, attributes, cssProperties } of components) {
    for (const { name } of attributes) {
      expect(attributeName.test(name), `${tag} ${name}`).toBe(true);
    }
    for (const { name } of cssProperties) {
      expect(propertyName.test(name), `${tag} ${name}`).toBe(true);
    }
  }
});

async function loadPlayground(tag) {
  const iframe = await loadIframe(`/catalog/${tag}.html`);
  const doc = iframe.contentDocument;
  return { iframe, doc, section: doc.querySelector('[data-playground]') };
}

function setInput(control, value) {
  if (control.type === 'checkbox') {
    control.checked = value;
  } else {
    control.value = value;
  }
  control.dispatchEvent(new Event('input', { bubbles: true }));
}

function setControl(section, name, value) {
  setInput(
    section.querySelector(`[data-playground-attribute="${name}"]`),
    value,
  );
}

function setProperty(section, name, value) {
  setInput(
    section.querySelector(`[data-playground-property="${name}"]`),
    value,
  );
}

const codeOf = (section) =>
  section.querySelector('[data-playground-code]').textContent;

test('each component page renders a playground with one control per attribute', async () => {
  for (const { tag, attributes } of components) {
    const { section } = await loadPlayground(tag);
    expect(section, tag).not.toBeNull();

    const preview = section.querySelector('[data-playground-preview] > *');
    expect(preview, tag).not.toBeNull();
    expect(preview.tagName, tag).toBe(tag.toUpperCase());

    const controls = section.querySelectorAll('[data-playground-attribute]');
    expect(controls.length, tag).toBe(attributes.length);
    for (const { name, control } of attributes) {
      const label = `${tag} ${name}`;
      const element = section.querySelector(
        `[data-playground-attribute="${name}"]`,
      );
      expect(element, label).not.toBeNull();
      if (control === 'boolean') {
        expect(element.type, label).toBe('checkbox');
      } else if (control === 'select') {
        expect(element.tagName, label).toBe('SELECT');
      } else {
        expect(element.tagName, label).toBe('INPUT');
        expect(element.type, label).toBe('text');
      }
    }
  }
});

test('the playground previews the initial generated code', async () => {
  const { section } = await loadPlayground('yk-button');
  expect(codeOf(section)).toBe('<yk-button>Button</yk-button>');
});

test('layout playground content renders as indented demo items', async () => {
  const { section } = await loadPlayground('yk-vstack');
  expect(codeOf(section)).toBe(
    '<yk-vstack>\n  <p class="demo-item">First item</p>\n  <p class="demo-item">Second item</p>\n  <p class="demo-item">Third item</p>\n</yk-vstack>',
  );
  expect(
    section.querySelectorAll('[data-playground-preview] .demo-item').length,
  ).toBe(3);
});

test('a select control sets its attribute and updates the generated code', async () => {
  const { section } = await loadPlayground('yk-button');
  const host = section.querySelector('[data-playground-preview] > *');
  setControl(section, 'variant', 'primary');
  expect(host.getAttribute('variant')).toBe('primary');
  expect(codeOf(section)).toBe(
    '<yk-button variant="primary">Button</yk-button>',
  );

  setControl(section, 'variant', '');
  expect(host.hasAttribute('variant')).toBe(false);
});

test('a boolean control toggles a bare attribute in the generated code', async () => {
  const { section } = await loadPlayground('yk-button');
  const host = section.querySelector('[data-playground-preview] > *');
  setControl(section, 'disabled', true);
  expect(host.hasAttribute('disabled')).toBe(true);
  expect(codeOf(section)).toBe('<yk-button disabled>Button</yk-button>');

  setControl(section, 'disabled', false);
  expect(host.hasAttribute('disabled')).toBe(false);
  expect(codeOf(section)).toBe('<yk-button>Button</yk-button>');
});

test('a text control sets its attribute and escapes the generated code', async () => {
  const { section } = await loadPlayground('yk-input-text');
  const host = section.querySelector('[data-playground-preview] > *');
  setControl(section, 'placeholder', 'a&b<c>d"e');
  expect(host.getAttribute('placeholder')).toBe('a&b<c>d"e');

  const code = codeOf(section);
  expect(code).toBe(
    '<yk-input-text placeholder="a&amp;b&lt;c&gt;d&quot;e"></yk-input-text>',
  );
  expect(code).not.toContain('a&b<c>d"e');
});

test('generated code lists attributes in metadata order', async () => {
  const { section } = await loadPlayground('yk-input-text');
  setControl(section, 'name', 'email');
  setControl(section, 'placeholder', 'you@example.com');
  expect(codeOf(section)).toBe(
    '<yk-input-text placeholder="you@example.com" name="email"></yk-input-text>',
  );
});

test('reset restores the initial playground state', async () => {
  for (const tag of ['yk-button', 'yk-input-text']) {
    const component = components.find((known) => known.tag === tag);
    const { section } = await loadPlayground(tag);
    const host = section.querySelector('[data-playground-preview] > *');
    const initial = codeOf(section);

    const inputs = section.querySelectorAll(
      '[data-playground-attribute], [data-playground-property]',
    );
    for (const control of inputs) {
      setInput(control, control.type === 'checkbox' ? true : 'x');
    }
    expect(codeOf(section), tag).not.toBe(initial);

    section.querySelector('[data-playground-reset]').click();

    for (const { name } of component.attributes) {
      expect(host.hasAttribute(name), `${tag} ${name}`).toBe(false);
    }
    // Clearing the last custom property leaves an empty style attribute in
    // Chromium; assert the declaration itself is empty, not the attribute.
    expect(host.style.cssText, tag).toBe('');
    expect(codeOf(section), tag).toBe(initial);
    for (const control of inputs) {
      if (control.type === 'checkbox') {
        expect(control.checked, tag).toBe(false);
      } else {
        expect(control.value, tag).toBe('');
      }
    }
  }
});

test('copy writes the generated code to the clipboard', async () => {
  const { iframe, section } = await loadPlayground('yk-button');
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(iframe.contentWindow.navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });

  section.querySelector('[data-playground-copy]').click();

  await vi.waitFor(() => {
    expect(writeText).toHaveBeenCalledWith('<yk-button>Button</yk-button>');
  });
});

test('each component page renders one control per CSS custom property', async () => {
  for (const { tag, cssProperties } of components) {
    const { section } = await loadPlayground(tag);
    const controls = section.querySelectorAll('[data-playground-property]');
    expect(controls.length, tag).toBe(cssProperties.length);
    for (const { name } of cssProperties) {
      const control = section.querySelector(
        `[data-playground-property="${name}"]`,
      );
      expect(control, `${tag} ${name}`).not.toBeNull();
      expect(control.type, `${tag} ${name}`).toBe('text');
    }
  }
});

test('a CSS custom property control updates the preview style and code', async () => {
  const { section } = await loadPlayground('yk-vstack');
  const host = section.querySelector('[data-playground-preview] > *');

  setProperty(section, '--yk-vstack-gap', '2rem');
  expect(host.style.getPropertyValue('--yk-vstack-gap')).toBe('2rem');
  expect(codeOf(section)).toContain('style="--yk-vstack-gap: 2rem"');

  setProperty(section, '--yk-vstack-gap', '');
  expect(host.style.getPropertyValue('--yk-vstack-gap')).toBe('');
  expect(codeOf(section)).not.toContain('style=');
});

test('generated code joins the CSS custom properties in metadata order', async () => {
  const { section } = await loadPlayground('yk-hstack');
  setProperty(section, '--yk-hstack-gap', '2rem');
  setProperty(section, '--yk-hstack-align', 'center');
  expect(codeOf(section)).toContain(
    'style="--yk-hstack-align: center; --yk-hstack-gap: 2rem"',
  );
});

test('generated code escapes CSS custom property values', async () => {
  const { section } = await loadPlayground('yk-vstack');
  setProperty(section, '--yk-vstack-gap', 'a&b<c>d"e');
  expect(codeOf(section)).toContain(
    'style="--yk-vstack-gap: a&amp;b&lt;c&gt;d&quot;e"',
  );
});

test('landing page groups cards into one section per category', async () => {
  const iframe = await loadIframe('/catalog/index.html');
  const doc = iframe.contentDocument;
  const sections = [...doc.querySelectorAll('[data-landing] > section')];
  expect(
    sections.map((section) => section.querySelector('h2').textContent.trim()),
  ).toEqual(categories.map(({ name }) => name));

  for (const [index, { name, components: group }] of categories.entries()) {
    const cards = [...sections[index].querySelectorAll('a')];
    expect(cards.length, name).toBe(group.length);
    expect(
      cards.map((card) => card.getAttribute('href')),
      name,
    ).toEqual(group.map(({ tag }) => `./${tag}.html`));
  }
  expect(doc.querySelectorAll('[data-landing] h3').length).toBe(
    components.length,
  );
});

test('landing page renders the sidebar grouped by category and one card per component', async () => {
  const iframe = await loadIframe('/catalog/index.html');
  const doc = iframe.contentDocument;
  expect(doc.querySelector('.brand').textContent.trim()).toBe('yk-elements');

  const groups = [...doc.querySelectorAll('nav section')].map((section) => ({
    name: section.querySelector('h2').textContent.trim(),
    labels: [...section.querySelectorAll('a')].map((link) =>
      link.textContent.trim(),
    ),
  }));
  expect(groups).toEqual(
    categories.map(({ name, components: group }) => ({
      name,
      labels: group.map(({ tag }) => `<${tag}>`),
    })),
  );

  const labels = [...doc.querySelectorAll('nav a')].map((link) =>
    link.textContent.trim(),
  );
  expect(labels).toEqual(['Overview', ...tags.map((tag) => `<${tag}>`)]);
  expect(doc.querySelectorAll('[data-landing] a').length).toBe(
    components.length,
  );
  expect(
    doc.querySelector('nav a[aria-current="page"]').textContent.trim(),
  ).toBe('Overview');
});

test('catalog chrome dogfoods the library components', async () => {
  const landing = await loadIframe('/catalog/index.html');
  const landingDoc = landing.contentDocument;
  expect(landingDoc.querySelector('[data-landing]').tagName).toBe('YK-VSTACK');
  expect(landingDoc.querySelectorAll('[data-landing] yk-grid').length).toBe(
    categories.length,
  );
  expect(landingDoc.querySelector('[data-sidebar] yk-vstack')).not.toBeNull();
  expect(landingDoc.querySelector('[data-landing] a yk-vstack')).not.toBeNull();
  expect(landingDoc.querySelector('[data-tokens] yk-vstack')).not.toBeNull();

  for (const tag of tags) {
    const iframe = await loadIframe(`/catalog/${tag}.html`);
    const doc = iframe.contentDocument;
    expect(
      doc.querySelector('[data-component-header] yk-vstack'),
    ).not.toBeNull();
    expect(doc.querySelector('[data-interface] yk-vstack')).not.toBeNull();
    const variations = [...doc.querySelectorAll('figure')];
    expect(variations.length).toBeGreaterThan(0);
    for (const variation of variations) {
      expect(variation.querySelector('yk-pad').tagName).toBe('YK-PAD');
    }
  }
});

test('each component page renders the sidebar with its own entry active and a header', async () => {
  for (const tag of tags) {
    const iframe = await loadIframe(`/catalog/${tag}.html`);
    const doc = iframe.contentDocument;
    expect(
      doc.querySelector('nav a[aria-current="page"]').textContent.trim(),
      tag,
    ).toBe(`<${tag}>`);
    expect(
      doc.querySelector('[data-component-header] h1').textContent.trim(),
      tag,
    ).toBe(`<${tag}>`);
    expect(doc.querySelector('.description').textContent.trim(), tag).not.toBe(
      '',
    );
    expect(doc.querySelector('[data-landing]'), tag).toBeNull();
  }
});

test('overview page renders the design tokens section', async () => {
  const iframe = await loadIframe('/catalog/index.html');
  const doc = iframe.contentDocument;
  const section = doc.querySelector('[data-tokens]');
  expect(section).not.toBeNull();

  const rows = [...section.querySelectorAll('tbody tr')];
  expect(rows.length).toBe(tokens.length);

  const names = rows.map((row) =>
    row.querySelector('.property-name').textContent.trim(),
  );
  for (const { name } of tokens) {
    expect(names).toContain(name);
  }

  const ids = rows.map((row) => row.querySelector('.property-name').id);
  expect(ids).toEqual(tokens.map(({ name }) => name.slice(2)));
});

test('each component page renders its declared interface', async () => {
  for (const { tag, cssProperties, attributes } of components) {
    const iframe = await loadIframe(`/catalog/${tag}.html`);
    const doc = iframe.contentDocument;
    const section = doc.querySelector('[data-interface]');
    expect(section, tag).not.toBeNull();

    const rows = [
      ...section.querySelectorAll('[data-table="properties"] tbody tr'),
    ];
    expect(rows.length, tag).toBe(cssProperties.length);

    const names = rows.map((row) =>
      row.querySelector('.property-name').textContent.trim(),
    );
    for (const { name } of cssProperties) {
      expect(names, tag).toContain(name);
    }

    const attributeTables = section.querySelectorAll(
      '[data-table="attributes"]',
    );
    expect(attributeTables.length, tag).toBe(attributes.length);

    for (const [
      index,
      { name, default: fallback },
    ] of cssProperties.entries()) {
      const row = rows[index];
      const hrefs = [...row.querySelectorAll('.property-default a')].map(
        (link) => link.getAttribute('href'),
      );
      const expected = [];
      for (const token of tokens) {
        const count = fallback.split(token.name).length - 1;
        for (let i = 0; i < count; i += 1) {
          expected.push(`./index.html#${token.name.slice(2)}`);
        }
      }
      expect(hrefs.sort(), `${tag} ${name}`).toEqual(expected.sort());
    }
  }
});

test('library entry point and tokens load successfully', async () => {
  await import('/index.js');
  expect(customElements.get('yk-vstack')).toBeDefined();
  expect(customElements.get('yk-hstack')).toBeDefined();
  expect(customElements.get('yk-cluster')).toBeDefined();
  expect(customElements.get('yk-grid')).toBeDefined();
  expect(customElements.get('yk-pad')).toBeDefined();
  expect(customElements.get('yk-button')).toBeDefined();
  expect(customElements.get('yk-link')).toBeDefined();
  expect(customElements.get('yk-badge')).toBeDefined();
  expect(customElements.get('yk-input-text')).toBeDefined();
  expect(customElements.get('yk-input-email')).toBeDefined();
  expect(customElements.get('yk-input-tel')).toBeDefined();
  expect(customElements.get('yk-input-url')).toBeDefined();
  expect((await fetch('/tokens.css')).ok).toBe(true);
});
