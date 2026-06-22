import { clearSessionCache } from '@app/store/chat/actions/chatColorCaches';

import { resolveCachedSenderColor } from '../resolveCachedSenderColor';

type SenderColorMessage = Parameters<typeof resolveCachedSenderColor>[0];

describe('resolveCachedSenderColor', () => {
  beforeEach(() => {
    clearSessionCache();
  });

  test('returns existing cached color', () => {
    expect(
      resolveCachedSenderColor({
        cachedSenderColor: 'rgb(255, 0, 0)',
        sender: 'viewer',
        userstate: { username: 'Viewer' },
      }),
    ).toBe('rgb(255, 0, 0)');
  });

  test('lightens IRC color tags', () => {
    const color = resolveCachedSenderColor({
      sender: 'viewer',
      userstate: { username: 'Viewer', color: '#FF0000' },
    });

    // Pure red sits at HSL lightness 0.5; the dark-surface floor is 0.55.
    expect(color).toBe('rgb(255, 26, 26)');
  });

  test('uses injected sender color lookup before deterministic fallback', () => {
    const color = resolveCachedSenderColor(
      {
        sender: 'viewer',
        userstate: { username: 'Viewer', login: 'viewer' },
      },
      () => '#1ac9a2',
    );

    expect(color).toBe('rgb(52, 229, 189)');
  });

  test('falls back to deterministic twitch palette per username', () => {
    const message: SenderColorMessage = {
      sender: 'aleksim64',
      userstate: { username: 'aleksim64', login: 'aleksim64' },
    };
    const first = resolveCachedSenderColor(message);
    const second = resolveCachedSenderColor(message);

    expect(first).toBe(second);
    expect(first).toMatch(/^rgb\(/);
  });
});
