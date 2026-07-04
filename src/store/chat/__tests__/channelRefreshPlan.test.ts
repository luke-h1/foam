import { EmoteSetKind } from '@app/graphql/generated/gql';
import type { ChannelRefreshPlan } from '@app/store/chat/actions/channelRefreshPlan';
import { planChannelRefresh } from '@app/store/chat/actions/channelRefreshPlan';
import type { ChannelCacheType } from '@app/store/chat/types/constants';
import { emptyEmoteData } from '@app/store/chat/types/constants';
import type { SevenTvSanitisedEmote } from '@app/types/emote';

const NOW = Date.parse('2026-01-01T12:00:00.000Z');
const HOUR_MS = 60 * 60 * 1000;

const emote = {
  aspect_ratio: 1,
  creator: null,
  emote_link: 'https://example.com/e1',
  flags: 0,
  format: 'webp',
  frame_count: 1,
  height: 32,
  id: 'e1',
  name: 'e1',
  original_name: 'e1',
  set_metadata: {
    setId: 'set',
    setName: 'set',
    capacity: 100,
    ownerId: 'owner',
    kind: EmoteSetKind.Normal,
    updatedAt: '2025-01-01T00:00:00.000+00:00',
    totalCount: 1,
  },
  site: '7TV Channel',
  static_url: 'https://example.com/e1.png',
  url: 'https://example.com/e1.webp',
  width: 32,
  zero_width: false,
} as const satisfies SevenTvSanitisedEmote;

const freshCache = (
  overrides?: Partial<ChannelCacheType>,
): ChannelCacheType => ({
  ...emptyEmoteData,
  sevenTvChannelEmotes: [emote],
  sevenTvEmoteSetId: 'set-1',
  lastUpdated: NOW - HOUR_MS,
  badgesLastUpdated: NOW - 30 * 60 * 1000,
  ...overrides,
});

describe('planChannelRefresh', () => {
  test('plans a full load when there is no cache', () => {
    expect(
      planChannelRefresh({ cache: undefined, forceRefresh: false, now: NOW }),
    ).toEqual<ChannelRefreshPlan>({ kind: 'full' });
  });

  test('plans a full load on forceRefresh even with a fresh cache', () => {
    expect(
      planChannelRefresh({ cache: freshCache(), forceRefresh: true, now: NOW }),
    ).toEqual<ChannelRefreshPlan>({ kind: 'full' });
  });

  test('plans a full load when every emote slice is empty', () => {
    expect(
      planChannelRefresh({
        cache: freshCache({ sevenTvChannelEmotes: [] }),
        forceRefresh: false,
        now: NOW,
      }),
    ).toEqual<ChannelRefreshPlan>({ kind: 'full' });
  });

  test('plans a full load once the cache outlives the cache duration', () => {
    expect(
      planChannelRefresh({
        cache: freshCache({ lastUpdated: NOW - 24 * HOUR_MS }),
        forceRefresh: false,
        now: NOW,
      }),
    ).toEqual<ChannelRefreshPlan>({ kind: 'full' });
  });

  test('serves a fresh cache with nothing extra to fetch', () => {
    expect(
      planChannelRefresh({
        cache: freshCache(),
        forceRefresh: false,
        now: NOW,
      }),
    ).toEqual<ChannelRefreshPlan>({
      kind: 'cached',
      cacheAgeMs: HOUR_MS,
      badgeCacheAgeMs: 30 * 60 * 1000,
      fetchEmoteSetId: false,
      fetchSubscriberEmotes: false,
      refreshBadges: false,
    });
  });

  test('requests the 7TV emote set id when the cache is missing one', () => {
    const plan = planChannelRefresh({
      cache: freshCache({ sevenTvEmoteSetId: undefined }),
      forceRefresh: false,
      now: NOW,
    });

    expect(plan.kind === 'cached' && plan.fetchEmoteSetId).toEqual(true);
  });

  test('requests subscriber emotes only for a different logged-in user', () => {
    const cache = freshCache({ twitchSubscriberEmotesUserId: 'user-1' });

    const samePlan = planChannelRefresh({
      cache,
      forceRefresh: false,
      now: NOW,
      twitchUserId: 'user-1',
    });
    const otherPlan = planChannelRefresh({
      cache,
      forceRefresh: false,
      now: NOW,
      twitchUserId: 'user-2',
    });
    const anonPlan = planChannelRefresh({
      cache,
      forceRefresh: false,
      now: NOW,
    });

    expect(
      samePlan.kind === 'cached' && samePlan.fetchSubscriberEmotes,
    ).toEqual(false);
    expect(
      otherPlan.kind === 'cached' && otherPlan.fetchSubscriberEmotes,
    ).toEqual(true);
    expect(
      anonPlan.kind === 'cached' && anonPlan.fetchSubscriberEmotes,
    ).toEqual(false);
  });

  test('refreshes badges once their cache outlives the badge duration', () => {
    const plan = planChannelRefresh({
      cache: freshCache({ badgesLastUpdated: NOW - HOUR_MS }),
      forceRefresh: false,
      now: NOW,
    });

    expect(plan.kind === 'cached' && plan.refreshBadges).toEqual(true);
  });

  test('falls back to lastUpdated for badge age when badgesLastUpdated is missing', () => {
    const plan = planChannelRefresh({
      cache: freshCache({
        badgesLastUpdated: undefined,
        lastUpdated: NOW - 2 * HOUR_MS,
      }),
      forceRefresh: false,
      now: NOW,
    });

    expect(plan).toEqual<ChannelRefreshPlan>({
      kind: 'cached',
      cacheAgeMs: 2 * HOUR_MS,
      badgeCacheAgeMs: 2 * HOUR_MS,
      fetchEmoteSetId: false,
      fetchSubscriberEmotes: false,
      refreshBadges: true,
    });
  });
});
