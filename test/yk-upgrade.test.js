// @ts-check
import { afterEach, expect, test } from 'vitest';

afterEach(() => {
  document.body.replaceChildren();
});

test('applies property writes made before the module upgrades the elements', async () => {
  const button = document.createElement('yk-button');
  button.type = 'submit';
  button.disabled = true;
  const link = document.createElement('yk-link');
  link.href = '/pre-upgrade';
  link.rel = 'noopener';
  const input = document.createElement('yk-input-text');
  input.value = 'pre-upgrade';
  input.placeholder = 'Type here';
  input.required = true;
  document.body.append(button, link, input);

  await Promise.all([
    import('../src/components/yk-button.js'),
    import('../src/components/yk-link.js'),
    import('../src/components/yk-input-text.js'),
  ]);

  expect(button.getAttribute('type')).toBe('submit');
  expect(button.getAttribute('disabled')).toBe('');
  expect(button.shadowRoot.querySelector('button').disabled).toBe(true);
  expect(button.shadowRoot.querySelector('button').type).toBe('submit');
  expect(link.getAttribute('href')).toBe('/pre-upgrade');
  expect(link.getAttribute('rel')).toBe('noopener');
  expect(link.shadowRoot.querySelector('a').getAttribute('href')).toBe(
    '/pre-upgrade',
  );
  expect(input.shadowRoot.querySelector('input').value).toBe('pre-upgrade');
  expect(input.getAttribute('placeholder')).toBe('Type here');
  expect(
    input.shadowRoot.querySelector('input').getAttribute('placeholder'),
  ).toBe('Type here');
  expect(input.shadowRoot.querySelector('input').required).toBe(true);
});
