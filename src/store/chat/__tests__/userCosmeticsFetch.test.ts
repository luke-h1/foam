import {
  getUserBadge,
  getUserBadgeId,
  getUserPaintId,
  requestUserCosmeticsViaPresence,
} from '@app/store/chat/actions/cosmetics';
import {
  clearFetchedCosmeticsUsers,
  fetchUserCosmetics,
} from '@app/store/chat/actions/userCosmeticsFetch';

import { setCachedCosmetics } from './__fixtures__/userCosmeticsFetch.fixture';

jest.mock('@app/store/chat/actions/cosmetics', () => ({
  getUserBadge: jest.fn(),
  getUserBadgeId: jest.fn(),
  getUserPaintId: jest.fn(),
  requestUserCosmeticsViaPresence: jest.fn(() => Promise.resolve()),
}));

jest.mock('@app/utils/logger', () => ({
  logger: {
    stv: { debug: jest.fn() },
  },
}));

const mockGetUserBadge = jest.mocked(getUserBadge);
const mockGetUserBadgeId = jest.mocked(getUserBadgeId);
const mockGetUserPaintId = jest.mocked(getUserPaintId);
const mockRequestUserCosmeticsViaPresence = jest.mocked(
  requestUserCosmeticsViaPresence,
);

describe('fetchUserCosmetics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearFetchedCosmeticsUsers();
    mockGetUserBadge.mockReturnValue(undefined);
    mockGetUserBadgeId.mockReturnValue(undefined);
    mockGetUserPaintId.mockReturnValue(undefined);
    mockRequestUserCosmeticsViaPresence.mockResolvedValue(undefined);
  });

  test('requests cosmetics via passive presence for visible chatters once', async () => {
    await fetchUserCosmetics('chatter-1');
    await fetchUserCosmetics('chatter-1');

    expect(mockRequestUserCosmeticsViaPresence.mock.calls).toEqual([
      ['chatter-1'],
    ]);
  });

  test('does not refetch users that already have cached paint and renderable badge cosmetics', async () => {
    setCachedCosmetics(
      {
        getUserBadgeId: mockGetUserBadgeId,
        getUserPaintId: mockGetUserPaintId,
      },
      {
        badgeId: 'badge-1',
        paintId: 'paint-1',
        twitchUserId: 'cached-user',
      },
    );
    mockGetUserBadge.mockReturnValue({
      id: 'badge-1',
      url: 'https://cdn.7tv.app/badge/badge-1/4x.webp',
      type: '7TV Badge',
      title: 'Supporter',
      set: 'badge-1',
      provider: '7tv',
    });

    await fetchUserCosmetics('cached-user');

    expect(mockRequestUserCosmeticsViaPresence).not.toHaveBeenCalled();
  });

  test('does not refetch paint-only users when retryMissingBadge is requested', async () => {
    setCachedCosmetics(
      {
        getUserBadgeId: mockGetUserBadgeId,
        getUserPaintId: mockGetUserPaintId,
      },
      {
        paintId: 'paint-1',
        twitchUserId: 'paint-only-user',
      },
    );
    mockGetUserBadge.mockReturnValue(undefined);

    await fetchUserCosmetics('paint-only-user');
    await fetchUserCosmetics('paint-only-user', { retryMissingBadge: true });

    expect(mockRequestUserCosmeticsViaPresence.mock.calls).toEqual([]);
  });

  test('retries a previously fetched user when retryMissingBadge is requested and a badge binding lacks a renderable definition', async () => {
    setCachedCosmetics(
      {
        getUserBadgeId: mockGetUserBadgeId,
        getUserPaintId: mockGetUserPaintId,
      },
      {
        badgeId: 'badge-1',
        twitchUserId: 'retry-user',
      },
    );
    mockGetUserBadge.mockReturnValue(undefined);

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
