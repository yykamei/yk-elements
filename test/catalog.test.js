// @ts-check
import { afterEach, expect, test, vi } from 'vitest';
import { components } from '../catalog/catalog.js';

const VARIATIONS = {
  'yk-vstack': 3,
  'yk-hstack': 2,
  'yk-cluster': 2,
  'yk-grid': 2,
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
  expect(doc.querySelectorAll('.catalog__navLink').length).toBeGreaterThan(0);
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
  const labels = [...doc.querySelectorAll('.catalog__navLink')].map((link) =>
    link.textContent.trim(),
  );
  expect(labels).toEqual(['Overview', ...tags.map((tag) => `<${tag}>`)]);
  expect(doc.querySelectorAll('.catalog__card').length).toBe(components.length);
  expect(
    doc.querySelector('.catalog__navLink--active').textContent.trim(),
  ).toBe('Overview');
});

test('each component page renders the sidebar with its own entry active and a header', async () => {
  for (const tag of tags) {
    const iframe = await loadIframe(`/catalog/${tag}.html`);
    const doc = iframe.contentDocument;
    expect(
      doc.querySelector('.catalog__navLink--active').textContent.trim(),
      tag,
    ).toBe(`<${tag}>`);
    expect(
      doc.querySelector('.catalog__componentTitle').textContent.trim(),
      tag,
    ).toBe(`<${tag}>`);
    expect(
      doc.querySelector('.catalogDescription').textContent.trim(),
      tag,
    ).not.toBe('');
    expect(doc.querySelector('[data-landing]'), tag).toBeNull();
  }
});

test('library entry point and tokens load successfully', async () => {
  await import('/index.js');
  expect(customElements.get('yk-vstack')).toBeDefined();
  expect(customElements.get('yk-hstack')).toBeDefined();
  expect(customElements.get('yk-cluster')).toBeDefined();
  expect(customElements.get('yk-grid')).toBeDefined();
  expect((await fetch('/tokens.css')).ok).toBe(true);
});
