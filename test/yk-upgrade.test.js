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
  document.body.append(button, link);

  await Promise.all([
    import('../src/components/yk-button.js'),
    import('../src/components/yk-link.js'),
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
});
