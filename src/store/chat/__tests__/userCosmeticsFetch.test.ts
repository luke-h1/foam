import * as cosmetics from '@app/store/chat/actions/cosmetics';
import {
  clearUserCosmeticsCache,
  setUserBadge,
  setUserPaint,
} from '@app/store/chat/actions/cosmetics';
import {
  clearFetchedCosmeticsUsers,
  fetchUserCosmetics,
} from '@app/store/chat/actions/userCosmeticsFetch';
import { logger } from '@app/utils/logger';

let mockRequestUserCosmeticsViaPresence: jest.SpiedFunction<
  typeof cosmetics.requestUserCosmeticsViaPresence
>;

describe('fetchUserCosmetics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearFetchedCosmeticsUsers();
    clearUserCosmeticsCache();
    mockRequestUserCosmeticsViaPresence = jest
      .spyOn(cosmetics, 'requestUserCosmeticsViaPresence')
      .mockResolvedValue(undefined);
    jest.spyOn(logger.stv, 'debug').mockImplementation(() => {});
  });

  test('requests cosmetics via passive presence for visible chatters once', async () => {
    await fetchUserCosmetics('chatter-1');
    await fetchUserCosmetics('chatter-1');

    expect(mockRequestUserCosmeticsViaPresence.mock.calls).toEqual([
      ['chatter-1'],
    ]);
  });

  test('does not refetch users that already have cached paint and renderable badge cosmetics', async () => {
    setUserPaint('cached-user', 'paint-1');
    setUserBadge('cached-user', 'badge-1');

    await fetchUserCosmetics('cached-user');

    expect(mockRequestUserCosmeticsViaPresence).not.toHaveBeenCalled();
  });

  test('does not refetch paint-only users when retryMissingBadge is requested', async () => {
    setUserPaint('paint-only-user', 'paint-1');

    await fetchUserCosmetics('paint-only-user');
    await fetchUserCosmetics('paint-only-user', { retryMissingBadge: true });

    expect(mockRequestUserCosmeticsViaPresence.mock.calls).toEqual([]);
  });

  test('retries a previously fetched user when retryMissingBadge is requested and a badge binding lacks a renderable definition', async () => {
    setUserBadge('retry-user', 'badge-1');
    // getUserBadge always synthesises a renderable url once a badge id is
    // bound, so this forces the one state that path can't produce on its own.
    jest.spyOn(cosmetics, 'getUserBadge').mockReturnValue(undefined);

    await fetchUserCosmetics('retry-user');
    await fetchUserCosmetics('retry-user');
    await fetchUserCosmetics('retry-user', { retryMissingBadge: true });

    expect(mockRequestUserCosmeticsViaPresence.mock.calls).toEqual([
      ['retry-user'],
      ['retry-user'],
    ]);
  });

  test('does not retry users whose cosmetics fetch failed', async () => {
    mockRequestUserCosmeticsViaPresence.mockRejectedValue(
      new Error('presence failed'),
    );

    await fetchUserCosmetics('failed-user');
    await fetchUserCosmetics('failed-user');

    expect(mockRequestUserCosmeticsViaPresence.mock.calls).toEqual([
      ['failed-user'],
    ]);
  });

  test('clearFetchedCosmeticsUsers allows a new session to re-request', async () => {
    await fetchUserCosmetics('chatter-1');
    clearFetchedCosmeticsUsers();
    await fetchUserCosmetics('chatter-1');

    expect(mockRequestUserCosmeticsViaPresence.mock.calls).toEqual([
      ['chatter-1'],
      ['chatter-1'],
    ]);
  });
});
