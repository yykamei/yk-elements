// @ts-check
import { afterEach, expect, test } from 'vitest';

afterEach(() => {
  document.querySelectorAll('iframe').forEach((frame) => {
    frame.remove();
  });
  // The hydrated theme switcher is not ephemeral, so its choice would leak
  // into later tests through the shared store (see catalog.test.js).
  localStorage.removeItem('yk-theme');
});

function loadIframe(path) {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.src = path;
    iframe.style.cssText = 'display: none';
    iframe.addEventListener('load', () => resolve(iframe));
    iframe.addEventListener('error', () =>
      reject(new Error(`failed to load ${path}`)),
    );
    document.body.appendChild(iframe);
  });
}

// Expected hydration per generated snippet: the tag, how many stylesheets
// the component adopts, a shadow node that only exists when the declarative
// template was reused (the fresh path never creates `<style>` elements),
// and whether the template must delegate focus.
const DEMOS = [
  { tag: 'yk-vstack', sheets: 1, controls: 'slot', count: 1 },
  { tag: 'yk-hstack', sheets: 1, controls: 'slot', count: 1 },
  { tag: 'yk-cluster', sheets: 1, controls: 'slot', count: 1 },
  { tag: 'yk-grid', sheets: 1, controls: 'slot', count: 1 },
  { tag: 'yk-pad', sheets: 1, controls: 'slot', count: 1 },
  { tag: 'yk-container', sheets: 1, controls: 'slot', count: 1 },
  {
    tag: 'yk-button',
    sheets: 2,
    controls: 'button[part="button"]',
    count: 1,
    delegatesFocus: true,
  },
  {
    tag: 'yk-link',
    sheets: 2,
    controls: 'a[part="link"]',
    count: 1,
    delegatesFocus: true,
  },
  { tag: 'yk-badge', sheets: 1, controls: 'slot', count: 1 },
  { tag: 'yk-card', sheets: 1, controls: 'slot', count: 3 },
  {
    tag: 'yk-field-list-item',
    sheets: 1,
    controls: 'button[part="remove"]',
    count: 1,
    also: [['[part="content"] slot', 1]],
  },
  {
    tag: 'yk-alert',
    sheets: 1,
    controls: 'button[part="dismiss"]',
    count: 1,
    also: [['button[part="dismiss"] svg', 1]],
  },
  {
    tag: 'yk-dialog',
    sheets: 1,
    controls: 'dialog[part="dialog"]',
    count: 1,
    also: [['button[part="close"]', 1]],
  },
  {
    tag: 'yk-progress',
    sheets: 1,
    controls: 'progress[part="progress"]',
    count: 1,
  },
  {
    tag: 'yk-audio',
    sheets: 1,
    controls: 'audio',
    count: 1,
    also: [
      ['button[part="play"] svg', 2],
      ['[part="timeline"]', 1],
      ['[part="time"]', 1],
    ],
  },
  {
    tag: 'yk-theme-switcher',
    sheets: 1,
    controls: 'input[type="radio"]',
    count: 3,
    also: [['[part="option"]', 3]],
  },
  {
    tag: 'yk-input-text',
    sheets: 1,
    controls: 'input[part="input"]',
    count: 1,
    delegatesFocus: true,
  },
  {
    tag: 'yk-input-email',
    sheets: 1,
    controls: 'input[part="input"]',
    count: 1,
    delegatesFocus: true,
  },
  {
    tag: 'yk-input-tel',
    sheets: 1,
    controls: 'input[part="input"]',
    count: 1,
    delegatesFocus: true,
  },
  {
    tag: 'yk-input-url',
    sheets: 1,
    controls: 'input[part="input"]',
    count: 1,
    delegatesFocus: true,
  },
  {
    tag: 'yk-input-password',
    sheets: 1,
    controls: 'input[part="input"]',
    count: 1,
    delegatesFocus: true,
  },
  {
    tag: 'yk-input-search',
    sheets: 1,
    controls: 'input[part="input"]',
    count: 1,
    delegatesFocus: true,
  },
  {
    tag: 'yk-input-file',
    sheets: 2,
    controls: 'input[part="input"]',
    count: 1,
    delegatesFocus: true,
    also: [['[part="dropzone"]', 1]],
  },
  {
    tag: 'yk-input-checkbox',
    sheets: 1,
    controls: 'input[part="input"]',
    count: 1,
    delegatesFocus: true,
    also: [['label[part="label"]', 1]],
  },
  {
    tag: 'yk-textarea',
    sheets: 1,
    controls: 'textarea[part="textarea"]',
    count: 1,
    delegatesFocus: true,
  },
  {
    tag: 'yk-select',
    sheets: 2,
    controls: 'select[part="select"]',
    count: 1,
    delegatesFocus: true,
    also: [['[part="arrow"]', 1]],
  },
  {
    tag: 'yk-combobox',
    sheets: 1,
    controls: 'input[part="input"]',
    count: 1,
    delegatesFocus: true,
    also: [
      ['[part="field"]', 1],
      ['[part="popup"]', 1],
    ],
  },
];

test('every generated snippet hydrates its declarative root', async () => {
  const iframe = await loadIframe('/docs/dsd.html');
  const doc = iframe.contentDocument;

  for (const { tag, sheets, controls, count, delegatesFocus, also } of DEMOS) {
    const host = doc.querySelector(`[data-demo="${tag}"] ${tag}`);
    expect(host, tag).not.toBeNull();
    expect(host.shadowRoot.querySelector('style'), tag).not.toBeNull();
    expect(host.shadowRoot.adoptedStyleSheets.length, tag).toBe(sheets);
    expect(host.shadowRoot.querySelectorAll(controls).length, tag).toBe(count);
    // delegatesFocus is fixed at parse time, so a wrong template is
    // unrecoverable at upgrade: assert both directions.
    expect(host.shadowRoot.delegatesFocus, tag).toBe(!!delegatesFocus);
    for (const [selector, expected] of also ?? []) {
      expect(
        host.shadowRoot.querySelectorAll(selector).length,
        `${tag} ${selector}`,
      ).toBe(expected);
    }
  }
});

test('generated snippets carry working attribute mirrors', async () => {
  const iframe = await loadIframe('/docs/dsd.html');
  const doc = iframe.contentDocument;

  const select = doc.querySelector('[data-demo="yk-select"] yk-select');
  expect(select.value).toBe('noun');

  const input = doc.querySelector('[data-demo="yk-input-text"] yk-input-text');
  expect(input.shadowRoot.querySelector('input').value).toBe('prefill');

  const progress = doc.querySelector('[data-demo="yk-progress"] yk-progress');
  expect(progress.shadowRoot.querySelector('progress').value).toBe(40);

  const item = doc.querySelector(
    '[data-demo="yk-field-list-item"] yk-field-list-item',
  );
  expect(
    item.shadowRoot
      .querySelector('button[part="remove"]')
      .getAttribute('aria-label'),
  ).toBe('Remove this row');
});
