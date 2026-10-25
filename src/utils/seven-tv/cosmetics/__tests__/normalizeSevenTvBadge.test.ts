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
});
