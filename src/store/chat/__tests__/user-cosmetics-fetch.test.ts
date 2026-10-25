import { sevenTvService } from '@app/services/seven-tv-service';
import * as cosmetics from '@app/store/chat/actions/cosmetics';
import {
  clearUserCosmeticsCache,
  setUserBadge,
  setUserPaint,
} from '@app/store/chat/actions/cosmetics';
import {
  clearFetchedCosmeticsUsers,
  fetchUserCosmetics,
} from '@app/store/chat/actions/user-cosmetics-fetch';
import { chatStore$ } from '@app/store/chat/observables/chat-store';
import { logger } from '@app/utils/logger';
import { setSevenTvSessionId } from '@app/utils/seven-tv/seven-tv-session-id';

let mockGet7tvUserId: jest.SpiedFunction<typeof sevenTvService.get7tvUserId>;
let mockSendPresence: jest.SpiedFunction<typeof sevenTvService.sendPresence>;

describe('fetchUserCosmetics', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    clearFetchedCosmeticsUsers();
    clearUserCosmeticsCache();
    chatStore$.currentChannelId.set('channel-1');
    setSevenTvSessionId('session-1');

    mockGet7tvUserId = jest
      .spyOn(sevenTvService, 'get7tvUserId')
      .mockImplementation(async twitchUserId => `stv-${twitchUserId}`);

    mockSendPresence = jest
      .spyOn(sevenTvService, 'sendPresence')
      .mockResolvedValue(undefined);

    jest.spyOn(logger.stv, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    setSevenTvSessionId(null);
  });

  test('requests cosmetics via passive presence for visible chatters once', async () => {
    await fetchUserCosmetics('chatter-1');
    await fetchUserCosmetics('chatter-1');

    expect(mockSendPresence.mock.calls).toEqual([
      ['channel-1', 'stv-chatter-1', { passive: true, sessionId: 'session-1' }],
    ]);
  });

  test('does not refetch users that already have cached paint and renderable badge cosmetics', async () => {
    setUserPaint('cached-user', 'paint-1');
    setUserBadge('cached-user', 'badge-1');

    await fetchUserCosmetics('cached-user');

    expect(mockGet7tvUserId).not.toHaveBeenCalled();

    expect(mockSendPresence).not.toHaveBeenCalled();
  });

  test('does not refetch paint-only users when retryMissingBadge is requested', async () => {
    setUserPaint('paint-only-user', 'paint-1');

    await fetchUserCosmetics('paint-only-user');
    await fetchUserCosmetics('paint-only-user', { retryMissingBadge: true });

    expect(mockGet7tvUserId).not.toHaveBeenCalled();
  });

  test('retries a previously fetched user when retryMissingBadge is requested and a badge binding lacks a renderable definition', async () => {
    setUserBadge('retry-user', 'badge-1');

    // getUserBadge always synthesises a renderable url once a badge id is
    // bound, so this forces the one state that path can't produce on its own.
    jest.spyOn(cosmetics, 'getUserBadge').mockReturnValue(undefined);

    await fetchUserCosmetics('retry-user');
    await fetchUserCosmetics('retry-user');
    await fetchUserCosmetics('retry-user', { retryMissingBadge: true });

    expect(mockGet7tvUserId.mock.calls).toEqual([
      ['retry-user'],
      ['retry-user'],
    ]);
  });

  test('does not retry users whose cosmetics fetch failed', async () => {
    mockGet7tvUserId.mockRejectedValue(new Error('lookup failed'));

    await fetchUserCosmetics('failed-user');
    await fetchUserCosmetics('failed-user');

    expect(mockGet7tvUserId.mock.calls).toEqual([['failed-user']]);

    expect(mockSendPresence).not.toHaveBeenCalled();
  });

  test('clearFetchedCosmeticsUsers allows a new session to re-request', async () => {
    await fetchUserCosmetics('chatter-1');
    clearFetchedCosmeticsUsers();
    await fetchUserCosmetics('chatter-1');

    expect(mockGet7tvUserId.mock.calls).toEqual([['chatter-1'], ['chatter-1']]);
  });
});
