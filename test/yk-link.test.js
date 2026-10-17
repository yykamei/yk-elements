// @ts-check
import { afterEach, expect, test } from 'vitest';
import '../src/components/yk-button.js';
import '../src/components/yk-link.js';

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

afterEach(() => {
  document.body.replaceChildren();
  document.documentElement.style.removeProperty('--yk-color-primary');
});

test('self-registers in the custom element registry', () => {
  expect(customElements.get('yk-link')).toBeDefined();
});

test('adopts its core and component stylesheets as constructable CSSStyleSheets', () => {
  const host = document.createElement('yk-link');
  document.body.appendChild(host);

  expect(host.shadowRoot.adoptedStyleSheets.length).toBe(2);
  for (const sheet of host.shadowRoot.adoptedStyleSheets) {
    expect(sheet).toBeInstanceOf(CSSStyleSheet);
  }
});

test('renders an internal anchor that receives the slotted label', async () => {
  const host = document.createElement('yk-link');
  const label = document.createElement('span');
  label.textContent = 'Docs';
  host.append(label);
  document.body.appendChild(host);
  await frame();

  const anchor = host.shadowRoot.querySelector('a');
  expect(anchor).not.toBeNull();
  expect(anchor.getAttribute('part')).toBe('link');
  expect(label.assignedSlot).toBe(anchor.querySelector('slot'));
});

test('mirrors link attributes onto the internal anchor, including later changes', () => {
  const host = document.createElement('yk-link');
  document.body.appendChild(host);

  const anchor = host.shadowRoot.querySelector('a');
  host.setAttribute('href', '/docs');
  host.setAttribute('target', '_blank');
  host.setAttribute('rel', 'noopener');
  host.setAttribute('download', 'docs.pdf');
  expect(anchor.getAttribute('href')).toBe('/docs');
  expect(anchor.getAttribute('target')).toBe('_blank');
  expect(anchor.getAttribute('rel')).toBe('noopener');
  expect(anchor.getAttribute('download')).toBe('docs.pdf');

  host.removeAttribute('href');
  host.removeAttribute('target');
  host.removeAttribute('rel');
  host.removeAttribute('download');
  expect(anchor.hasAttribute('href')).toBe(false);
  expect(anchor.hasAttribute('target')).toBe(false);
  expect(anchor.hasAttribute('rel')).toBe(false);
  expect(anchor.hasAttribute('download')).toBe(false);
});

test('reflects the href property onto the attribute and the internal anchor', () => {
  const host = document.createElement('yk-link');
  document.body.appendChild(host);

  host.href = '/pricing';
  expect(host.getAttribute('href')).toBe('/pricing');
  expect(host.shadowRoot.querySelector('a').getAttribute('href')).toBe(
    '/pricing',
  );
  expect(host.href).toBe('/pricing');
});

test('does not mirror a javascript: href onto the internal anchor', () => {
  const host = document.createElement('yk-link');
  host.setAttribute('href', 'javascript:alert(1)');
  document.body.appendChild(host);

  expect(host.getAttribute('href')).toBe('javascript:alert(1)');
  expect(host.shadowRoot.querySelector('a').hasAttribute('href')).toBe(false);
});

test('does not mirror data: or vbscript: hrefs onto the internal anchor', () => {
  const unsafe = [
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
  ];
  for (const href of unsafe) {
    const host = document.createElement('yk-link');
    host.setAttribute('href', href);
    document.body.appendChild(host);

    expect(host.getAttribute('href'), href).toBe(href);
    expect(host.shadowRoot.querySelector('a').hasAttribute('href'), href).toBe(
      false,
    );
  }
});

test('rejects unsafe schemes hidden by whitespace, tabs, newlines, or case', () => {
  const disguised = [
    ' JaVaScRiPt:alert(1)',
    'java\tscript:alert(1)',
    'java\nscript:alert(1)',
  ];
  for (const href of disguised) {
    const host = document.createElement('yk-link');
    host.setAttribute('href', href);
    document.body.appendChild(host);

    expect(host.shadowRoot.querySelector('a').hasAttribute('href'), href).toBe(
      false,
    );
  }
});

test('drops an href the URL parser cannot parse', () => {
  const host = document.createElement('yk-link');
  host.setAttribute('href', 'http://[');
  document.body.appendChild(host);

  expect(host.getAttribute('href')).toBe('http://[');
  expect(host.shadowRoot.querySelector('a').hasAttribute('href')).toBe(false);
});

test('still mirrors safe hrefs onto the internal anchor', () => {
  const safe = [
    'https://example.com/x',
    '/docs',
    '#section',
    'mailto:a@b.c',
    'tel:+1234567890',
  ];
  for (const href of safe) {
    const host = document.createElement('yk-link');
    host.setAttribute('href', href);
    document.body.appendChild(host);

    expect(host.shadowRoot.querySelector('a').getAttribute('href'), href).toBe(
      href,
    );
  }
});

test('mirrors the href again once an unsafe value becomes safe', () => {
  const host = document.createElement('yk-link');
  document.body.appendChild(host);
  const anchor = host.shadowRoot.querySelector('a');

  host.href = 'javascript:alert(1)';
  expect(anchor.hasAttribute('href')).toBe(false);

  host.setAttribute('href', '/safe');
  expect(anchor.getAttribute('href')).toBe('/safe');

  host.setAttribute('href', 'javascript:alert(1)');
  expect(anchor.hasAttribute('href')).toBe(false);
});

test('shares the default yk-button face', async () => {
  const button = document.createElement('yk-button');
  const link = document.createElement('yk-link');
  document.body.append(button, link);
  await frame();

  const buttonStyle = getComputedStyle(
    button.shadowRoot.querySelector('button'),
  );
  const linkStyle = getComputedStyle(link.shadowRoot.querySelector('a'));
  expect(linkStyle.backgroundColor).toBe(buttonStyle.backgroundColor);
  expect(linkStyle.borderColor).toBe(buttonStyle.borderColor);
  expect(linkStyle.color).toBe(buttonStyle.color);
  expect(linkStyle.textDecorationLine).toBe('none');
});

test('tints the face per variant through the global color token', async () => {
  document.documentElement.style.setProperty(
    '--yk-color-primary',
    'rgb(1, 2, 3)',
  );
  const host = document.createElement('yk-link');
  host.setAttribute('variant', 'primary');
  document.body.appendChild(host);
  await frame();

  expect(
    getComputedStyle(host.shadowRoot.querySelector('a')).backgroundColor,
  ).toBe('rgb(1, 2, 3)');
});

test('clicking never submits an owner form', () => {
  const form = document.createElement('form');
  const host = document.createElement('yk-link');
  host.setAttribute('href', '#never');
  let submitted = false;
  form.addEventListener('submit', (event) => {
    submitted = true;
    event.preventDefault();
  });
  form.append(host);
  document.body.appendChild(form);

  host.shadowRoot.querySelector('a').click();
  expect(submitted).toBe(false);
});
