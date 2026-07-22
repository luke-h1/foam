import { normalizeSevenTvBadge } from '../normalizeSevenTvBadge';

describe('normalizeSevenTvBadge', () => {
  test('rewrites legacy websocket badge urls to canonical CDN urls', () => {
    expect(
      normalizeSevenTvBadge({
        id: 'badge-id',
        set: 'badge-id',
        type: '7TV Badge',
        title: 'Badge',
        url: 'https://cdn.7tv.app/badge-id/4x',
        provider: '7tv',
      }).url,
    ).toBe('https://cdn.7tv.app/badge/badge-id/4x.webp');
  });

  test('prefixes https on protocol-relative badge urls', () => {
    expect(
      normalizeSevenTvBadge({
        id: 'badge-id',
        set: 'badge-id',
        type: '7TV Badge',
        title: 'Badge',
        url: '//cdn.7tv.app/badge/badge-id/4x.webp',
        provider: '7tv',
      }).url,
    ).toBe('https://cdn.7tv.app/badge/badge-id/4x.webp');
  });

  test('returns the same badge object when the url is already absolute', () => {
    const badge = {
      id: 'badge-id',
      set: 'badge-id',
      type: '7TV Badge' as const,
      title: 'Badge',
      url: 'https://cdn.7tv.app/badge/badge-id/4x.webp',
      provider: '7tv' as const,
    };
    expect(normalizeSevenTvBadge(badge)).toBe(badge);
  });
});
