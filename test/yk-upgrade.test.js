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
  const email = document.createElement('yk-input-email');
  email.value = 'pre-upgrade@example.com';
  email.placeholder = 'you@example.com';
  email.required = true;
  email.multiple = true;
  const tel = document.createElement('yk-input-tel');
  tel.value = '090-1234-5678';
  tel.required = true;
  document.body.append(button, link, input, email, tel);

  await Promise.all([
    import('../src/components/yk-button.js'),
    import('../src/components/yk-link.js'),
    import('../src/components/yk-input-text.js'),
    import('../src/components/yk-input-email.js'),
    import('../src/components/yk-input-tel.js'),
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
  expect(email.shadowRoot.querySelector('input').value).toBe(
    'pre-upgrade@example.com',
  );
  expect(email.shadowRoot.querySelector('input').type).toBe('email');
  expect(email.shadowRoot.querySelector('input').multiple).toBe(true);
  expect(email.getAttribute('placeholder')).toBe('you@example.com');
  expect(email.shadowRoot.querySelector('input').required).toBe(true);
  expect(tel.shadowRoot.querySelector('input').type).toBe('tel');
  expect(tel.shadowRoot.querySelector('input').value).toBe('090-1234-5678');
  expect(tel.shadowRoot.querySelector('input').required).toBe(true);
});
