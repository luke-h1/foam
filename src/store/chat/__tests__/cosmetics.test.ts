import { storageService } from '@app/lib/storage';
import { sevenTvService } from '@app/services/seventv-service';
import { requestUserCosmeticsViaPresence } from '@app/store/chat/actions/cosmetics';
import { getSevenTvSessionId } from '@app/utils/seventv/sevenTvSessionId';

jest.mock('@app/services/seventv-service', () => ({
  sevenTvService: {
    get7tvUserId: jest.fn(),
    getUserCosmeticsGql: jest.fn(),
    sendPresence: jest.fn(() => Promise.resolve()),
  },
  clearSevenTvUserIdCache: jest.fn(),
}));

jest.mock('@app/utils/seventv/sevenTvSessionId', () => ({
  getSevenTvSessionId: jest.fn(),
}));

jest.mock('@app/lib/storage', () => ({
  storageService: {
    getString: jest.fn(() => null),
    set: jest.fn(),
    clearNamespace: jest.fn(),
  },
}));

jest.mock('@app/store/chat/observables/chatStore', () => ({
  chatStore$: {
    currentChannelId: { peek: jest.fn(() => 'channel-1') },
  },
}));

jest.mock('@app/store/chat/observables/cosmeticsPersistence', () => ({
  writePersistedCosmetics: jest.fn(),
}));

jest.mock('@app/utils/logger', () => ({
  logger: {
    stv: { warn: jest.fn() },
    stvWs: {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
  },
}));

const mockGet7tvUserId = jest.mocked(sevenTvService.get7tvUserId);
const mockGetUserCosmeticsGql = jest.mocked(sevenTvService.getUserCosmeticsGql);
const mockSendPresence = jest.mocked(sevenTvService.sendPresence);
const mockGetSessionId = jest.mocked(getSevenTvSessionId);
const mockGetString = jest.mocked(storageService.getString);

describe('requestUserCosmeticsViaPresence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet7tvUserId.mockResolvedValue('7tv-user-1');
    mockGetUserCosmeticsGql.mockResolvedValue(null);
    mockGetString.mockReturnValue(null);
  });

  test('writes a passive presence for the chatter when a session is live', async () => {
    mockGetSessionId.mockReturnValue('session-1');

    await requestUserCosmeticsViaPresence('ttv-1');

    expect(mockGet7tvUserId.mock.calls).toEqual([['ttv-1']]);
    expect(mockSendPresence.mock.calls).toEqual([
      ['channel-1', '7tv-user-1', { passive: true, sessionId: 'session-1' }],
    ]);
    expect(mockGetUserCosmeticsGql).not.toHaveBeenCalled();
  });

  test('falls back to the GQL fetch when there is no live session', async () => {
    mockGetSessionId.mockReturnValue(null);

    await requestUserCosmeticsViaPresence('ttv-1');

    expect(mockSendPresence).not.toHaveBeenCalled();
    expect(mockGetUserCosmeticsGql.mock.calls).toEqual([['7tv-user-1']]);
  });

  test('does nothing when the Twitch id cannot be resolved to a 7TV user', async () => {
    mockGet7tvUserId.mockResolvedValue('');
    mockGetSessionId.mockReturnValue('session-1');

    await requestUserCosmeticsViaPresence('ttv-1');

    expect(mockSendPresence).not.toHaveBeenCalled();
    expect(mockGetUserCosmeticsGql).not.toHaveBeenCalled();
  });
});
