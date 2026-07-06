import { sevenTvService } from '@app/services/seventv-service';
import {
  addBadge,
  getBadge,
  getPaint,
  setUserBadge,
  setUserPaint,
} from '@app/store/chat/actions/cosmetics';
import {
  applyEntitlementCreateEvent,
  clearBridgeCosmeticsState,
  requestUserCosmetics,
} from '@app/store/chat/actions/cosmeticsBridge';
import type {
  BadgeData,
  EntitlementCreate,
  SevenTvEventData,
  SevenTvEventType,
} from '@app/types/seventv/cosmetics';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

jest.mock('@app/services/seventv-service', () => ({
  sevenTvService: {
    fetchBridgedCosmetics: jest.fn(),
  },
}));

jest.mock('@app/store/chat/actions/cosmetics', () => ({
  addBadge: jest.fn(),
  addPaint: jest.fn(),
  getBadge: jest.fn(),
  getPaint: jest.fn(),
  setUserBadge: jest.fn(),
  setUserPaint: jest.fn(),
}));

jest.mock('@app/utils/logger', () => ({
  logger: {
    stv: { warn: jest.fn() },
    stvWs: { info: jest.fn(), debug: jest.fn(), warn: jest.fn() },
  },
}));

const mockFetchBridgedCosmetics = jest.mocked(
  sevenTvService.fetchBridgedCosmetics,
);
const mockAddBadge = jest.mocked(addBadge);
const mockGetBadge = jest.mocked(getBadge);
const mockGetPaint = jest.mocked(getPaint);
const mockSetUserBadge = jest.mocked(setUserBadge);
const mockSetUserPaint = jest.mocked(setUserPaint);

function createBadgeData(id: string): BadgeData {
  return {
    id,
    name: `Badge ${id}`,
    tooltip: `Badge ${id}`,
    host: { url: `https://cdn.7tv.app/badge/${id}`, files: [] },
  };
}

function createBadgeCosmeticCreateEvent(
  badgeId: string,
): SevenTvEventData<SevenTvEventType> {
  return {
    type: 'cosmetic.create',
    body: {
      id: badgeId,
      kind: 0,
      object: {
        id: badgeId,
        kind: 'BADGE',
        data: createBadgeData(badgeId),
      },
    },
  };
}

function createBadgeEntitlement(
  badgeId: string,
  ttvUserId: string,
): EntitlementCreate {
  return {
    id: `entitlement-${badgeId}`,
    kind: 0,
    object: {
      id: `entitlement-${badgeId}`,
      kind: 'BADGE',
      ref_id: badgeId,
      user: {
        id: 'stv-user-1',
        username: 'user',
        display_name: 'User',
        avatar_url: '',
        style: { badge_id: badgeId },
        role_ids: { length: 0 },
        connections: {
          0: {
            id: ttvUserId,
            platform: 'TWITCH',
            username: 'user',
            display_name: 'User',
            linked_at: 0,
            emote_capacity: 0,
            emote_set_id: '',
          },
          length: 1,
        },
      },
    },
  };
}

function createBadgeEntitlementCreateEvent(
  badgeId: string,
  ttvUserId: string,
): SevenTvEventData<SevenTvEventType> {
  return {
    type: 'entitlement.create',
    body: createBadgeEntitlement(badgeId, ttvUserId),
  };
}

describe('requestUserCosmetics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    clearBridgeCosmeticsState();
    mockFetchBridgedCosmetics.mockResolvedValue([]);
    mockGetBadge.mockReturnValue(undefined);
    mockGetPaint.mockReturnValue(undefined);
  });

  afterEach(() => {
    clearBridgeCosmeticsState();
    jest.useRealTimers();
  });

  test('coalesces users queued in the same window into one bridge request', async () => {
    const first = requestUserCosmetics('ttv-1');
    const second = requestUserCosmetics('ttv-2');

    jest.advanceTimersByTime(500);
    await Promise.all([first, second]);

    expect(mockFetchBridgedCosmetics.mock.calls).toEqual([
      [['ttv-1', 'ttv-2']],
    ]);
  });

  test('dedupes repeat requests for the same user', async () => {
    const first = requestUserCosmetics('ttv-1');
    const second = requestUserCosmetics('ttv-1');

    jest.advanceTimersByTime(500);
    await Promise.all([first, second]);

    const third = requestUserCosmetics('ttv-1');
    jest.advanceTimersByTime(500);
    await third;

    expect(mockFetchBridgedCosmetics.mock.calls).toEqual([[['ttv-1']]]);
  });

  test('applies returned cosmetic and entitlement dispatches to the store', async () => {
    mockFetchBridgedCosmetics.mockResolvedValue([
      createBadgeCosmeticCreateEvent('badge-1'),
      createBadgeEntitlementCreateEvent('badge-1', 'ttv-1'),
    ]);

    const request = requestUserCosmetics('ttv-1');
    jest.advanceTimersByTime(500);
    await request;

    expect(mockAddBadge.mock.calls[0]?.[0]).toEqual<SanitisedBadgeSet>({
      id: 'badge-1',
      provider: '7tv',
      set: 'badge-1',
      title: 'Badge badge-1',
      type: '7TV Badge',
      url: 'https://cdn.7tv.app/badge/badge-1/4x.webp',
    });
    expect(mockSetUserBadge.mock.calls).toEqual([['ttv-1', 'badge-1']]);
  });

  test('logs bridge events that fail interpretation', async () => {
    const { logger } = jest.requireMock('@app/utils/logger') as {
      logger: { stv: { warn: jest.Mock } };
    };
    mockFetchBridgedCosmetics.mockResolvedValue([
      {
        type: 'cosmetic.create',
        body: null,
      } as unknown as SevenTvEventData<SevenTvEventType>,
    ]);

    const request = requestUserCosmetics('ttv-1');
    jest.advanceTimersByTime(500);
    await request;

    expect(
      logger.stv.warn.mock.calls.some(
        call => call[0] === 'Failed to interpret 7TV bridge event',
      ),
    ).toBe(true);
  });

  test('allows retrying users from a failed bridge request', async () => {
    mockFetchBridgedCosmetics.mockRejectedValueOnce(new Error('network'));

    const failed = requestUserCosmetics('ttv-1');
    jest.advanceTimersByTime(500);
    await failed;

    const retried = requestUserCosmetics('ttv-1');
    jest.advanceTimersByTime(500);
    await retried;

    expect(mockFetchBridgedCosmetics.mock.calls).toEqual([
      [['ttv-1']],
      [['ttv-1']],
    ]);
  });
});

describe('applyEntitlementCreateEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    clearBridgeCosmeticsState();
    mockFetchBridgedCosmetics.mockResolvedValue([]);
    mockGetBadge.mockReturnValue(undefined);
    mockGetPaint.mockReturnValue(undefined);
  });

  afterEach(() => {
    clearBridgeCosmeticsState();
    jest.useRealTimers();
  });

  test('binds the badge and queues a bridge lookup when the definition is missing', () => {
    applyEntitlementCreateEvent(
      {
        entitlement: createBadgeEntitlement('badge-1', 'ttv-1'),
        kind: 'BADGE',
        ttvUserId: 'ttv-1',
        paintId: null,
        badgeId: 'badge-1',
      },
      { requestMissingDefinitions: true },
    );

    expect(mockSetUserBadge.mock.calls).toEqual([['ttv-1', 'badge-1']]);

    jest.advanceTimersByTime(500);
    expect(mockFetchBridgedCosmetics.mock.calls).toEqual([[['ttv-1']]]);
  });

  test('does not queue a bridge lookup when the definition is already loaded', () => {
    mockGetBadge.mockReturnValue({
      id: 'badge-1',
      provider: '7tv',
      set: 'badge-1',
      title: 'Badge',
      type: '7TV Badge',
      url: 'https://cdn.7tv.app/badge/badge-1/4x.webp',
    });

    applyEntitlementCreateEvent(
      {
        entitlement: createBadgeEntitlement('badge-1', 'ttv-1'),
        kind: 'BADGE',
        ttvUserId: 'ttv-1',
        paintId: null,
        badgeId: 'badge-1',
      },
      { requestMissingDefinitions: true },
    );

    expect(mockSetUserBadge.mock.calls).toEqual([['ttv-1', 'badge-1']]);

    jest.advanceTimersByTime(500);
    expect(mockFetchBridgedCosmetics).not.toHaveBeenCalled();
  });

  test('never queues bridge lookups when applying bridge responses', () => {
    applyEntitlementCreateEvent(
      {
        entitlement: createBadgeEntitlement('badge-1', 'ttv-1'),
        kind: 'BADGE',
        ttvUserId: 'ttv-1',
        paintId: null,
        badgeId: 'badge-1',
      },
      { requestMissingDefinitions: false },
    );

    expect(mockSetUserBadge.mock.calls).toEqual([['ttv-1', 'badge-1']]);

    jest.advanceTimersByTime(500);
    expect(mockFetchBridgedCosmetics).not.toHaveBeenCalled();
  });

  test('binds paints and requests missing paint definitions', () => {
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

    applyEntitlementCreateEvent(
      {
        entitlement,
        kind: 'PAINT',
        ttvUserId: 'ttv-1',
        paintId: 'paint-1',
        badgeId: null,
      },
      { requestMissingDefinitions: true },
    );

    expect(mockSetUserPaint.mock.calls).toEqual([['ttv-1', 'paint-1']]);

    jest.advanceTimersByTime(500);
    expect(mockFetchBridgedCosmetics.mock.calls).toEqual([[['ttv-1']]]);
  });
});
