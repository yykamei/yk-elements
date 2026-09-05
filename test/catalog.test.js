// @ts-check
import { afterEach, expect, test, vi } from 'vitest';
import { components, tokens } from '../catalog/catalog.js';

const VARIATIONS = {
  'yk-vstack': 3,
  'yk-hstack': 2,
  'yk-cluster': 15,
  'yk-grid': 2,
  'yk-pad': 4,
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
  await vi.waitFor(() => {
    expect(iframe.contentWindow.location.pathname.endsWith('/')).toBe(true);
  });
  const doc = iframe.contentDocument;
  expect(doc.querySelector('.catalog__brand').textContent.trim()).toBe(
    'yk-elements',
  );
  expect(doc.querySelectorAll('.catalog__nav-link').length).toBeGreaterThan(0);
});

test('each component page declares its component and lists its variations', async () => {
  for (const { tag } of components) {
    const variations = VARIATIONS[tag];
    expect(variations, tag).toBeDefined();
    const doc = await fetchHtml(`/catalog/${tag}.html`);
    expect(doc.body.dataset.component).toBe(tag);
    expect(doc.querySelector('[data-component-header]')).not.toBeNull();
    expect(doc.querySelectorAll('.catalog__variation').length).toBe(variations);
  }
});

test('landing page renders the sidebar and one card per component', async () => {
  const iframe = await loadIframe('/catalog/index.html');
  const doc = iframe.contentDocument;
  expect(doc.querySelector('.catalog__brand').textContent.trim()).toBe(
    'yk-elements',
  );
  const labels = [...doc.querySelectorAll('.catalog__nav-link')].map((link) =>
    link.textContent.trim(),
  );
  expect(labels).toEqual(['Overview', ...tags.map((tag) => `<${tag}>`)]);
  expect(doc.querySelectorAll('.catalog__card').length).toBe(components.length);
  expect(
    doc.querySelector('.catalog__nav-link.is-active').textContent.trim(),
  ).toBe('Overview');
});

test('catalog chrome dogfoods the library components', async () => {
  const landing = await loadIframe('/catalog/index.html');
  const landingDoc = landing.contentDocument;
  expect(landingDoc.querySelector('[data-landing]').tagName).toBe('YK-GRID');
  expect(landingDoc.querySelector('[data-sidebar] yk-vstack')).not.toBeNull();
  expect(landingDoc.querySelector('.catalog__card yk-vstack')).not.toBeNull();
  expect(landingDoc.querySelector('[data-tokens] yk-vstack')).not.toBeNull();

  for (const tag of tags) {
    const iframe = await loadIframe(`/catalog/${tag}.html`);
    const doc = iframe.contentDocument;
    expect(
      doc.querySelector('[data-component-header] yk-vstack'),
    ).not.toBeNull();
    expect(doc.querySelector('[data-interface] yk-vstack')).not.toBeNull();
    const variations = [...doc.querySelectorAll('.catalog__variation')];
    expect(variations.length).toBeGreaterThan(0);
    for (const variation of variations) {
      expect(variation.querySelector('.catalog__demo').tagName).toBe('YK-PAD');
    }
  }
});

test('each component page renders the sidebar with its own entry active and a header', async () => {
  for (const tag of tags) {
    const iframe = await loadIframe(`/catalog/${tag}.html`);
    const doc = iframe.contentDocument;
    expect(
      doc.querySelector('.catalog__nav-link.is-active').textContent.trim(),
      tag,
    ).toBe(`<${tag}>`);
    expect(
      doc.querySelector('.catalog__component-title').textContent.trim(),
      tag,
    ).toBe(`<${tag}>`);
    expect(
      doc.querySelector('.catalog-description').textContent.trim(),
      tag,
    ).not.toBe('');
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
    row.querySelector('.catalog__property-name').textContent.trim(),
  );
  for (const { name } of tokens) {
    expect(names).toContain(name);
  }

  const ids = rows.map(
    (row) => row.querySelector('.catalog__property-name').id,
  );
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
      row.querySelector('.catalog__property-name').textContent.trim(),
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
      const hrefs = [
        ...row.querySelectorAll('.catalog__property-default a'),
      ].map((link) => link.getAttribute('href'));
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
  expect((await fetch('/tokens.css')).ok).toBe(true);
});
