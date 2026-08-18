import { act, renderHook, waitFor } from '@testing-library/react-native';

import { sevenTvService } from '@app/services/seventv-service';
import * as cosmeticsActions from '@app/store/chat/actions/cosmetics';
import { logger } from '@app/utils/logger';

import { useChatCosmetics } from '../useChatCosmetics';
import { setCachedCosmetics } from './__fixtures__/useChatCosmetics.fixture';

jest.spyOn(logger.stv, 'debug').mockImplementation(() => undefined);

const mockGet7tvUserId = jest.spyOn(sevenTvService, 'get7tvUserId');
const mockFetchAndCacheUserCosmetics = jest.spyOn(
  cosmeticsActions,
  'fetchAndCacheUserCosmetics',
);
const mockGetUserBadge = jest.spyOn(cosmeticsActions, 'getUserBadge');
jest.spyOn(cosmeticsActions, 'getUserBadgeId');
jest.spyOn(cosmeticsActions, 'getUserPaintId');
const mockGetUserBadgeId = jest.mocked(cosmeticsActions.getUserBadgeId);
const mockGetUserPaintId = jest.mocked(cosmeticsActions.getUserPaintId);

describe('useChatCosmetics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet7tvUserId.mockResolvedValue('7tv-user-1');
    mockFetchAndCacheUserCosmetics.mockResolvedValue('ttv-self');
    mockGetUserBadge.mockReturnValue(undefined);
    mockGetUserBadgeId.mockReturnValue(undefined);
    mockGetUserPaintId.mockReturnValue(undefined);
  });

  test('bootstraps the signed-in user cosmetics on mount', async () => {
    renderHook(() =>
      useChatCosmetics({
        userId: 'ttv-self',
      }),
    );

    await waitFor(() => {
      expect(mockGet7tvUserId.mock.calls).toEqual([['ttv-self']]);
      expect(mockFetchAndCacheUserCosmetics.mock.calls).toEqual([
        ['7tv-user-1'],
      ]);
    });
  });

  test('skips self bootstrap when paint and badge bindings are already known', async () => {
    setCachedCosmetics(
      {
        getUserBadgeId: mockGetUserBadgeId,
        getUserPaintId: mockGetUserPaintId,
      },
      {
        badgeId: 'badge-1',
        paintId: 'paint-1',
        twitchUserId: 'ttv-self',
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

    renderHook(() =>
      useChatCosmetics({
        userId: 'ttv-self',
      }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockFetchAndCacheUserCosmetics).not.toHaveBeenCalled();
  });

  test('skips self bootstrap when only paint is known', async () => {
    setCachedCosmetics(
      {
        getUserBadgeId: mockGetUserBadgeId,
        getUserPaintId: mockGetUserPaintId,
      },
      {
        paintId: 'paint-1',
        twitchUserId: 'ttv-self',
      },
    );

    renderHook(() =>
      useChatCosmetics({
        userId: 'ttv-self',
      }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockGet7tvUserId).not.toHaveBeenCalled();
    expect(mockFetchAndCacheUserCosmetics).not.toHaveBeenCalled();
  });
});
