import { act, renderHook, waitFor } from '@testing-library/react-native';

import { setCachedCosmetics } from '@app/components/chat/hooks/__tests__/__fixtures__/use-chat-cosmetics.fixture';
import { useChatCosmetics } from '@app/components/chat/hooks/use-chat-cosmetics';
import { sevenTvService } from '@app/services/seven-tv-service';
import {
  clearUserCosmeticsCache,
  getUserBadgeId,
  getUserPaintId,
} from '@app/store/chat/actions/cosmetics';
import { chatStore$ } from '@app/store/chat/observables/chat-store';
import { logger } from '@app/utils/logger';

let mockGet7tvUserId: jest.SpiedFunction<typeof sevenTvService.get7tvUserId>;

let mockGetUserCosmeticsGql: jest.SpiedFunction<
  typeof sevenTvService.getUserCosmeticsGql
>;

interface SelfBindings {
  badgeId: string | undefined;
  paintId: string | undefined;
}

function readSelfBindings(): SelfBindings {
  return {
    badgeId: getUserBadgeId('ttv-self'),
    paintId: getUserPaintId('ttv-self'),
  };
}

describe('useChatCosmetics', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    clearUserCosmeticsCache();
    chatStore$.userPaintIds.set({});
    chatStore$.userBadgeIds.set({});
    jest.spyOn(logger.stv, 'debug').mockImplementation(() => undefined);
    jest.spyOn(logger.stv, 'warn').mockImplementation(() => undefined);

    mockGet7tvUserId = jest
      .spyOn(sevenTvService, 'get7tvUserId')
      .mockResolvedValue('7tv-user-1');

    mockGetUserCosmeticsGql = jest
      .spyOn(sevenTvService, 'getUserCosmeticsGql')
      .mockResolvedValue({
        userId: '7tv-user-1',
        ttvUserId: 'ttv-self',
        paintId: null,
        badgeId: 'badge-1',
        paint: null,
        badge: null,
      });
  });

  test('bootstraps the signed-in user cosmetics on mount', async () => {
    renderHook(() =>
      useChatCosmetics({
        userId: 'ttv-self',
      }),
    );

    await waitFor(() => {
      expect(readSelfBindings()).toEqual<SelfBindings>({
        badgeId: 'badge-1',
        paintId: undefined,
      });
    });

    expect(mockGet7tvUserId.mock.calls).toEqual([['ttv-self']]);

    expect(mockGetUserCosmeticsGql.mock.calls).toEqual([['7tv-user-1']]);
  });

  test('skips self bootstrap when paint and badge bindings are already known', async () => {
    setCachedCosmetics({
      badgeId: 'badge-1',
      paintId: 'paint-1',
      twitchUserId: 'ttv-self',
    });

    renderHook(() =>
      useChatCosmetics({
        userId: 'ttv-self',
      }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockGet7tvUserId).not.toHaveBeenCalled();

    expect(mockGetUserCosmeticsGql).not.toHaveBeenCalled();
  });

  test('skips self bootstrap when only the badge is known', async () => {
    setCachedCosmetics({
      badgeId: 'badge-1',
      twitchUserId: 'ttv-self',
    });

    renderHook(() =>
      useChatCosmetics({
        userId: 'ttv-self',
      }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockGet7tvUserId).not.toHaveBeenCalled();

    expect(mockGetUserCosmeticsGql).not.toHaveBeenCalled();
  });

  test('skips self bootstrap when only paint is known', async () => {
    setCachedCosmetics({
      paintId: 'paint-1',
      twitchUserId: 'ttv-self',
    });

    renderHook(() =>
      useChatCosmetics({
        userId: 'ttv-self',
      }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockGet7tvUserId).not.toHaveBeenCalled();

    expect(mockGetUserCosmeticsGql).not.toHaveBeenCalled();
  });

  test('bootstraps a different user even when another user has cosmetics', async () => {
    setCachedCosmetics({
      paintId: 'paint-1',
      twitchUserId: 'ttv-other',
    });

    renderHook(() =>
      useChatCosmetics({
        userId: 'ttv-self',
      }),
    );

    await waitFor(() => {
      expect(readSelfBindings()).toEqual<SelfBindings>({
        badgeId: 'badge-1',
        paintId: undefined,
      });
    });
  });
});
