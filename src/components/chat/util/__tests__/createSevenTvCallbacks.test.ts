// oxlint-disable anti-slop/no-shape-in-symbol-names -- mirrors the 7TV paint API shape field (types/seven-tv/cosmetics.ts)
import {
  createSevenTvBadge,
  createSevenTvEmote,
} from '@app/components/chat/__tests__/__fixtures__/chatFactories.fixture';
import {
  createBadgeChangeEntry,
  createBadgeCosmeticCreateData,
  createBadgeCosmeticUpdateData,
  createBadgeData,
  createBadgePushedEntry,
  createEmptyChangeMap,
  createEntitlementDeleteData,
  createEntitlementUpdateData,
  createPaintChangeEntry,
  createPaintCosmeticCreateData,
  createPaintCosmeticUpdateData,
  createPaintInput,
  createPaintPushedEntry,
} from '@app/components/chat/util/__tests__/__fixtures__/createSevenTvCallbacks.fixture';
import { createSevenTvCallbacks } from '@app/components/chat/util/createSevenTvCallbacks';
import * as sentryModule from '@app/lib/sentry';
import { sevenTvService } from '@app/services/seven-tv-service';
import { clearUserCosmeticsCache } from '@app/store/chat/actions/cosmetics';
import { chatStore$ } from '@app/store/chat/observables/chat-store';
import { silenceLogger } from '@app/test/silence-logger';
import type { MessageToken } from '@app/types/chat/messageToken';
import type { BadgeData, PaintData } from '@app/types/seven-tv/cosmetics';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

silenceLogger();

const mockCountMetric = jest
  .spyOn(sentryModule, 'countMetric')
  .mockImplementation(() => {});

const mockUpdateSevenTvEmotes = jest.fn();
const mockOnEmoteNotice = jest.fn();

interface EmoteNoticeSummary {
  channel: string;
  isSpecialNotice: boolean | undefined;
  message: MessageToken[];
}

function emoteNotices(): EmoteNoticeSummary[] {
  return mockOnEmoteNotice.mock.calls.map(([notice]) => ({
    channel: notice.channel,
    isSpecialNotice: notice.isSpecialNotice,
    message: notice.message,
  }));
}

function createBadgeEntitlement(ttvUserId: string, badgeId: string) {
  return {
    entitlement: {
      id: 'entitlement-1',
      kind: 0,
      object: {
        id: 'entitlement-1',
        kind: 'BADGE' as const,
        ref_id: badgeId,
        user: {
          id: 'stv-user-1',
          username: 'user',
          display_name: 'User',
          avatar_url: '',
          style: {},
          role_ids: { length: 0 },
          connections: { length: 0 },
        },
      },
    },
    kind: 'BADGE' as const,
    ttvUserId,
    paintId: null,
    badgeId,
  };
}

/**
 * The stored form of a legacy flat linear paint: the store lifts the top-level
 * gradient into one layer.
 */
function storedLinearPaint(
  id: string,
  name: string,
  color: number | null = null,
): PaintData {
  return {
    id,
    name,
    color,
    layers: {
      0: {
        function: 'LINEAR_GRADIENT',
        stops: { length: 0 },
        angle: 0,
        shape: 'circle',
        repeat: false,
        image_url: '',
        canvas_repeat: 'unset',
        at: null,
        size: [1, 1],
        opacity: 1,
      },
      length: 1,
    },
    shadows: { length: 0 },
    textStyle: null,
    function: 'LINEAR_GRADIENT',
    repeat: false,
    angle: 0,
    shape: 'circle',
    image_url: '',
    stops: { length: 0 },
  };
}

const defaultProps = {
  channelId: 'twitch-123',
  channelName: 'testchannel',
  sevenTvEmoteSetId: 'emote-set-1',
  updateSevenTvEmotes: mockUpdateSevenTvEmotes,
  onEmoteNotice: mockOnEmoteNotice,
};

describe('createSevenTvCallbacks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearUserCosmeticsCache();
    jest.spyOn(sevenTvService, 'get7tvUserId').mockResolvedValue('');
  });

  afterEach(() => {
    clearUserCosmeticsCache();
  });

  describe('onEmoteUpdate', () => {
    test('calls updateSevenTvEmotes with channelId, added, removed', () => {
      const result = createSevenTvCallbacks(defaultProps);

      result.onEmoteUpdate({
        channelId: 'c1',
        added: [
          createSevenTvEmote({ id: 'e1', name: 'e1', original_name: 'e1' }),
        ],
        removed: [
          createSevenTvEmote({ id: 'e2', name: 'e2', original_name: 'e2' }),
        ],
      });

      expect(mockUpdateSevenTvEmotes).toHaveBeenCalledWith(
        'c1',
        [createSevenTvEmote({ id: 'e1', name: 'e1', original_name: 'e1' })],
        [createSevenTvEmote({ id: 'e2', name: 'e2', original_name: 'e2' })],
      );
    });

    test('emits notice messages for added and removed emotes', () => {
      const result = createSevenTvCallbacks(defaultProps);

      const addedEmote = createSevenTvEmote({
        id: 'e1',
        name: 'Added',
        original_name: 'Added',
      });

      const removedEmote = createSevenTvEmote({
        id: 'e2',
        name: 'Removed',
        original_name: 'Removed',
      });

      result.onEmoteUpdate({
        channelId: 'c1',
        added: [addedEmote],
        removed: [removedEmote],
      });

      expect(emoteNotices()).toEqual<EmoteNoticeSummary[]>([
        {
          channel: 'testchannel',
          isSpecialNotice: true,
          message: [
            {
              type: 'stvEmoteAdded',
              stvEvents: { data: addedEmote, type: 'added' },
            },
          ],
        },
        {
          channel: 'testchannel',
          isSpecialNotice: true,
          message: [
            {
              type: 'stvEmoteRemoved',
              stvEvents: {
                data: removedEmote,
                type: 'removed',
              },
            },
          ],
        },
      ]);
    });

    test('suppresses visible notices for nnys emote changes', () => {
      const result = createSevenTvCallbacks(defaultProps);

      const added = [
        createSevenTvEmote({
          id: 'e1',
          name: 'nnysPat',
          original_name: 'nnysPat',
        }),
      ];

      const removed = [
        createSevenTvEmote({
          id: 'e2',
          name: 'CoolNnysThing',
          original_name: 'CoolNnysThing',
        }),
      ];

      result.onEmoteUpdate({
        channelId: 'c1',
        added,
        removed,
      });

      expect(mockUpdateSevenTvEmotes).toHaveBeenCalledWith(
        'c1',
        added,
        removed,
      );

      expect(mockOnEmoteNotice).not.toHaveBeenCalled();
    });
  });

  describe('onCosmeticCreate', () => {
    test('no-ops when cosmetic.object is missing', () => {
      const result = createSevenTvCallbacks(defaultProps);

      // @ts-expect-error -- exercising runtime guard when cosmetic.object is absent
      result.onCosmeticCreate({ kind: 'BADGE', cosmetic: {} });

      expect(chatStore$.badges.peek()).toEqual({});
    });

    test('caches a created badge', () => {
      const result = createSevenTvCallbacks(defaultProps);

      const data = createBadgeCosmeticCreateData(
        createBadgeData({
          id: 'badge-id',
          name: 'Badge',
          tooltip: 'Tip',
        }),
      );

      result.onCosmeticCreate(data);

      expect(chatStore$.badges.peek()).toEqual<
        Record<string, SanitisedBadgeSet>
      >({
        'badge-id': createSevenTvBadge('badge-id', { title: 'Tip' }),
      });
    });

    test('caches a created paint', () => {
      const result = createSevenTvCallbacks(defaultProps);

      const data = createPaintCosmeticCreateData(
        createPaintInput({
          id: 'paint-id',
          name: 'Paint',
          color: 0xff_00_00_ff,
        }),
      );

      result.onCosmeticCreate(data);

      expect(chatStore$.paints.peek()).toEqual<Record<string, PaintData>>({
        'paint-id': storedLinearPaint('paint-id', 'Paint', 0xff_00_00_ff),
      });
    });
  });

  describe('onEntitlementCreate', () => {
    test('binds the badge to the Twitch user', () => {
      const result = createSevenTvCallbacks(defaultProps);

      result.onCosmeticCreate(
        createBadgeCosmeticCreateData(
          createBadgeData({ id: 'badge-1', name: 'Badge', tooltip: 'Tip' }),
        ),
      );

      result.onEntitlementCreate(createBadgeEntitlement('ttv-1', 'badge-1'));

      expect(chatStore$.userBadgeIds.peek()).toEqual({ 'ttv-1': 'badge-1' });
    });
  });

  describe('onCosmeticUpdate', () => {
    test('records a Sentry count metric for paint updates', () => {
      const result = createSevenTvCallbacks(defaultProps);

      result.onCosmeticUpdate(
        createPaintCosmeticUpdateData({
          ...createEmptyChangeMap<PaintData>(),
          updated: [
            createPaintChangeEntry(
              createPaintInput({ id: 'paint-1', name: 'Updated Paint' }),
              createPaintInput({ id: 'paint-1', name: 'Old Paint' }),
            ),
          ],
          pushed: [
            createPaintPushedEntry(
              createPaintInput({ id: 'paint-2', name: 'Added Paint' }),
            ),
          ],
        }),
      );

      expect(chatStore$.paints.peek()).toEqual<Record<string, PaintData>>({
        'paint-1': storedLinearPaint('paint-1', 'Updated Paint'),
        'paint-2': storedLinearPaint('paint-2', 'Added Paint'),
      });

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
      const result = createSevenTvCallbacks(defaultProps);

      result.onCosmeticUpdate(
        createBadgeCosmeticUpdateData({
          ...createEmptyChangeMap<BadgeData>(),
          updated: [
            createBadgeChangeEntry(
              createBadgeData({
                id: 'badge-1',
                name: 'Updated Badge',
                tooltip: 'Updated Badge',
              }),
            ),
          ],
          pushed: [
            createBadgePushedEntry(
              createBadgeData({
                id: 'badge-2',
                name: 'Added Badge',
                tooltip: 'Added Badge',
              }),
            ),
          ],
        }),
      );

      expect(chatStore$.badges.peek()).toEqual<
        Record<string, SanitisedBadgeSet>
      >({
        'badge-1': createSevenTvBadge('badge-1', { title: 'Updated Badge' }),
        'badge-2': createSevenTvBadge('badge-2', { title: 'Added Badge' }),
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
    test('removes the badge or paint and every binding to it', () => {
      const result = createSevenTvCallbacks(defaultProps);

      result.onCosmeticCreate(
        createBadgeCosmeticCreateData(
          createBadgeData({
            id: 'cosmetic-123',
            name: 'Gone',
            tooltip: 'Gone',
          }),
        ),
      );

      result.onCosmeticCreate(
        createBadgeCosmeticCreateData(
          createBadgeData({ id: 'kept-badge', name: 'Kept', tooltip: 'Kept' }),
        ),
      );

      result.onCosmeticCreate(
        createPaintCosmeticCreateData(
          createPaintInput({ id: 'cosmetic-123', name: 'Gone' }),
        ),
      );

      result.onEntitlementUpdate(
        createEntitlementUpdateData({
          ttvUserId: 'ttv-1',
          paintId: 'cosmetic-123',
          badgeId: 'cosmetic-123',
        }),
      );

      result.onEntitlementUpdate(
        createEntitlementUpdateData({
          ttvUserId: 'ttv-2',
          badgeId: 'kept-badge',
        }),
      );

      result.onCosmeticDelete({ cosmeticId: 'cosmetic-123' });

      expect({
        badges: chatStore$.badges.peek(),
        paints: chatStore$.paints.peek(),
        userBadgeIds: chatStore$.userBadgeIds.peek(),
        userPaintIds: chatStore$.userPaintIds.peek(),
      }).toEqual({
        badges: {
          'kept-badge': createSevenTvBadge('kept-badge', { title: 'Kept' }),
        },
        paints: {},
        userBadgeIds: { 'ttv-2': 'kept-badge' },
        userPaintIds: {},
      });
    });
  });

  describe('onEntitlementUpdate', () => {
    test('binds the paint and badge to the Twitch user', () => {
      const result = createSevenTvCallbacks(defaultProps);

      result.onCosmeticCreate(
        createBadgeCosmeticCreateData(
          createBadgeData({ id: 'badge-1', name: 'Badge', tooltip: 'Tip' }),
        ),
      );

      result.onEntitlementUpdate(
        createEntitlementUpdateData({
          ttvUserId: 'ttv-1',
          paintId: 'paint-1',
          badgeId: 'badge-1',
        }),
      );

      expect({
        userBadgeIds: chatStore$.userBadgeIds.peek(),
        userPaintIds: chatStore$.userPaintIds.peek(),
      }).toEqual({
        userBadgeIds: { 'ttv-1': 'badge-1' },
        userPaintIds: { 'ttv-1': 'paint-1' },
      });
    });
  });

  describe('onEntitlementDelete', () => {
    test('removes the binding that the entitlement created', () => {
      const result = createSevenTvCallbacks(defaultProps);

      result.onCosmeticCreate(
        createBadgeCosmeticCreateData(
          createBadgeData({ id: 'badge-1', name: 'Badge', tooltip: 'Tip' }),
        ),
      );

      result.onEntitlementCreate(createBadgeEntitlement('ttv-1', 'badge-1'));

      result.onEntitlementDelete(
        createEntitlementDeleteData({ entitlementId: 'entitlement-1' }),
      );

      expect(chatStore$.userBadgeIds.peek()).toEqual({});
    });
  });
});
