// oxlint-disable anti-slop/no-shape-in-symbol-names -- mirrors the 7TV paint API shape field (types/seven-tv/cosmetics.ts)
import { createSevenTvEmote } from '@app/components/chat/hooks/__tests__/__fixtures__/use-chat.fixture';
import { sevenTvService } from '@app/services/seven-tv-service';
import {
  addBadge,
  addPaint,
  clearUserCosmeticsCache,
  getUserBadgeId,
  getUserPaintId,
  setUserPaint,
} from '@app/store/chat/actions/cosmetics';
import {
  applyEntitlementCreateEvent,
  applyEntitlementDeleteEvent,
  applyEntitlementResetEvent,
  applyEntitlementUpdateEvent,
} from '@app/store/chat/actions/cosmetics-bridge';
import {
  clearEntitlementUserLinkState,
  getSevenTvUserIdForTwitchId,
  MAX_SEVEN_TV_USER_LINK_ENTRIES,
} from '@app/store/chat/actions/cosmetics-links';
import {
  clearPersonalEmotesCache,
  fetchUserPersonalEmotes,
  getUserPersonalEmotes,
} from '@app/store/chat/actions/personal-emotes';
import { chatStore$ } from '@app/store/chat/observables/chat-store';
import type {
  EntitlementCreate,
  PaintData,
} from '@app/types/seven-tv/cosmetics';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { logger } from '@app/utils/logger';

import { createBadgeEntitlement } from './__fixtures__/cosmetics-bridge.fixture';

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

interface UserBindings {
  paintId: string | undefined;
  badgeId: string | undefined;
}

const rebound: UserBindings = { paintId: 'paint-1', badgeId: 'badge-1' };

function readBindings(): UserBindings {
  return {
    paintId: getUserPaintId('ttv-1'),
    badgeId: getUserBadgeId('ttv-1'),
  };
}

function bindPaintAndBadge() {
  addBadge(cachedBadge);
  applyEntitlementUpdateEvent({
    ttvUserId: 'ttv-1',
    paintId: 'paint-1',
    badgeId: 'badge-1',
  });
}

function resetChatStore(): void {
  chatStore$.currentChannelId.set('channel-1');
  chatStore$.paints.set({});
  chatStore$.badges.set({});
  chatStore$.userPaintIds.set({});
  chatStore$.userBadgeIds.set({});
}

let mockGetUserCosmeticsGql: jest.SpiedFunction<
  typeof sevenTvService.getUserCosmeticsGql
>;

let mockGetPersonalEmoteSet: jest.SpiedFunction<
  typeof sevenTvService.getPersonalEmoteSet
>;

async function settleBackgroundFetches() {
  for (let step = 0; step < 5; step += 1) {
    // eslint-disable-next-line react-doctor/async-await-in-loop -- each fetch step must settle before the next one starts
    await new Promise(resolve => {
      setImmediate(resolve);
    });
  }
}

beforeEach(() => {
  jest.restoreAllMocks();
  resetChatStore();
  clearUserCosmeticsCache();
  clearEntitlementUserLinkState();
  clearPersonalEmotesCache();

  jest.spyOn(sevenTvService, 'get7tvUserId').mockResolvedValue('stv-user-1');

  mockGetUserCosmeticsGql = jest
    .spyOn(sevenTvService, 'getUserCosmeticsGql')
    .mockResolvedValue(null);

  mockGetPersonalEmoteSet = jest
    .spyOn(sevenTvService, 'getPersonalEmoteSet')
    .mockResolvedValue([]);

  jest.spyOn(logger.stv, 'warn').mockImplementation(() => {});
  jest.spyOn(logger.stvWs, 'info').mockImplementation(() => {});
});

describe('applyEntitlementCreateEvent', () => {
  test('binds paints and hydrates the definition when it is missing', async () => {
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

    await settleBackgroundFetches();

    expect(getUserPaintId('ttv-1')).toBe('paint-1');

    expect(getUserBadgeId('ttv-1')).toBeUndefined();

    expect(mockGetUserCosmeticsGql.mock.calls).toEqual([['stv-user-1']]);
  });

  test('does not refetch when the paint definition is already cached', async () => {
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

    await settleBackgroundFetches();

    expect(getUserPaintId('ttv-1')).toBe('paint-1');

    expect(mockGetUserCosmeticsGql).not.toHaveBeenCalled();
  });

  test('binds badges and hydrates the definition when it is missing', async () => {
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

    await settleBackgroundFetches();

    expect(mockGetUserCosmeticsGql.mock.calls).toEqual([['stv-user-1']]);
  });

  test('does not refetch when the badge definition is already cached', async () => {
    addBadge(cachedBadge);

    applyEntitlementCreateEvent({
      entitlement: createBadgeEntitlement('badge-1', 'ttv-1'),
      kind: 'BADGE',
      ttvUserId: 'ttv-1',
      paintId: null,
      badgeId: 'badge-1',
    });

    await settleBackgroundFetches();

    expect(getUserBadgeId('ttv-1')).toBe('badge-1');

    expect(mockGetUserCosmeticsGql).not.toHaveBeenCalled();
  });

  test('binds style paint and badge on EMOTE_SET entitlements and refreshes personal emotes', async () => {
    const oldPersonalEmote = createSevenTvEmote({ id: 'old-personal' });

    const newPersonalEmote = createSevenTvEmote({
      id: 'new-personal',
      set_metadata: {
        ...oldPersonalEmote.set_metadata,
        setId: 'emote-set-1',
      },
    });

    mockGetPersonalEmoteSet
      .mockResolvedValueOnce([oldPersonalEmote])
      .mockResolvedValueOnce([newPersonalEmote]);

    await fetchUserPersonalEmotes('ttv-scummy', 'channel-1');

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

    await settleBackgroundFetches();

    expect(getUserPaintId('ttv-scummy')).toBe('paint-1');

    expect(getUserBadgeId('ttv-scummy')).toBe('badge-scummy');

    expect(mockGetUserCosmeticsGql.mock.calls).toEqual([['stv-user-1']]);

    expect(
      getUserPersonalEmotes('ttv-scummy', 'channel-1').map(emote => emote.id),
    ).toEqual(['new-personal']);
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
    bindPaintAndBadge();

    applyEntitlementDeleteEvent({
      entitlementId: 'entitlement-badge-1',
      ttvUserId: null,
    });

    expect(readBindings()).toEqual(rebound);
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
    bindPaintAndBadge();

    applyEntitlementDeleteEvent({
      entitlementId: 'entitlement-1',
      ttvUserId: null,
    });

    applyEntitlementDeleteEvent({
      entitlementId: 'entitlement-2',
      ttvUserId: null,
    });

    expect(readBindings()).toEqual(rebound);
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

    setUserPaint('ttv-1', 'paint-1');

    applyEntitlementDeleteEvent({
      entitlementId: 'entitlement-badge-1',
      ttvUserId: 'ttv-1',
    });

    expect(readBindings()).toEqual({ paintId: 'paint-1', badgeId: undefined });
  });

  test('clears only the badge binding when delete resolves the twitch user from a remembered entitlement id', () => {
    applyEntitlementCreateEvent({
      entitlement: createBadgeEntitlement('badge-1', 'ttv-1'),
      kind: 'BADGE',
      ttvUserId: 'ttv-1',
      paintId: null,
      badgeId: 'badge-1',
    });

    setUserPaint('ttv-1', 'paint-1');

    applyEntitlementDeleteEvent({
      entitlementId: 'entitlement-badge-1',
      ttvUserId: null,
    });

    expect(readBindings()).toEqual({ paintId: 'paint-1', badgeId: undefined });
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

    addBadge(cachedBadge);
    applyEntitlementUpdateEvent({
      ttvUserId: 'ttv-1',
      paintId: null,
      badgeId: 'badge-1',
    });

    applyEntitlementDeleteEvent({
      entitlementId: 'entitlement-paint-1',
      ttvUserId: null,
    });

    expect(readBindings()).toEqual({ paintId: undefined, badgeId: 'badge-1' });
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

    setUserPaint('ttv-1', 'paint-1');

    // The evicted link can no longer resolve its Twitch user, so the delete is
    // a no-op.
    applyEntitlementDeleteEvent({
      entitlementId: `entitlement-${EVICTED_ENTITLEMENT_INDEX}`,
      ttvUserId: null,
    });

    expect(readBindings()).toEqual({
      paintId: 'paint-1',
      badgeId: `badge-${OVER_CAP_INDEX}`,
    });

    // The very next entitlement (the new oldest) is still remembered and does
    // clear the badge binding.
    applyEntitlementDeleteEvent({
      entitlementId: `entitlement-${BOUNDARY_SURVIVOR_INDEX}`,
      ttvUserId: null,
    });

    expect(readBindings()).toEqual({ paintId: 'paint-1', badgeId: undefined });
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

    setUserPaint('ttv-1', 'paint-1');

    applyEntitlementDeleteEvent({
      entitlementId: `entitlement-${EVICTED_ENTITLEMENT_INDEX}`,
      ttvUserId: 'ttv-1',
    });

    // Even with an explicit Twitch id, an evicted (unremembered) entitlement
    // delete leaves the bindings untouched.
    expect(readBindings()).toEqual({
      paintId: 'paint-1',
      badgeId: `badge-${OVER_CAP_INDEX}`,
    });
  });
});
