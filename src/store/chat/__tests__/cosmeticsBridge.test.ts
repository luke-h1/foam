import {
  getBadge,
  getPaint,
  removeUserBadge,
  removeUserPaint,
  setUserBadge,
  setUserPaint,
  syncCachedUserCosmeticsFromStore,
} from '@app/store/chat/actions/cosmetics';
import {
  applyEntitlementCreateEvent,
  applyEntitlementDeleteEvent,
  applyEntitlementResetEvent,
  applyEntitlementUpdateEvent,
  clearEntitlementUserLinkState,
} from '@app/store/chat/actions/cosmeticsBridge';
import { handlePersonalEmoteSetEntitlement } from '@app/store/chat/actions/personalEmotes';
import type { EntitlementCreate } from '@app/types/seventv/cosmetics';

import { createBadgeEntitlement } from './__fixtures__/cosmeticsBridge.fixture';

jest.mock('@app/store/chat/actions/cosmetics', () => ({
  addBadge: jest.fn(),
  addPaint: jest.fn(),
  getBadge: jest.fn(),
  getPaint: jest.fn(),
  removeUserBadge: jest.fn(),
  removeUserPaint: jest.fn(),
  setUserBadge: jest.fn(),
  setUserPaint: jest.fn(),
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
const mockSetUserBadge = jest.mocked(setUserBadge);
const mockSetUserPaint = jest.mocked(setUserPaint);
const mockSyncCachedUserCosmeticsFromStore = jest.mocked(
  syncCachedUserCosmeticsFromStore,
);
const mockRemoveUserBadge = jest.mocked(removeUserBadge);
const mockRemoveUserPaint = jest.mocked(removeUserPaint);
const mockHandlePersonalEmoteSetEntitlement = jest.mocked(
  handlePersonalEmoteSetEntitlement,
);

describe('applyEntitlementCreateEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearEntitlementUserLinkState();
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

    expect(mockSetUserPaint.mock.calls).toEqual([['ttv-1', 'paint-1']]);
  });

  test('binds the badge without issuing an HTTP cosmetics fetch', () => {
    applyEntitlementCreateEvent({
      entitlement: createBadgeEntitlement('badge-1', 'ttv-1'),
      kind: 'BADGE',
      ttvUserId: 'ttv-1',
      paintId: null,
      badgeId: 'badge-1',
    });

    expect(mockSetUserBadge.mock.calls).toEqual([['ttv-1', 'badge-1']]);
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

    expect(mockSetUserPaint.mock.calls).toEqual([['ttv-scummy', 'paint-1']]);
    expect(mockSetUserBadge.mock.calls).toEqual([
      ['ttv-scummy', 'badge-scummy'],
    ]);
    expect(mockHandlePersonalEmoteSetEntitlement.mock.calls).toEqual([
      ['ttv-scummy', 'emote-set-1', 'channel-1'],
    ]);
  });
});

describe('applyEntitlementResetEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearEntitlementUserLinkState();
  });

  test('clears paint and badge bindings for linked Twitch users', () => {
    applyEntitlementCreateEvent({
      entitlement: createBadgeEntitlement('badge-1', 'ttv-1'),
      kind: 'BADGE',
      ttvUserId: 'ttv-1',
      paintId: null,
      badgeId: 'badge-1',
    });

    applyEntitlementResetEvent('stv-user-1');

    expect(mockRemoveUserPaint.mock.calls).toEqual([['ttv-1']]);
    expect(mockRemoveUserBadge.mock.calls).toEqual([['ttv-1']]);
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
  });

  test('updates bindings and syncs the per-user cache', () => {
    applyEntitlementCreateEvent({
      entitlement: createBadgeEntitlement('badge-1', 'ttv-1'),
      kind: 'BADGE',
      ttvUserId: 'ttv-1',
      paintId: null,
      badgeId: 'badge-1',
    });

    applyEntitlementUpdateEvent({
      ttvUserId: 'ttv-1',
      paintId: 'paint-1',
      badgeId: 'badge-2',
    });

    expect(mockSetUserPaint.mock.calls).toEqual([['ttv-1', 'paint-1']]);
    expect(mockSetUserBadge.mock.calls).toEqual([
      ['ttv-1', 'badge-1'],
      ['ttv-1', 'badge-2'],
    ]);
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

    mockRemoveUserPaint.mockClear();
    mockRemoveUserBadge.mockClear();
    mockSyncCachedUserCosmeticsFromStore.mockClear();

    applyEntitlementUpdateEvent({
      ttvUserId: 'ttv-1',
      paintId: null,
      badgeId: null,
    });

    expect(mockRemoveUserPaint).not.toHaveBeenCalled();
    expect(mockRemoveUserBadge).not.toHaveBeenCalled();
    expect(mockSyncCachedUserCosmeticsFromStore).not.toHaveBeenCalled();

    applyEntitlementUpdateEvent({
      ttvUserId: 'ttv-1',
      paintId: 'paint-2',
      badgeId: null,
    });

    expect(mockSetUserPaint.mock.calls.at(-1)).toEqual(['ttv-1', 'paint-2']);
    expect(mockRemoveUserBadge).not.toHaveBeenCalled();
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

    expect(mockRemoveUserPaint).not.toHaveBeenCalled();
    expect(mockRemoveUserBadge.mock.calls).toEqual([['ttv-1']]);
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

    expect(mockRemoveUserPaint).not.toHaveBeenCalled();
    expect(mockRemoveUserBadge.mock.calls).toEqual([['ttv-1']]);
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

    expect(mockRemoveUserPaint.mock.calls).toEqual([['ttv-1']]);
    expect(mockRemoveUserBadge).not.toHaveBeenCalled();
  });

  test('evicts the oldest remembered entitlement id at the link cap', () => {
    for (let index = 0; index <= 2000; index += 1) {
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
      entitlementId: 'entitlement-0',
      ttvUserId: null,
    });

    expect(mockRemoveUserPaint).not.toHaveBeenCalled();
    expect(mockRemoveUserBadge).not.toHaveBeenCalled();

    applyEntitlementDeleteEvent({
      entitlementId: 'entitlement-2000',
      ttvUserId: null,
    });

    expect(mockRemoveUserPaint).not.toHaveBeenCalled();
    expect(mockRemoveUserBadge.mock.calls).toEqual([['ttv-1']]);
  });
});
