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
  updateBadge,
  updatePaint,
} from '@app/store/chat/actions/cosmetics';
import { countMetric } from '@app/lib/sentry';
import type { SanitisedEmote } from '@app/types/emote';
import { renderHook, act } from '@testing-library/react-native';
import { generateStvEmoteNotice } from '@app/utils/emote/stv/generateSevenTvEmoteNotice';
import { toPaintWithId } from '../../util/normalizeSevenTvCosmetics';
import { useChatSevenTvCallbacks } from '../useChatSevenTvCallbacks';

jest.mock('@app/store/chat/actions/cosmetics', () => ({
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

jest.mock('@app/lib/sentry', () => ({
  countMetric: jest.fn(),
  recordInfo: jest.fn(),
}));

jest.mock('@app/utils/emote/stv/generateSevenTvEmoteNotice', () => ({
  generateStvEmoteNotice: jest.fn(args => ({
    id: `${args.type}-${args.emote.id}`,
    channel: args.channelName,
    message: [],
    message_id: `${args.type}-${args.emote.id}`,
    message_nonce: 'nonce',
    badges: [],
    sender: '',
    replyDisplayName: '',
    replyBody: '',
    parentDisplayName: '',
    userstate: {
      'reply-parent-msg-id': '',
      'reply-parent-msg-body': '',
      'reply-parent-display-name': '',
      'reply-parent-user-login': '',
    },
    isSpecialNotice: true,
  })),
}));

const mockGetBadge = jest.mocked(getBadge);
const mockGetPaint = jest.mocked(getPaint);
const mockAddBadge = jest.mocked(addBadge);
const mockAddPaint = jest.mocked(addPaint);
const mockUpdateBadge = jest.mocked(updateBadge);
const mockCountMetric = jest.mocked(countMetric);

const mockUpdateSevenTvEmotes = jest.fn();
const mockFetchAndCacheUserCosmetics = jest.fn().mockResolvedValue(undefined);
const mockCanFetchCosmetics = jest.fn().mockReturnValue(true);
const mockOnEmoteNotice = jest.fn();

const paintInput = (overrides: {
  id: string;
  name: string;
  color?: number | null;
}) => ({
  id: overrides.id,
  name: overrides.name,
  color: overrides.color ?? null,
  function: 'LINEAR_GRADIENT' as const,
});

const defaultProps = {
  channelId: 'twitch-123',
  channelName: 'testchannel',
  sevenTvEmoteSetId: 'emote-set-1',
  canFetchCosmetics: mockCanFetchCosmetics,
  fetchAndCacheUserCosmetics: mockFetchAndCacheUserCosmetics,
  updateSevenTvEmotes: mockUpdateSevenTvEmotes,
  onEmoteNotice: mockOnEmoteNotice,
};

describe('useChatSevenTvCallbacks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetBadge.mockReturnValue(undefined);
    mockGetPaint.mockReturnValue(undefined);
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

    test('emits notice messages for added and removed emotes', () => {
      const { result } = renderHook(() =>
        useChatSevenTvCallbacks(defaultProps),
      );

      const added = [{ id: 'e1', name: 'Added' } as SanitisedEmote];
      const removed = [{ id: 'e2', name: 'Removed' } as SanitisedEmote];

      act(() => {
        result.current.onEmoteUpdate({
          channelId: 'c1',
          added,
          removed,
        });
      });

      expect(generateStvEmoteNotice).toHaveBeenCalledWith({
        channelName: 'testchannel',
        emote: added[0],
        type: 'added',
      });
      expect(generateStvEmoteNotice).toHaveBeenCalledWith({
        channelName: 'testchannel',
        emote: removed[0],
        type: 'removed',
      });
      expect(mockOnEmoteNotice).toHaveBeenCalledTimes(2);
    });

    test('suppresses visible notices for nnys emote changes', () => {
      const { result } = renderHook(() =>
        useChatSevenTvCallbacks(defaultProps),
      );

      const added = [{ id: 'e1', name: 'nnysPat' } as SanitisedEmote];
      const removed = [{ id: 'e2', name: 'CoolNnysThing' } as SanitisedEmote];

      act(() => {
        result.current.onEmoteUpdate({
          channelId: 'c1',
          added,
          removed,
        });
      });

      expect(mockUpdateSevenTvEmotes).toHaveBeenCalledWith(
        'c1',
        added,
        removed,
      );
      expect(generateStvEmoteNotice).not.toHaveBeenCalled();
      expect(mockOnEmoteNotice).not.toHaveBeenCalled();
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
          cosmetic: { object: { kind: 'BADGE', data: badgeData } },
        } as never);
      });

      expect(getBadge).toHaveBeenCalled();
      expect(mockAddBadge.mock.calls[0]?.[0]).toEqual({
        id: 'badge-id',
        provider: '7tv',
        set: 'badge-id',
        title: 'Tip',
        type: '7TV Badge',
        url: 'https://cdn.7tv.app/badge/badge-id/4x.webp',
      });
    });

    test('does not add badge when getBadge already returns truthy', () => {
      mockGetBadge.mockReturnValue({
        id: 'badge-id',
        set: 'badge-id',
        title: 'Badge',
        type: '7TV Badge',
        url: 'https://cdn.7tv.app/badge/badge-id/4x.webp',
      });
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
          cosmetic: { object: { kind: 'BADGE', data: badgeData } },
        } as never);
      });

      expect(addBadge).not.toHaveBeenCalled();
    });

    test('adds paint when kind is PAINT and paint not in cache', () => {
      const { result } = renderHook(() =>
        useChatSevenTvCallbacks(defaultProps),
      );
      const paintData = paintInput({
        id: 'paint-id',
        name: 'Paint',
        color: 0xff0000ff,
      });

      act(() => {
        result.current.onCosmeticCreate({
          kind: 'PAINT',
          cosmetic: { object: { kind: 'PAINT', data: paintData } },
        } as never);
      });

      expect(getPaint).toHaveBeenCalled();
      expect(mockAddPaint.mock.calls[0]?.[0]).toEqual(toPaintWithId(paintData));
    });
  });

  describe('onCosmeticUpdate', () => {
    test('records a Sentry count metric for paint updates', () => {
      const { result } = renderHook(() =>
        useChatSevenTvCallbacks(defaultProps),
      );

      act(() => {
        result.current.onCosmeticUpdate({
          kind: 'PAINT',
          changes: {
            updated: [
              {
                value: {
                  object: {
                    data: paintInput({
                      id: 'paint-1',
                      name: 'Updated Paint',
                    }),
                  },
                },
              },
            ],
            pushed: [
              {
                value: {
                  object: {
                    data: paintInput({ id: 'paint-2', name: 'Added Paint' }),
                  },
                },
              },
            ],
          },
        } as never);
      });

      expect(updatePaint).toHaveBeenCalledWith(
        toPaintWithId(paintInput({ id: 'paint-1', name: 'Updated Paint' })),
      );
      expect(addPaint).toHaveBeenCalledWith(
        toPaintWithId(paintInput({ id: 'paint-2', name: 'Added Paint' })),
      );
      expect(mockCountMetric.mock.calls[0]).toEqual([
        'seven_tv.cosmetic_update.applied',
        {
          action: 'paint_update_applied',
          channel_id: 'twitch-123',
          channel_name: 'testchannel',
          provider: 'seven_tv',
          resource_type: 'paints',
          screen: 'chat',
          seven_tv_emote_set_id: 'emote-set-1',
        },
        2,
      ]);
    });

    test('records a Sentry count metric for badge updates', () => {
      const { result } = renderHook(() =>
        useChatSevenTvCallbacks(defaultProps),
      );

      act(() => {
        result.current.onCosmeticUpdate({
          kind: 'BADGE',
          changes: {
            updated: [
              {
                value: {
                  object: {
                    data: {
                      id: 'badge-1',
                      name: 'Updated Badge',
                      host: {
                        url: 'https://cdn.7tv.app/badge-1',
                        files: [{ name: '4x' }],
                      },
                    },
                  },
                },
              },
            ],
            pushed: [
              {
                value: {
                  object: {
                    data: {
                      id: 'badge-2',
                      name: 'Added Badge',
                      host: {
                        url: 'https://cdn.7tv.app/badge-2',
                        files: [{ name: '4x' }],
                      },
                    },
                  },
                },
              },
            ],
          },
        } as never);
      });

      expect(mockUpdateBadge.mock.calls[0]?.[0]).toEqual({
        id: 'badge-1',
        provider: '7tv',
        set: 'badge-1',
        title: 'Updated Badge',
        type: '7TV Badge',
        url: 'https://cdn.7tv.app/badge/badge-1/4x.webp',
      });
      expect(mockAddBadge.mock.calls[0]?.[0]).toEqual({
        id: 'badge-2',
        provider: '7tv',
        set: 'badge-2',
        title: 'Added Badge',
        type: '7TV Badge',
        url: 'https://cdn.7tv.app/badge/badge-2/4x.webp',
      });
      expect(mockCountMetric.mock.calls[0]).toEqual([
        'seven_tv.cosmetic_update.applied',
        {
          action: 'badge_update_applied',
          channel_id: 'twitch-123',
          channel_name: 'testchannel',
          provider: 'seven_tv',
          resource_type: 'badges',
          screen: 'chat',
          seven_tv_emote_set_id: 'emote-set-1',
        },
        2,
      ]);
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
        });
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
