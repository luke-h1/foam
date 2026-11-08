import { clearSessionCache } from '@app/store/chat/actions/chat-color-caches';
import { getFallbackSenderColor } from '@app/utils/chat/getFallbackSenderColor';
import { resolveCachedSenderColor } from '@app/utils/chat/resolve-cached-sender-color/resolveCachedSenderColor';
import { lightenColor } from '@app/utils/color/lightenColor';

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

    expect(color).toBe(lightenColor('#FF0000'));
  });

  test('uses injected sender color lookup before deterministic fallback', () => {
    const color = resolveCachedSenderColor(
      {
        sender: 'viewer',
        userstate: { username: 'Viewer', login: 'viewer' },
      },
      () => '#1ac9a2',
    );

    expect(color).toBe(lightenColor('#1ac9a2'));
  });

  test('falls back to the palette colour of the login, not the display name', () => {
    const message: SenderColorMessage = {
      sender: 'Aleksim64',
      userstate: { username: 'ＡＬＥＫＳＩＭ', login: 'aleksim64' },
    };

    expect(resolveCachedSenderColor(message)).toBe(
      lightenColor(getFallbackSenderColor('aleksim64')),
    );
  });
});
