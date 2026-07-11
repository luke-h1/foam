import {
  getBadge,
  getPaint,
  getUserBadgeId,
  getUserPaintId,
  removeUserBadge,
  removeUserPaint,
  syncCachedUserCosmeticsFromStore,
} from '@app/store/chat/actions/cosmetics';
import {
  applyEntitlementCreateEvent,
  applyEntitlementDeleteEvent,
  applyEntitlementResetEvent,
  applyEntitlementUpdateEvent,
  clearEntitlementUserLinkState,
  MAX_SEVEN_TV_USER_LINK_ENTRIES,
} from '@app/store/chat/actions/cosmeticsBridge';
import { handlePersonalEmoteSetEntitlement } from '@app/store/chat/actions/personalEmotes';
import type { EntitlementCreate } from '@app/types/seventv/cosmetics';

import { createBadgeEntitlement } from './__fixtures__/cosmeticsBridge.fixture';

const mockUserPaintBindings = new Map<string, string>();
const mockUserBadgeBindings = new Map<string, string>();

jest.mock('@app/store/chat/actions/cosmetics', () => ({
  addBadge: jest.fn(),
  addPaint: jest.fn(),
  getBadge: jest.fn(),
  getPaint: jest.fn(),
  getUserBadgeId: jest.fn((ttvUserId: string) =>
    mockUserBadgeBindings.get(ttvUserId),
  ),
  getUserPaintId: jest.fn((ttvUserId: string) =>
    mockUserPaintBindings.get(ttvUserId),
  ),
  removeUserBadge: jest.fn((ttvUserId: string) => {
    mockUserBadgeBindings.delete(ttvUserId);
  }),
  removeUserPaint: jest.fn((ttvUserId: string) => {
    mockUserPaintBindings.delete(ttvUserId);
  }),
  setUserBadge: jest.fn((ttvUserId: string, badgeId: string) => {
    mockUserBadgeBindings.set(ttvUserId, badgeId);
  }),
  setUserPaint: jest.fn((ttvUserId: string, paintId: string) => {
    mockUserPaintBindings.set(ttvUserId, paintId);
  }),
  syncCachedUserCosmeticsFromStore: jest.fn(),
}));

jest.mock('@app/store/chat/actions/personalEmotes', () => ({
  handlePersonalEmoteSetEntitlement: jest.fn(),
}));

jest.mock('@app/store/chat/observables/chatStore', () => ({
  chatStore$: {
    currentChannelId: { peek: jest.fn(() => 'channel-1') },
  },
}));

jest.mock('@app/utils/logger', () => ({
  logger: {
    stv: { warn: jest.fn() },
    stvWs: { info: jest.fn(), debug: jest.fn(), warn: jest.fn() },
  },
}));

const mockGetBadge = jest.mocked(getBadge);
const mockGetPaint = jest.mocked(getPaint);
const mockSyncCachedUserCosmeticsFromStore = jest.mocked(
  syncCachedUserCosmeticsFromStore,
);
const mockRemoveUserBadge = jest.mocked(removeUserBadge);
const mockRemoveUserPaint = jest.mocked(removeUserPaint);
const mockHandlePersonalEmoteSetEntitlement = jest.mocked(
  handlePersonalEmoteSetEntitlement,
);

const resetUserBindings = () => {
  mockUserPaintBindings.clear();
  mockUserBadgeBindings.clear();
};

describe('applyEntitlementCreateEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearEntitlementUserLinkState();
    resetUserBindings();
    mockGetBadge.mockReturnValue(undefined);
    mockGetPaint.mockReturnValue(undefined);
  });

  test('binds paints without fetching missing definitions', () => {
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
  });

  test('binds the badge without issuing an HTTP cosmetics fetch', () => {
    applyEntitlementCreateEvent({
      entitlement: createBadgeEntitlement('badge-1', 'ttv-1'),
      kind: 'BADGE',
      ttvUserId: 'ttv-1',
      paintId: null,
      badgeId: 'badge-1',
    });

    expect(getUserBadgeId('ttv-1')).toBe('badge-1');
    expect(getUserPaintId('ttv-1')).toBeUndefined();
    expect(mockSyncCachedUserCosmeticsFromStore.mock.calls).toEqual([
      ['stv-user-1', 'ttv-1'],
    ]);
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
    // Resolving the personal emote set from an EMOTE_SET entitlement is a
    // fire-and-forget side effect, so assert the dispatch itself here.
    expect(mockHandlePersonalEmoteSetEntitlement.mock.calls).toEqual([
      ['ttv-scummy', 'emote-set-1', 'channel-1'],
    ]);
  });
});

describe('applyEntitlementResetEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearEntitlementUserLinkState();
    resetUserBindings();
  });

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
    expect(mockSyncCachedUserCosmeticsFromStore.mock.calls).toEqual([
      ['stv-user-1', 'ttv-1'],
      ['stv-user-1', 'ttv-1'],
    ]);
  });

  test('clears reverse 7TV user links when entitlements reset', () => {
    applyEntitlementCreateEvent({
      entitlement: createBadgeEntitlement('badge-1', 'ttv-1'),
      kind: 'BADGE',
      ttvUserId: 'ttv-1',
      paintId: null,
      badgeId: 'badge-1',
    });

    applyEntitlementResetEvent('stv-user-1');
    mockSyncCachedUserCosmeticsFromStore.mockClear();

    applyEntitlementUpdateEvent({
      ttvUserId: 'ttv-1',
      paintId: 'paint-1',
      badgeId: null,
    });

    expect(mockSyncCachedUserCosmeticsFromStore).not.toHaveBeenCalled();
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
  beforeEach(() => {
    jest.clearAllMocks();
    clearEntitlementUserLinkState();
    resetUserBindings();
  });

  test('updates bindings and syncs the per-user cache', () => {
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
    expect(mockSyncCachedUserCosmeticsFromStore.mock.calls.at(-1)).toEqual([
      'stv-user-1',
      'ttv-1',
    ]);
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

    mockSyncCachedUserCosmeticsFromStore.mockClear();

    applyEntitlementUpdateEvent({
      ttvUserId: 'ttv-1',
      paintId: null,
      badgeId: null,
    });

    // An empty update must leave the prior bindings in place and skip the cache
    // sync entirely.
    expect(getUserBadgeId('ttv-1')).toBe('badge-1');
    expect(getUserPaintId('ttv-1')).toBe('paint-1');
    expect(mockSyncCachedUserCosmeticsFromStore).not.toHaveBeenCalled();

    applyEntitlementUpdateEvent({
      ttvUserId: 'ttv-1',
      paintId: 'paint-2',
      badgeId: null,
    });

    expect(getUserPaintId('ttv-1')).toBe('paint-2');
    expect(getUserBadgeId('ttv-1')).toBe('badge-1');
    expect(mockSyncCachedUserCosmeticsFromStore.mock.calls.at(-1)).toEqual([
      'stv-user-1',
      'ttv-1',
    ]);
  });
});

describe('applyEntitlementDeleteEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearEntitlementUserLinkState();
    resetUserBindings();
  });

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
    expect(mockSyncCachedUserCosmeticsFromStore.mock.calls.at(-1)).toEqual([
      'stv-user-1',
      'ttv-1',
    ]);
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
    expect(mockSyncCachedUserCosmeticsFromStore.mock.calls.at(-1)).toEqual([
      'stv-user-1',
      'ttv-1',
    ]);
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

  // Insert one entitlement past the cap so exactly the first-inserted link
  // (entitlement-0) is evicted while entitlement-1 becomes the boundary
  // survivor. Deriving the loop bound from the cap keeps the boundary indices
  // in step with the source constant.
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
    mockSyncCachedUserCosmeticsFromStore.mockClear();

    applyEntitlementDeleteEvent({
      entitlementId: `entitlement-${EVICTED_ENTITLEMENT_INDEX}`,
      ttvUserId: 'ttv-1',
    });

    // Even with an explicit Twitch id, an evicted (unremembered) entitlement
    // delete leaves the bindings and cache untouched.
    expect(mockRemoveUserPaint).not.toHaveBeenCalled();
    expect(mockRemoveUserBadge).not.toHaveBeenCalled();
    expect(mockSyncCachedUserCosmeticsFromStore).not.toHaveBeenCalled();
    expect(getUserBadgeId('ttv-1')).toBe(`badge-${OVER_CAP_INDEX}`);
  });
});
