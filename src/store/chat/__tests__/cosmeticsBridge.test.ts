// oxlint-disable anti-slop/no-shape-in-symbol-names -- mirrors the 7TV paint API shape field (types/seventv/cosmetics.ts)
import * as cosmetics from '@app/store/chat/actions/cosmetics';
import {
  addBadge,
  addPaint,
  getUserBadgeId,
  getUserPaintId,
} from '@app/store/chat/actions/cosmetics';
import {
  applyEntitlementCreateEvent,
  applyEntitlementDeleteEvent,
  applyEntitlementResetEvent,
  applyEntitlementUpdateEvent,
} from '@app/store/chat/actions/cosmeticsBridge';
import {
  clearEntitlementUserLinkState,
  getSevenTvUserIdForTwitchId,
  MAX_SEVEN_TV_USER_LINK_ENTRIES,
} from '@app/store/chat/actions/cosmeticsLinks';
import * as personalEmotes from '@app/store/chat/actions/personalEmotes';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import type {
  EntitlementCreate,
  PaintData,
} from '@app/types/seventv/cosmetics';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { logger } from '@app/utils/logger';

import { createBadgeEntitlement } from './__fixtures__/cosmeticsBridge.fixture';

const cachedPaint = {
  id: 'paint-1',
  name: 'Cached Paint',
  color: null,
  layers: { length: 0 },
  shadows: { length: 0 },
  textStyle: null,
  function: 'LINEAR_GRADIENT',
  repeat: false,
  angle: 90,
  shape: 'circle',
  image_url: '',
  stops: { length: 0 },
} satisfies PaintData;

const cachedBadge = {
  id: 'badge-1',
  url: 'https://cdn.7tv.app/badge/badge-1/3x',
  type: '7TV Badge',
  title: 'Cached Badge',
  set: 'seventv-badges',
  provider: '7tv',
} satisfies SanitisedBadgeSet;

function resetChatStore(): void {
  chatStore$.currentChannelId.set('channel-1');
  chatStore$.paints.set({});
  chatStore$.badges.set({});
  chatStore$.userPaintIds.set({});
  chatStore$.userBadgeIds.set({});
}

let mockFetchUserCosmeticsByTwitchId: jest.SpiedFunction<
  typeof cosmetics.fetchUserCosmeticsByTwitchId
>;
let mockRemoveUserBadge: jest.SpiedFunction<typeof cosmetics.removeUserBadge>;
let mockRemoveUserCosmetics: jest.SpiedFunction<
  typeof cosmetics.removeUserCosmetics
>;
let mockRemoveUserPaint: jest.SpiedFunction<typeof cosmetics.removeUserPaint>;
let mockHandlePersonalEmoteSetEntitlement: jest.SpiedFunction<
  typeof personalEmotes.handlePersonalEmoteSetEntitlement
>;

beforeEach(() => {
  jest.clearAllMocks();
  resetChatStore();
  clearEntitlementUserLinkState();

  mockFetchUserCosmeticsByTwitchId = jest
    .spyOn(cosmetics, 'fetchUserCosmeticsByTwitchId')
    .mockResolvedValue(undefined);
  mockRemoveUserBadge = jest.spyOn(cosmetics, 'removeUserBadge');
  mockRemoveUserCosmetics = jest.spyOn(cosmetics, 'removeUserCosmetics');
  mockRemoveUserPaint = jest.spyOn(cosmetics, 'removeUserPaint');
  mockHandlePersonalEmoteSetEntitlement = jest
    .spyOn(personalEmotes, 'handlePersonalEmoteSetEntitlement')
    .mockImplementation(() => {});
  jest.spyOn(logger.stv, 'warn').mockImplementation(() => {});
  jest.spyOn(logger.stvWs, 'info').mockImplementation(() => {});
});

describe('applyEntitlementCreateEvent', () => {
  test('binds paints and hydrates the definition when it is missing', () => {
    const entitlement: EntitlementCreate = {
      id: 'entitlement-paint-1',
      kind: 0,
      object: {
        id: 'entitlement-paint-1',
        kind: 'PAINT',
        ref_id: 'paint-1',
        user: createBadgeEntitlement('badge-1', 'ttv-1').object.user,
      },
    };

    applyEntitlementCreateEvent({
      entitlement,
      kind: 'PAINT',
      ttvUserId: 'ttv-1',
      paintId: 'paint-1',
      badgeId: null,
    });

    expect(getUserPaintId('ttv-1')).toBe('paint-1');
    expect(getUserBadgeId('ttv-1')).toBeUndefined();
    expect(mockFetchUserCosmeticsByTwitchId.mock.calls).toEqual([['ttv-1']]);
  });

  test('does not refetch when the paint definition is already cached', () => {
    addPaint(cachedPaint);

    applyEntitlementCreateEvent({
      entitlement: {
        id: 'entitlement-paint-1',
        kind: 0,
        object: {
          id: 'entitlement-paint-1',
          kind: 'PAINT',
          ref_id: 'paint-1',
          user: createBadgeEntitlement('badge-1', 'ttv-1').object.user,
        },
      },
      kind: 'PAINT',
      ttvUserId: 'ttv-1',
      paintId: 'paint-1',
      badgeId: null,
    });

    expect(getUserPaintId('ttv-1')).toBe('paint-1');
    expect(mockFetchUserCosmeticsByTwitchId).not.toHaveBeenCalled();
  });

  test('binds badges and hydrates the definition when it is missing', () => {
    applyEntitlementCreateEvent({
      entitlement: createBadgeEntitlement('badge-1', 'ttv-1'),
      kind: 'BADGE',
      ttvUserId: 'ttv-1',
      paintId: null,
      badgeId: 'badge-1',
    });

    expect(getUserBadgeId('ttv-1')).toBe('badge-1');
    expect(getUserPaintId('ttv-1')).toBeUndefined();
    expect(getSevenTvUserIdForTwitchId('ttv-1')).toBe('stv-user-1');
    expect(mockFetchUserCosmeticsByTwitchId.mock.calls).toEqual([['ttv-1']]);
  });

  test('does not refetch when the badge definition is already cached', () => {
    addBadge(cachedBadge);

    applyEntitlementCreateEvent({
      entitlement: createBadgeEntitlement('badge-1', 'ttv-1'),
      kind: 'BADGE',
      ttvUserId: 'ttv-1',
      paintId: null,
      badgeId: 'badge-1',
    });

    expect(getUserBadgeId('ttv-1')).toBe('badge-1');
    expect(mockFetchUserCosmeticsByTwitchId).not.toHaveBeenCalled();
  });

  test('binds style paint and badge on EMOTE_SET entitlements', () => {
    const entitlement: EntitlementCreate = {
      id: 'entitlement-emote-set-1',
      kind: 0,
      object: {
        id: 'entitlement-emote-set-1',
        kind: 'EMOTE_SET',
        ref_id: 'emote-set-1',
        user: createBadgeEntitlement('badge-1', 'ttv-scummy').object.user,
      },
    };

    applyEntitlementCreateEvent({
      entitlement,
      kind: 'EMOTE_SET',
      ttvUserId: 'ttv-scummy',
      paintId: 'paint-1',
      badgeId: 'badge-scummy',
    });

    expect(getUserPaintId('ttv-scummy')).toBe('paint-1');
    expect(getUserBadgeId('ttv-scummy')).toBe('badge-scummy');
    expect(mockFetchUserCosmeticsByTwitchId.mock.calls).toEqual([
      ['ttv-scummy'],
    ]);
    // Resolving the personal emote set from an EMOTE_SET entitlement is a
    // fire-and-forget side effect, so assert the dispatch itself here.
    expect(mockHandlePersonalEmoteSetEntitlement.mock.calls).toEqual([
      ['ttv-scummy', 'emote-set-1', 'channel-1'],
    ]);
  });
});

describe('applyEntitlementResetEvent', () => {
  test('clears paint and badge bindings for linked Twitch users', () => {
    applyEntitlementCreateEvent({
      entitlement: createBadgeEntitlement('badge-1', 'ttv-1'),
      kind: 'BADGE',
      ttvUserId: 'ttv-1',
      paintId: null,
      badgeId: 'badge-1',
    });

    expect(getUserBadgeId('ttv-1')).toBe('badge-1');

    applyEntitlementResetEvent('stv-user-1');

    expect(getUserPaintId('ttv-1')).toBeUndefined();
    expect(getUserBadgeId('ttv-1')).toBeUndefined();
    expect(mockRemoveUserCosmetics.mock.calls).toEqual([['ttv-1']]);
    expect(mockRemoveUserPaint).not.toHaveBeenCalled();
    expect(mockRemoveUserBadge).not.toHaveBeenCalled();
  });

  test('clears reverse 7TV user links when entitlements reset', () => {
    applyEntitlementCreateEvent({
      entitlement: createBadgeEntitlement('badge-1', 'ttv-1'),
      kind: 'BADGE',
      ttvUserId: 'ttv-1',
      paintId: null,
      badgeId: 'badge-1',
    });

    expect(getSevenTvUserIdForTwitchId('ttv-1')).toBe('stv-user-1');

    applyEntitlementResetEvent('stv-user-1');

    expect(getSevenTvUserIdForTwitchId('ttv-1')).toBeUndefined();
  });

  test('forgets remembered entitlement ids when entitlements reset', () => {
    applyEntitlementCreateEvent({
      entitlement: createBadgeEntitlement('badge-1', 'ttv-1'),
      kind: 'BADGE',
      ttvUserId: 'ttv-1',
      paintId: null,
      badgeId: 'badge-1',
    });

    applyEntitlementResetEvent('stv-user-1');
    mockRemoveUserPaint.mockClear();
    mockRemoveUserBadge.mockClear();

    applyEntitlementDeleteEvent({
      entitlementId: 'entitlement-badge-1',
      ttvUserId: null,
    });

    expect(mockRemoveUserPaint).not.toHaveBeenCalled();
    expect(mockRemoveUserBadge).not.toHaveBeenCalled();
  });

  test('forgets every remembered entitlement id for a user when entitlements reset', () => {
    applyEntitlementCreateEvent({
      entitlement: createBadgeEntitlement('badge-1', 'ttv-1', 'entitlement-1'),
      kind: 'BADGE',
      ttvUserId: 'ttv-1',
      paintId: null,
      badgeId: 'badge-1',
    });
    applyEntitlementCreateEvent({
      entitlement: createBadgeEntitlement('badge-2', 'ttv-1', 'entitlement-2'),
      kind: 'BADGE',
      ttvUserId: 'ttv-1',
      paintId: null,
      badgeId: 'badge-2',
    });

    applyEntitlementResetEvent('stv-user-1');
    mockRemoveUserPaint.mockClear();
    mockRemoveUserBadge.mockClear();

    applyEntitlementDeleteEvent({
      entitlementId: 'entitlement-1',
      ttvUserId: null,
    });
    applyEntitlementDeleteEvent({
      entitlementId: 'entitlement-2',
      ttvUserId: null,
    });

    expect(mockRemoveUserPaint).not.toHaveBeenCalled();
    expect(mockRemoveUserBadge).not.toHaveBeenCalled();
  });
});

describe('applyEntitlementUpdateEvent', () => {
  test('updates bindings for linked users', () => {
    applyEntitlementCreateEvent({
      entitlement: createBadgeEntitlement('badge-1', 'ttv-1'),
      kind: 'BADGE',
      ttvUserId: 'ttv-1',
      paintId: null,
      badgeId: 'badge-1',
    });

    expect(getUserBadgeId('ttv-1')).toBe('badge-1');

    applyEntitlementUpdateEvent({
      ttvUserId: 'ttv-1',
      paintId: 'paint-1',
      badgeId: 'badge-2',
    });

    expect(getUserPaintId('ttv-1')).toBe('paint-1');
    expect(getUserBadgeId('ttv-1')).toBe('badge-2');
  });

  test('does not remove existing cosmetics when an update omits paint or badge ids', () => {
    applyEntitlementCreateEvent({
      entitlement: createBadgeEntitlement('badge-1', 'ttv-1'),
      kind: 'BADGE',
      ttvUserId: 'ttv-1',
      paintId: null,
      badgeId: 'badge-1',
    });
    applyEntitlementCreateEvent({
      entitlement: {
        id: 'entitlement-paint-1',
        kind: 0,
        object: {
          id: 'entitlement-paint-1',
          kind: 'PAINT',
          ref_id: 'paint-1',
          user: createBadgeEntitlement('badge-1', 'ttv-1').object.user,
        },
      },
      kind: 'PAINT',
      ttvUserId: 'ttv-1',
      paintId: 'paint-1',
      badgeId: null,
    });

    applyEntitlementUpdateEvent({
      ttvUserId: 'ttv-1',
      paintId: null,
      badgeId: null,
    });

    // An empty update must leave the prior bindings in place.
    expect(getUserBadgeId('ttv-1')).toBe('badge-1');
    expect(getUserPaintId('ttv-1')).toBe('paint-1');

    applyEntitlementUpdateEvent({
      ttvUserId: 'ttv-1',
      paintId: 'paint-2',
      badgeId: null,
    });

    expect(getUserPaintId('ttv-1')).toBe('paint-2');
    expect(getUserBadgeId('ttv-1')).toBe('badge-1');
  });
});

describe('applyEntitlementDeleteEvent', () => {
  test('clears only the badge binding for a remembered badge entitlement delete', () => {
    applyEntitlementCreateEvent({
      entitlement: createBadgeEntitlement('badge-1', 'ttv-1'),
      kind: 'BADGE',
      ttvUserId: 'ttv-1',
      paintId: null,
      badgeId: 'badge-1',
    });

    applyEntitlementDeleteEvent({
      entitlementId: 'entitlement-badge-1',
      ttvUserId: 'ttv-1',
    });

    expect(getUserBadgeId('ttv-1')).toBeUndefined();
    expect(mockRemoveUserPaint).not.toHaveBeenCalled();
  });

  test('clears only the badge binding when delete resolves the twitch user from a remembered entitlement id', () => {
    applyEntitlementCreateEvent({
      entitlement: createBadgeEntitlement('badge-1', 'ttv-1'),
      kind: 'BADGE',
      ttvUserId: 'ttv-1',
      paintId: null,
      badgeId: 'badge-1',
    });

    applyEntitlementDeleteEvent({
      entitlementId: 'entitlement-badge-1',
      ttvUserId: null,
    });

    expect(getUserBadgeId('ttv-1')).toBeUndefined();
    expect(mockRemoveUserPaint).not.toHaveBeenCalled();
  });

  test('clears only the paint binding for a remembered paint entitlement delete', () => {
    const entitlement: EntitlementCreate = {
      id: 'entitlement-paint-1',
      kind: 0,
      object: {
        id: 'entitlement-paint-1',
        kind: 'PAINT',
        ref_id: 'paint-1',
        user: createBadgeEntitlement('badge-1', 'ttv-1').object.user,
      },
    };

    applyEntitlementCreateEvent({
      entitlement,
      kind: 'PAINT',
      ttvUserId: 'ttv-1',
      paintId: 'paint-1',
      badgeId: null,
    });

    applyEntitlementDeleteEvent({
      entitlementId: 'entitlement-paint-1',
      ttvUserId: null,
    });

    expect(getUserPaintId('ttv-1')).toBeUndefined();
    expect(mockRemoveUserBadge).not.toHaveBeenCalled();
  });

  // One entitlement past the cap evicts exactly entitlement-0; deriving the
  // bound from the cap keeps the boundary indices in step with the constant.
  const OVER_CAP_INDEX = MAX_SEVEN_TV_USER_LINK_ENTRIES;
  const EVICTED_ENTITLEMENT_INDEX = 0;
  const BOUNDARY_SURVIVOR_INDEX = 1;

  test('evicts the oldest remembered entitlement id at the link cap', () => {
    for (let index = 0; index <= OVER_CAP_INDEX; index += 1) {
      applyEntitlementCreateEvent({
        entitlement: createBadgeEntitlement(
          `badge-${index}`,
          'ttv-1',
          `entitlement-${index}`,
        ),
        kind: 'BADGE',
        ttvUserId: 'ttv-1',
        paintId: null,
        badgeId: `badge-${index}`,
      });
    }

    mockRemoveUserPaint.mockClear();
    mockRemoveUserBadge.mockClear();

    // The evicted link can no longer resolve its Twitch user, so the delete is
    // a no-op.
    applyEntitlementDeleteEvent({
      entitlementId: `entitlement-${EVICTED_ENTITLEMENT_INDEX}`,
      ttvUserId: null,
    });

    expect(mockRemoveUserPaint).not.toHaveBeenCalled();
    expect(mockRemoveUserBadge).not.toHaveBeenCalled();

    // The very next entitlement (the new oldest) is still remembered and does
    // clear the badge binding.
    applyEntitlementDeleteEvent({
      entitlementId: `entitlement-${BOUNDARY_SURVIVOR_INDEX}`,
      ttvUserId: null,
    });

    expect(mockRemoveUserPaint).not.toHaveBeenCalled();
    expect(mockRemoveUserBadge.mock.calls).toEqual([['ttv-1']]);
    expect(getUserBadgeId('ttv-1')).toBeUndefined();
  });

  test('does not clear paint or badge when an evicted entitlement delete still has a twitch user id', () => {
    for (let index = 0; index <= OVER_CAP_INDEX; index += 1) {
      applyEntitlementCreateEvent({
        entitlement: createBadgeEntitlement(
          `badge-${index}`,
          'ttv-1',
          `entitlement-${index}`,
        ),
        kind: 'BADGE',
        ttvUserId: 'ttv-1',
        paintId: null,
        badgeId: `badge-${index}`,
      });
    }

    mockRemoveUserPaint.mockClear();
    mockRemoveUserBadge.mockClear();

    applyEntitlementDeleteEvent({
      entitlementId: `entitlement-${EVICTED_ENTITLEMENT_INDEX}`,
      ttvUserId: 'ttv-1',
    });

    // Even with an explicit Twitch id, an evicted (unremembered) entitlement
    // delete leaves the bindings untouched.
    expect(mockRemoveUserPaint).not.toHaveBeenCalled();
    expect(mockRemoveUserBadge).not.toHaveBeenCalled();
    expect(getUserBadgeId('ttv-1')).toBe(`badge-${OVER_CAP_INDEX}`);
  });
});
