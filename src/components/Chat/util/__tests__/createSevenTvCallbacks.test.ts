import { act } from '@testing-library/react-native';

import { createSevenTvEmote } from '@app/components/Chat/hooks/__tests__/__fixtures__/useChat.fixture';
import { countMetric } from '@app/lib/sentry';
import {
  addBadge,
  addPaint,
  removeBadge,
  removePaint,
} from '@app/store/chat/actions/cosmetics';
import {
  applyCosmeticCreateEvent,
  applyEntitlementCreateEvent,
  applyEntitlementDeleteEvent,
  applyEntitlementUpdateEvent,
} from '@app/store/chat/actions/cosmeticsBridge';
import type { BadgeData, PaintData } from '@app/types/seventv/cosmetics';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { generateStvEmoteNotice } from '@app/utils/emote/stv/generateSevenTvEmoteNotice';
import { normalizeSevenTvPaint } from '@app/utils/seventv/cosmetics/normalizeSevenTvPaint';

import { createSevenTvCallbacks } from '../createSevenTvCallbacks';
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
} from './__fixtures__/createSevenTvCallbacks.fixture';

jest.mock('@app/store/chat/actions/cosmetics', () => ({
  addBadge: jest.fn(),
  addPaint: jest.fn(),
  removeBadge: jest.fn(),
  removePaint: jest.fn(),
  removeUserBadge: jest.fn(),
  removeUserPaint: jest.fn(),
  setUserBadge: jest.fn(),
  setUserPaint: jest.fn(),
}));

jest.mock('@app/store/chat/actions/cosmeticsBridge', () => ({
  applyCosmeticCreateEvent: jest.fn(),
  applyEntitlementCreateEvent: jest.fn(),
  applyEntitlementDeleteEvent: jest.fn(),
  applyEntitlementResetEvent: jest.fn(),
  applyEntitlementUpdateEvent: jest.fn(),
}));

jest.mock('@app/utils/logger', () => ({
  logger: { stvWs: { info: jest.fn(), debug: jest.fn() } },
}));

jest.mock('@app/lib/sentry', () => ({
  countMetric: jest.fn(),
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

const mockAddBadge = jest.mocked(addBadge);
const mockCountMetric = jest.mocked(countMetric);
const mockApplyCosmeticCreateEvent = jest.mocked(applyCosmeticCreateEvent);
const mockApplyEntitlementCreateEvent = jest.mocked(
  applyEntitlementCreateEvent,
);

const mockUpdateSevenTvEmotes = jest.fn();
const mockOnEmoteNotice = jest.fn();

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
  });

  describe('return shape', () => {
    test('returns all callbacks and channel/set ids', () => {
      const result = createSevenTvCallbacks(defaultProps);

      expect(result.onEmoteUpdate).toBeDefined();
      expect(result.onCosmeticCreate).toBeDefined();
      expect(result.onEntitlementCreate).toBeDefined();
      expect(result.onCosmeticUpdate).toBeDefined();
      expect(result.onCosmeticDelete).toBeDefined();
      expect(result.onEntitlementUpdate).toBeDefined();
      expect(result.onEntitlementDelete).toBeDefined();
      expect(result.twitchChannelId).toBe('twitch-123');
      expect(result.sevenTvEmoteSetId).toBe('emote-set-1');
    });
  });

  describe('onEmoteUpdate', () => {
    test('calls updateSevenTvEmotes with channelId, added, removed', () => {
      const result = createSevenTvCallbacks(defaultProps);

      act(() => {
        result.onEmoteUpdate({
          channelId: 'c1',
          added: [
            createSevenTvEmote({ id: 'e1', name: 'e1', original_name: 'e1' }),
          ],
          removed: [
            createSevenTvEmote({ id: 'e2', name: 'e2', original_name: 'e2' }),
          ],
        });
      });

      expect(mockUpdateSevenTvEmotes).toHaveBeenCalledWith(
        'c1',
        [createSevenTvEmote({ id: 'e1', name: 'e1', original_name: 'e1' })],
        [createSevenTvEmote({ id: 'e2', name: 'e2', original_name: 'e2' })],
      );
    });

    test('emits notice messages for added and removed emotes', () => {
      const result = createSevenTvCallbacks(defaultProps);

      const added = [
        createSevenTvEmote({ id: 'e1', name: 'Added', original_name: 'Added' }),
      ];
      const removed = [
        createSevenTvEmote({
          id: 'e2',
          name: 'Removed',
          original_name: 'Removed',
        }),
      ];

      act(() => {
        result.onEmoteUpdate({
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

      act(() => {
        result.onEmoteUpdate({
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
      const result = createSevenTvCallbacks(defaultProps);

      act(() => {
        // @ts-expect-error -- exercising runtime guard when cosmetic.object is absent
        result.onCosmeticCreate({ kind: 'BADGE', cosmetic: {} });
      });

      expect(applyCosmeticCreateEvent).not.toHaveBeenCalled();
    });

    test('delegates badge creates to applyCosmeticCreateEvent', () => {
      const result = createSevenTvCallbacks(defaultProps);
      const data = createBadgeCosmeticCreateData(
        createBadgeData({
          id: 'badge-id',
          name: 'Badge',
          tooltip: 'Tip',
        }),
      );

      act(() => {
        result.onCosmeticCreate(data);
      });

      expect(mockApplyCosmeticCreateEvent.mock.calls).toEqual([
        [data.cosmetic, 'BADGE'],
      ]);
    });

    test('delegates paint creates to applyCosmeticCreateEvent', () => {
      const result = createSevenTvCallbacks(defaultProps);
      const data = createPaintCosmeticCreateData(
        createPaintInput({
          id: 'paint-id',
          name: 'Paint',
          color: 0xff0000ff,
        }),
      );

      act(() => {
        result.onCosmeticCreate(data);
      });

      expect(mockApplyCosmeticCreateEvent.mock.calls).toEqual([
        [data.cosmetic, 'PAINT'],
      ]);
    });
  });

  describe('onEntitlementCreate', () => {
    test('delegates to applyEntitlementCreateEvent', () => {
      const result = createSevenTvCallbacks(defaultProps);
      const data = {
        entitlement: {
          id: 'entitlement-1',
          kind: 0,
          object: {
            id: 'entitlement-1',
            kind: 'BADGE' as const,
            ref_id: 'badge-1',
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
        ttvUserId: 'ttv-1',
        paintId: null,
        badgeId: 'badge-1',
      };

      act(() => {
        result.onEntitlementCreate(data);
      });

      expect(mockApplyEntitlementCreateEvent.mock.calls).toEqual([[data]]);
    });
  });

  describe('onCosmeticUpdate', () => {
    test('records a Sentry count metric for paint updates', () => {
      const result = createSevenTvCallbacks(defaultProps);

      act(() => {
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
      });

      expect(addPaint).toHaveBeenCalledWith(
        normalizeSevenTvPaint(
          createPaintInput({ id: 'paint-1', name: 'Updated Paint' }),
        ),
      );
      expect(addPaint).toHaveBeenCalledWith(
        normalizeSevenTvPaint(
          createPaintInput({ id: 'paint-2', name: 'Added Paint' }),
        ),
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
      const result = createSevenTvCallbacks(defaultProps);

      act(() => {
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
      });

      expect(mockAddBadge.mock.calls[0]?.[0]).toEqual<SanitisedBadgeSet>({
        id: 'badge-1',
        provider: '7tv',
        set: 'badge-1',
        title: 'Updated Badge',
        type: '7TV Badge',
        url: 'https://cdn.7tv.app/badge/badge-1/4x.webp',
      });
      expect(mockAddBadge.mock.calls[1]?.[0]).toEqual<SanitisedBadgeSet>({
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
      const result = createSevenTvCallbacks(defaultProps);

      act(() => {
        result.onCosmeticDelete({
          cosmeticId: 'cosmetic-123',
        });
      });

      expect(removeBadge).toHaveBeenCalledWith('cosmetic-123');
      expect(removePaint).toHaveBeenCalledWith('cosmetic-123');
    });
  });

  describe('onEntitlementUpdate', () => {
    test('delegates entitlement updates to the bridge', () => {
      const updateData = createEntitlementUpdateData({
        ttvUserId: 'ttv-1',
        paintId: 'paint-1',
        badgeId: 'badge-1',
      });
      const result = createSevenTvCallbacks(defaultProps);

      act(() => {
        result.onEntitlementUpdate(updateData);
      });

      expect(applyEntitlementUpdateEvent).toHaveBeenCalledWith(updateData);
    });
  });

  describe('onEntitlementDelete', () => {
    test('delegates entitlement deletes to the bridge', () => {
      const deleteData = createEntitlementDeleteData({ ttvUserId: 'ttv-1' });
      const result = createSevenTvCallbacks(defaultProps);

      act(() => {
        result.onEntitlementDelete(deleteData);
      });

      expect(applyEntitlementDeleteEvent).toHaveBeenCalledWith(deleteData);
    });
  });
});
