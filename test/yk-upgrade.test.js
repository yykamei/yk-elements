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
  const url = document.createElement('yk-input-url');
  url.value = 'https://example.com/pre-upgrade';
  url.required = true;
  const password = document.createElement('yk-input-password');
  password.value = 'pre-upgrade-pass';
  password.required = true;
  password.autocomplete = 'current-password';
  password.inputMode = 'numeric';
  const search = document.createElement('yk-input-search');
  search.value = 'pre-upgrade query';
  search.required = true;
  const file = document.createElement('yk-input-file');
  file.accept = 'image/png';
  file.multiple = true;
  file.required = true;
  const checkbox = document.createElement('yk-input-checkbox');
  checkbox.value = 'yes';
  checkbox.checked = true;
  checkbox.required = true;
  checkbox.disabled = true;
  checkbox.indeterminate = true;
  const switchedCheckbox = document.createElement('yk-input-checkbox');
  switchedCheckbox.switch = true;
  const declaredCheckbox = document.createElement('yk-input-checkbox');
  declaredCheckbox.setAttribute('indeterminate', '');
  document.body.append(
    button,
    link,
    input,
    email,
    tel,
    url,
    password,
    search,
    file,
    checkbox,
    switchedCheckbox,
    declaredCheckbox,
  );

  await Promise.all([
    import('../src/components/yk-button.js'),
    import('../src/components/yk-link.js'),
    import('../src/components/yk-input-text.js'),
    import('../src/components/yk-input-email.js'),
    import('../src/components/yk-input-tel.js'),
    import('../src/components/yk-input-url.js'),
    import('../src/components/yk-input-password.js'),
    import('../src/components/yk-input-search.js'),
    import('../src/components/yk-input-file.js'),
    import('../src/components/yk-input-checkbox.js'),
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
  expect(url.shadowRoot.querySelector('input').type).toBe('url');
  expect(url.shadowRoot.querySelector('input').value).toBe(
    'https://example.com/pre-upgrade',
  );
  expect(url.shadowRoot.querySelector('input').required).toBe(true);
  expect(password.shadowRoot.querySelector('input').type).toBe('password');
  expect(password.shadowRoot.querySelector('input').value).toBe(
    'pre-upgrade-pass',
  );
  expect(password.shadowRoot.querySelector('input').required).toBe(true);
  expect(password.getAttribute('autocomplete')).toBe('current-password');
  expect(
    password.shadowRoot.querySelector('input').getAttribute('autocomplete'),
  ).toBe('current-password');
  expect(password.getAttribute('inputmode')).toBe('numeric');
  expect(
    password.shadowRoot.querySelector('input').getAttribute('inputmode'),
  ).toBe('numeric');
  expect(search.shadowRoot.querySelector('input').type).toBe('search');
  expect(search.shadowRoot.querySelector('input').value).toBe(
    'pre-upgrade query',
  );
  expect(search.shadowRoot.querySelector('input').required).toBe(true);
  expect(file.shadowRoot.querySelector('input').type).toBe('file');
  expect(file.getAttribute('accept')).toBe('image/png');
  expect(file.shadowRoot.querySelector('input').getAttribute('accept')).toBe(
    'image/png',
  );
  expect(file.shadowRoot.querySelector('input').multiple).toBe(true);
  expect(file.shadowRoot.querySelector('input').required).toBe(true);
  expect(checkbox.shadowRoot.querySelector('input').type).toBe('checkbox');
  expect(checkbox.shadowRoot.querySelector('input').value).toBe('yes');
  expect(checkbox.shadowRoot.querySelector('input').checked).toBe(true);
  expect(checkbox.shadowRoot.querySelector('input').required).toBe(true);
  expect(checkbox.shadowRoot.querySelector('input').indeterminate).toBe(true);
  expect(checkbox.hasAttribute('indeterminate')).toBe(true);
  expect(switchedCheckbox.hasAttribute('switch')).toBe(true);
  expect(
    switchedCheckbox.shadowRoot.querySelector('input').hasAttribute('switch'),
  ).toBe(true);
  expect(
    switchedCheckbox.shadowRoot.querySelector('input').getAttribute('role'),
  ).toBe('switch');
  expect(checkbox.getAttribute('disabled')).toBe('');
  expect(checkbox.shadowRoot.querySelector('input').disabled).toBe(true);
  expect(declaredCheckbox.hasAttribute('indeterminate')).toBe(true);
  expect(declaredCheckbox.shadowRoot.querySelector('input').indeterminate).toBe(
    true,
  );
});
