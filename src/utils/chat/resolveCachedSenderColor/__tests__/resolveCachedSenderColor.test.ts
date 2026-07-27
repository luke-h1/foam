import { clearSessionCache } from '@app/store/chat/actions/chatColorCaches';
import { resolveCachedSenderColor } from '@app/utils/chat/resolveCachedSenderColor';

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

    // Pure red carries little luminance, so it is lifted until it clears 4.5:1
    // against the chat surface.
    expect(color).toBe('rgb(255, 30, 30)');
  });

  test('uses injected sender color lookup before deterministic fallback', () => {
    const color = resolveCachedSenderColor(
      {
        sender: 'viewer',
        userstate: { username: 'Viewer', login: 'viewer' },
      },
      () => '#1ac9a2',
    );

    // Already readable on the chat surface, so it is passed through untouched.
    expect(color).toBe('rgb(26, 201, 162)');
  });

  test('falls back to deterministic twitch palette per username', () => {
    const message: SenderColorMessage = {
      sender: 'aleksim64',
      userstate: { username: 'aleksim64', login: 'aleksim64' },
    };
    const first = resolveCachedSenderColor(message);
    const second = resolveCachedSenderColor(message);

    expect(first).toBe(second);
    // Green is perceptually bright, so this entry already passes untouched.
    expect(first).toBe('rgb(0, 152, 0)');
  });
});
