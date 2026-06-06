import { getUserMessageColor } from '@app/store/chatStore/messages';
import { clearSessionCache } from '@app/store/chatStore/chatColorCaches';
import { resolveCachedSenderColor } from '../resolveCachedSenderColor';

jest.mock('@app/store/chatStore/messages', () => ({
  getUserMessageColor: jest.fn(),
}));

const mockGetUserMessageColor = jest.mocked(getUserMessageColor);

describe('resolveCachedSenderColor', () => {
  beforeEach(() => {
    mockGetUserMessageColor.mockReturnValue(undefined);
    clearSessionCache();
  });

  test('returns existing cached color', () => {
    expect(
      resolveCachedSenderColor({
        cachedSenderColor: 'rgb(255, 0, 0)',
        sender: 'viewer',
        userstate: { username: 'Viewer' },
      } as never),
    ).toBe('rgb(255, 0, 0)');
  });

  test('lightens IRC color tags', () => {
    const color = resolveCachedSenderColor({
      sender: 'viewer',
      userstate: { username: 'Viewer', color: '#FF0000' },
    } as never);

    expect(color).toBe('rgb(255, 0, 0)');
  });

  test('falls back to deterministic twitch palette per username', () => {
    const first = resolveCachedSenderColor({
      sender: 'aleksim64',
      userstate: { username: 'aleksim64', login: 'aleksim64' },
    } as never);
    const second = resolveCachedSenderColor({
      sender: 'aleksim64',
      userstate: { username: 'aleksim64', login: 'aleksim64' },
    } as never);

    expect(first).toBe(second);
    expect(first).toMatch(/^rgb\(/);
  });
});
