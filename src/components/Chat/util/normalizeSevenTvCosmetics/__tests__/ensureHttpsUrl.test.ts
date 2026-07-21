import { ensureHttpsUrl } from '../ensureHttpsUrl';

test('prefixes https on protocol-relative urls', () => {
  expect(ensureHttpsUrl('//cdn.7tv.app/badge/x/4x.webp')).toBe(
    'https://cdn.7tv.app/badge/x/4x.webp',
  );
});

test('passes https urls through unchanged', () => {
  expect(ensureHttpsUrl('https://cdn.7tv.app/badge/x/4x.webp')).toBe(
    'https://cdn.7tv.app/badge/x/4x.webp',
  );
});

test('upgrades http to https regardless of case', () => {
  expect(ensureHttpsUrl('http://cdn.7tv.app/badge/x/4x.webp')).toBe(
    'https://cdn.7tv.app/badge/x/4x.webp',
  );
  expect(ensureHttpsUrl('HTTP://cdn.7tv.app/badge/x/4x.webp')).toBe(
    'https://cdn.7tv.app/badge/x/4x.webp',
  );
});

test('rejects non-http schemes', () => {
  expect(ensureHttpsUrl('file:///etc/passwd')).toBe('');
  expect(ensureHttpsUrl('data:image/png;base64,AAAA')).toBe('');
  expect(ensureHttpsUrl('javascript://badge/x.png')).toBe('');
});
