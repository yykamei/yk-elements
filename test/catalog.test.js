// @ts-check
import { expect, test } from 'vitest';

async function fetchCatalogHtml() {
  const res = await fetch('/catalog/index.html');
  expect(res.ok).toBe(true);
  return new DOMParser().parseFromString(await res.text(), 'text/html');
}

test('catalog references the library entry point and tokens', async () => {
  const doc = await fetchCatalogHtml();

  expect(
    doc.querySelector('script[type="module"][src="../index.js"]'),
  ).not.toBeNull();
  expect(
    doc.querySelector('link[rel="stylesheet"][href="../tokens.css"]'),
  ).not.toBeNull();
});

test('catalog shows the yk-vstack section with three variations', async () => {
  const doc = await fetchCatalogHtml();
  const section = doc.querySelector('#yk-vstack');

  expect(section).not.toBeNull();
  expect(section.querySelectorAll('.catalog__variation').length).toBe(3);
});

test('catalog shows the yk-hstack section with two variations', async () => {
  const doc = await fetchCatalogHtml();
  const section = doc.querySelector('#yk-hstack');

  expect(section).not.toBeNull();
  expect(section.querySelectorAll('.catalog__variation').length).toBe(2);
});

test('catalog shows the yk-cluster section with two variations', async () => {
  const doc = await fetchCatalogHtml();
  const section = doc.querySelector('#yk-cluster');

  expect(section).not.toBeNull();
  expect(section.querySelectorAll('.catalog__variation').length).toBe(2);
});

test('library entry point and tokens load successfully', async () => {
  await import('/index.js');
  expect(customElements.get('yk-vstack')).toBeDefined();
  expect(customElements.get('yk-hstack')).toBeDefined();
  expect(customElements.get('yk-cluster')).toBeDefined();
  expect((await fetch('/tokens.css')).ok).toBe(true);
});
