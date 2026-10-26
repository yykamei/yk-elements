// @ts-check
import { afterEach, expect, test } from 'vitest';
import '../src/layout/yk-vstack.js';
import '../src/components/yk-button.js';
import { ensureShadow } from '../src/dsd.js';

afterEach(() => {
  document.body.replaceChildren();
});

test('creates a shadow root with rendered content when none exists', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);

  const root = ensureShadow(host, {
    render: (shadow) => {
      shadow.innerHTML = '<slot></slot>';
    },
  });

  expect(root).toBe(host.shadowRoot);
  expect(root.querySelector('slot')).not.toBeNull();
});

test('reuses a declarative shadow root instead of replacing it', () => {
  const container = document.createElement('div');
  container.setHTMLUnsafe(
    '<yk-vstack><template shadowrootmode="open"><slot></slot></template><p>hi</p></yk-vstack>',
  );
  document.body.appendChild(container);
  const host = container.querySelector('yk-vstack');

  expect(host.shadowRoot.querySelectorAll('slot').length).toBe(1);
  expect(host.shadowRoot.adoptedStyleSheets.length).toBe(1);
  expect(host.querySelector('p').assignedSlot).not.toBeNull();
});

test('hydrates a declarative button without duplicating it and keeps form behavior', () => {
  const container = document.createElement('div');
  container.setHTMLUnsafe(
    '<form><yk-button type="submit"><template shadowrootmode="open" shadowrootdelegatesfocus><button part="button" type="button"><slot></slot></button></template>Save</yk-button></form>',
  );
  document.body.appendChild(container);
  const host = container.querySelector('yk-button');
  const form = container.querySelector('form');
  let submitted = false;
  form.addEventListener('submit', (event) => {
    submitted = true;
    event.preventDefault();
  });

  const buttons = host.shadowRoot.querySelectorAll('button');
  expect(buttons.length).toBe(1);
  expect(host.shadowRoot.delegatesFocus).toBe(true);
  expect(host.shadowRoot.adoptedStyleSheets.length).toBe(2);
  expect(host.shadowRoot.querySelector('button').type).toBe('submit');

  host.shadowRoot.querySelector('button').click();
  expect(submitted).toBe(true);
});
