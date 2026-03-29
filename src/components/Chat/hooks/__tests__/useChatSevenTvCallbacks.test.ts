import {
  addBadge,
  addPaint,
  getBadge,
  getPaint,
  removeBadge,
  removePaint,
  removeUserBadge,
  removeUserPaint,
  setUserBadge,
  setUserPaint,
} from '@app/store/chatStore/cosmetics';
import type { SanitisedEmote } from '@app/types/emote';
import { renderHook, act } from '@testing-library/react-native';
import { useChatSevenTvCallbacks } from '../useChatSevenTvCallbacks';

jest.mock('@app/store/chatStore/cosmetics', () => ({
  addBadge: jest.fn(),
  addPaint: jest.fn(),
  getBadge: jest.fn(),
  getPaint: jest.fn(),
  removeBadge: jest.fn(),
  removePaint: jest.fn(),
  removeUserBadge: jest.fn(),
  removeUserPaint: jest.fn(),
  setUserBadge: jest.fn(),
  setUserPaint: jest.fn(),
  updateBadge: jest.fn(),
  updatePaint: jest.fn(),
}));

jest.mock('@app/utils/logger', () => ({
  logger: { stvWs: { info: jest.fn(), debug: jest.fn() } },
}));

const mockUpdateSevenTvEmotes = jest.fn();
const mockFetchAndCacheUserCosmetics = jest.fn().mockResolvedValue(undefined);
const mockCanFetchCosmetics = jest.fn().mockReturnValue(true);

const defaultProps = {
  channelId: 'twitch-123',
  sevenTvEmoteSetId: 'emote-set-1',
  canFetchCosmetics: mockCanFetchCosmetics,
  fetchAndCacheUserCosmetics: mockFetchAndCacheUserCosmetics,
  updateSevenTvEmotes: mockUpdateSevenTvEmotes,
};

describe('useChatSevenTvCallbacks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getBadge as jest.Mock).mockReturnValue(undefined);
    (getPaint as jest.Mock).mockReturnValue(undefined);
  });

  describe('return shape', () => {
    test('returns all callbacks and channel/set ids', () => {
      const { result } = renderHook(() =>
        useChatSevenTvCallbacks(defaultProps),
      );

      expect(result.current.onEmoteUpdate).toBeDefined();
      expect(result.current.onCosmeticCreate).toBeDefined();
      expect(result.current.onEntitlementCreate).toBeDefined();
      expect(result.current.onCosmeticUpdate).toBeDefined();
      expect(result.current.onCosmeticDelete).toBeDefined();
      expect(result.current.onEntitlementUpdate).toBeDefined();
      expect(result.current.onEntitlementDelete).toBeDefined();
      expect(result.current.twitchChannelId).toBe('twitch-123');
      expect(result.current.sevenTvEmoteSetId).toBe('emote-set-1');
    });
  });

  describe('onEmoteUpdate', () => {
    test('calls updateSevenTvEmotes with channelId, added, removed', () => {
      const { result } = renderHook(() =>
        useChatSevenTvCallbacks(defaultProps),
      );

      act(() => {
        result.current.onEmoteUpdate({
          channelId: 'c1',
          added: [{ id: 'e1' } as SanitisedEmote],
          removed: [{ id: 'e2' } as SanitisedEmote],
        });
      });

      expect(mockUpdateSevenTvEmotes).toHaveBeenCalledWith(
        'c1',
        [{ id: 'e1' }],
        [{ id: 'e2' }],
      );
    });
  });

  describe('onCosmeticCreate', () => {
    test('no-ops when cosmetic.object is missing', () => {
      const { result } = renderHook(() =>
        useChatSevenTvCallbacks(defaultProps),
      );

      act(() => {
        result.current.onCosmeticCreate({ cosmetic: {} } as never);
      });

      expect(addBadge).not.toHaveBeenCalled();
      expect(addPaint).not.toHaveBeenCalled();
    });

    test('adds badge when kind is BADGE and badge not in cache', () => {
      const { result } = renderHook(() =>
        useChatSevenTvCallbacks(defaultProps),
      );
      const badgeData = {
        id: 'badge-id',
        name: 'Badge',
        tooltip: 'Tip',
        host: { url: 'https://cdn.7tv.app', files: [{ name: '4x' }] },
      };

      act(() => {
        result.current.onCosmeticCreate({
          kind: 'BADGE',
          cosmetic: { object: { data: badgeData } },
        } as never);
      });

      expect(getBadge).toHaveBeenCalled();
      expect(addBadge).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'badge-id',
          type: '7TV Badge',
          provider: '7tv',
        }),
      );
    });

    test('does not add badge when getBadge already returns truthy', () => {
      (getBadge as jest.Mock).mockReturnValue({ id: 'badge-id' });
      const { result } = renderHook(() =>
        useChatSevenTvCallbacks(defaultProps),
      );
      const badgeData = {
        id: 'badge-id',
        name: 'Badge',
        host: { url: 'https://cdn.7tv.app', files: [] },
      };

      act(() => {
        result.current.onCosmeticCreate({
          kind: 'BADGE',
          cosmetic: { object: { data: badgeData } },
        } as never);
      });

      expect(addBadge).not.toHaveBeenCalled();
    });

    test('adds paint when kind is PAINT and paint not in cache', () => {
      const { result } = renderHook(() =>
        useChatSevenTvCallbacks(defaultProps),
      );
      const paintData = {
        id: 'paint-id',
        name: 'Paint',
        color: 0xff0000ff,
      };

      act(() => {
        result.current.onCosmeticCreate({
          kind: 'PAINT',
          cosmetic: { object: { data: paintData } },
        } as never);
      });

      expect(getPaint).toHaveBeenCalled();
      expect(addPaint).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'paint-id', name: 'Paint' }),
      );
    });
  });

  describe('onCosmeticDelete', () => {
    test('calls removeBadge and removePaint with cosmeticId', () => {
      const { result } = renderHook(() =>
        useChatSevenTvCallbacks(defaultProps),
      );

      act(() => {
        result.current.onCosmeticDelete({
          cosmeticId: 'cosmetic-123',
        } as never);
      });

      expect(removeBadge).toHaveBeenCalledWith('cosmetic-123');
      expect(removePaint).toHaveBeenCalledWith('cosmetic-123');
    });
  });

  describe('onEntitlementUpdate', () => {
    test('sets user paint and badge when ttvUserId and ids provided', () => {
      const { result } = renderHook(() =>
        useChatSevenTvCallbacks(defaultProps),
      );

      act(() => {
        result.current.onEntitlementUpdate({
          ttvUserId: 'ttv-1',
          paintId: 'paint-1',
          badgeId: 'badge-1',
        } as never);
      });

      expect(setUserPaint).toHaveBeenCalledWith('ttv-1', 'paint-1');
      expect(setUserBadge).toHaveBeenCalledWith('ttv-1', 'badge-1');
    });

    test('removes user paint/badge when ids are null', () => {
      const { result } = renderHook(() =>
        useChatSevenTvCallbacks(defaultProps),
      );

      act(() => {
        result.current.onEntitlementUpdate({
          ttvUserId: 'ttv-1',
          paintId: null,
          badgeId: null,
        } as never);
      });

      expect(removeUserPaint).toHaveBeenCalledWith('ttv-1');
      expect(removeUserBadge).toHaveBeenCalledWith('ttv-1');
    });
  });

  describe('onEntitlementDelete', () => {
    test('removes user paint and badge for ttvUserId', () => {
      const { result } = renderHook(() =>
        useChatSevenTvCallbacks(defaultProps),
      );

      act(() => {
        result.current.onEntitlementDelete({ ttvUserId: 'ttv-1' } as never);
      });

      expect(removeUserPaint).toHaveBeenCalledWith('ttv-1');
      expect(removeUserBadge).toHaveBeenCalledWith('ttv-1');
    });
  });
});
