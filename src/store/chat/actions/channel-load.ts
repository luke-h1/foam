import { batch } from '@legendapp/state';

import { SEVEN_TV_GLOBAL_EMOTE_SET_ID } from '@app/constants/emote-providers';
import { clearChatStorePersistence } from '@app/lib/observablePersistence';
import { startSpanAsync } from '@app/lib/sentry';
import {
  invalidateSevenTvUser,
  sevenTvService,
} from '@app/services/seven-tv-service';
import { twitchService } from '@app/services/twitch-service';
import {
  clearBttvBadgesCache,
  getBttvBadges,
} from '@app/store/chat/actions/bttv-badges/getBttvBadges';
import { getChatterinoBadges } from '@app/store/chat/actions/chatterinoBadges';
import { getPreferences, type Preferences } from '@app/store/preference-store';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { createFetchOnceGuard } from '@app/utils/async/fetchOnceGuard';
import { cheermoteFetchGuard } from '@app/utils/chat/cheermote-store/cheermoteFetchGuard';
import { fetchChannelCheermotes } from '@app/utils/chat/cheermote-store/fetchChannelCheermotes';
import { createSystemMessage } from '@app/utils/chat/message-handlers/createSystemMessage';
import { clearSessionCache } from '@app/utils/image/imageCache';
import { logger } from '@app/utils/logger';

import {
  CHANNEL_CACHE_PERSISTENCE_ENABLED,
  clearPersistedChannelCaches,
  prunePersistedChannelCaches,
} from '../observables/channel-cache-persistence';
import { chatStore$, limitChannelCaches } from '../observables/chat-store';
import {
  clearPersistedRecentMessages,
  RECENT_MESSAGES_PERSISTENCE_ENABLED,
} from '../observables/recent-messages-persistence';
import {
  CHANNEL_BADGE_SLICE_KEYS,
  CHANNEL_EMOTE_SLICE_KEYS,
  CHANNEL_SLICE_KEYS,
  EMPTY_GATED_EMOTE_DATA,
  type GatedEmoteData,
  gateEmoteData,
  GLOBAL_SLICE_KEYS,
  mapSlices,
  SLICE_BY_KEY,
} from '../types/chat-resource-slices';
import type {
  ChannelCacheType,
  GlobalCacheType,
  SubscriberChannelProfile,
} from '../types/constants';
import { makeEmptyGlobalCacheData } from '../types/constants';
import { ensureChannelCacheHydrated } from './channel-cache-hydration';
import {
  type CachedChannelRefreshPlan,
  planChannelRefresh,
} from './channel-refresh-plan';
import {
  buildBadgeResourceSpecs,
  buildEmoteResourceSpecs,
  buildSubscriberEmoteSpec,
  clearGlobalResourceCache,
  collectFailedProviderReasons,
  hadCachedResourcesForFailedSpecs,
  reconcileSettledSpecs,
  reportResourceResults,
  settleSpecs,
} from './channel-resources';
import { setCurrentChannelId } from './current-channel';
import { refreshGlobalChatResources } from './global-resource-ensure';
import { invalidateCosmeticsCache } from './invalidation';
import { addMessage, clearMessages } from './messages';
import {
  clearChannelPersonalEmotes,
  clearPersonalEmotesCache,
  fetchUserPersonalEmotes,
} from './personal-emotes';
import { notify7TVPresence } from './seven-tv-channel-lifecycle';

const channelLoadAbort = (() => {
  let current: AbortController | null = null;

  return {
    startNext(): AbortController {
      if (current) {
        current.abort();
      }

      current = new AbortController();
      return current;
    },
    abortActive(): void {
      if (!current) {
        return;
      }

      current.abort();
      current = null;
    },
  };
})();

export const startChannelLoadAbort = (): AbortController =>
  channelLoadAbort.startNext();

export const abortCurrentLoad = (): void => channelLoadAbort.abortActive();

const exitIfAborted = (signal: AbortSignal | undefined): boolean => {
  if (!signal?.aborted) {
    return false;
  }

  chatStore$.loadingState.set('IDLE');
  return true;
};

type ProviderFailureSettled = Parameters<
  typeof collectFailedProviderReasons
>[0][number];

const countReconciledItems = (
  reconciled: ReadonlyMap<string, readonly unknown[]>,
): number => {
  let total = 0;

  reconciled.forEach(items => {
    total += items.length;
  });

  return total;
};

function notifyProviderLoadFailures(
  channelId: string,
  settled: readonly ProviderFailureSettled[],
  existingCache: ChannelCacheType | undefined,
  existingGlobalCache: GlobalCacheType | undefined,
): void {
  const failedProviders = collectFailedProviderReasons(settled);

  if (failedProviders.length === 0) {
    return;
  }

  const hadCache = hadCachedResourcesForFailedSpecs(
    { existingCache, existingGlobalCache },
    settled,
  );

  addMessage(
    createSystemMessage(
      channelId,
      hadCache
        ? `Couldn't load emotes and badges from ${failedProviders.join(
            ', ',
          )}. Using cached ones.`
        : `Couldn't load emotes and badges from ${failedProviders.join(', ')}`,
      getPreferences().chatTimestampFormat,
    ),
  );
}

// Runs keyed by channel id; only owner ids Twitch never returns get stamped,
// or they re-request on every cached-path revisit.
const subscriberProfilesGuard = createFetchOnceGuard();

export const clearSubscriberProfilesCache = () => {
  subscriberProfilesGuard.clear();
};

export const resolveSubscriberChannelProfiles = async (
  channelId: string,
): Promise<void> => {
  if (subscriberProfilesGuard.isInFlight(channelId)) {
    return;
  }

  const channelCache = chatStore$.persisted.channelCaches[channelId];
  const cache = channelCache?.peek();

  if (!channelCache || !cache) {
    return;
  }

  const existingProfiles = cache.twitchSubscriberChannelProfiles ?? {};

  const ownerIds = [
    ...new Set(
      (cache.twitchSubscriberEmotes ?? []).flatMap(emote =>
        // Helix returns sentinel owner ids like "twitch"; a non-numeric id
        // 400s the whole batched /users request.
        'owner_id' in emote && emote.owner_id && /^\d+$/.test(emote.owner_id)
          ? [emote.owner_id]
          : [],
      ),
    ),
  ].filter(
    ownerId =>
      !existingProfiles[ownerId] &&
      !subscriberProfilesGuard.hasFetched(ownerId),
  );

  if (ownerIds.length === 0) {
    return;
  }

  await subscriberProfilesGuard.run(channelId, async ctx => {
    try {
      const users = await twitchService.getUsersById(ownerIds);
      const profiles: Record<string, SubscriberChannelProfile> = {};

      users.forEach(user => {
        if (user?.id) {
          profiles[user.id] = {
            name: user.display_name,
            profileImageUrl: user.profile_image_url,
          };
        }
      });

      ownerIds.forEach(ownerId => {
        if (!profiles[ownerId]) {
          ctx.markFetched(ownerId);
        }
      });

      if (Object.keys(profiles).length === 0) {
        return;
      }

      // The cache entry may have been LRU-evicted during the fetch; writing
      // through the keyed proxy would silently resurrect a stub entry.
      const latestCache = channelCache.peek();

      if (!latestCache) {
        return;
      }

      channelCache.twitchSubscriberChannelProfiles.set({
        ...(latestCache.twitchSubscriberChannelProfiles ?? {}),
        ...profiles,
      });
    } catch (error) {
      logger.chat.warn('Failed to resolve subscriber channel profiles', {
        name: 'chat_resources_warning',
        error,
        action: 'subscriber_channel_profiles_failed',
        channel_id: channelId,
        provider: 'twitch',
        resource_type: 'emotes',
        scope: 'channel',
        screen: 'chat',
      });
    }
  });
};

export const clearChannelResources = () => {
  const channelId = chatStore$.currentChannelId.peek();

  batch(() => {
    setCurrentChannelId(null);
    chatStore$.loadingState.set('IDLE');
    chatStore$.bits.set([]);
  });

  if (channelId) {
    clearChannelPersonalEmotes(channelId);
  }
};

export interface LoadChannelResourcesOptions {
  channelId: string;
  forceRefresh?: boolean;
  signal?: AbortSignal;
  twitchUserId?: string;
}

type CachedRefreshArgs = {
  channelId: string;
  existingCache: ChannelCacheType;
  existingGlobalCache?: GlobalCacheType;
  plan: CachedChannelRefreshPlan;
  signal?: AbortSignal;
  twitchUserId?: string;
};

type CachedRefreshOutcome =
  | { aborted: true }
  | { aborted: false; settled: readonly ProviderFailureSettled[] };

const REFRESH_ABORTED: CachedRefreshOutcome = { aborted: true };
const REFRESH_SKIPPED: CachedRefreshOutcome = { aborted: false, settled: [] };

const refreshCachedSevenTvEmoteSetId = async ({
  channelId,
  plan,
  signal,
}: CachedRefreshArgs): Promise<CachedRefreshOutcome> => {
  if (!plan.fetchEmoteSetId) {
    return REFRESH_SKIPPED;
  }

  if (exitIfAborted(signal)) {
    return REFRESH_ABORTED;
  }

  try {
    const sevenTvSetId = await sevenTvService.getEmoteSetId(channelId);

    if (exitIfAborted(signal)) {
      return REFRESH_ABORTED;
    }

    chatStore$.persisted.channelCaches[channelId]?.assign({
      sevenTvEmoteSetId:
        sevenTvSetId === SEVEN_TV_GLOBAL_EMOTE_SET_ID
          ? undefined
          : sevenTvSetId,
    });
  } catch (error) {
    if (exitIfAborted(signal)) {
      return REFRESH_ABORTED;
    }

    logger.chat.warn('Failed to resolve cached 7TV emote set ID', {
      name: 'seven_tv_emotes_warning',
      error,
      action: 'cached_emote_set_id_failed',
      channel_id: channelId,
      provider: 'seven_tv',
      resource_type: 'emotes',
      scope: 'channel',
      screen: 'chat',
    });
  }

  return REFRESH_SKIPPED;
};

const refreshCachedSubscriberEmotes = async ({
  channelId,
  existingCache,
  existingGlobalCache,
  plan,
  signal,
  twitchUserId,
}: CachedRefreshArgs): Promise<CachedRefreshOutcome> => {
  if (!plan.fetchSubscriberEmotes || !twitchUserId) {
    return REFRESH_SKIPPED;
  }

  if (exitIfAborted(signal)) {
    return REFRESH_ABORTED;
  }

  const settled = await settleSpecs([
    buildSubscriberEmoteSpec({ channelId, twitchUserId }),
  ]);

  if (exitIfAborted(signal)) {
    return REFRESH_ABORTED;
  }

  reportResourceResults({
    channelId,
    settled,
    trigger: 'cached_subscriber_emotes_refresh',
  });

  const cachedUserId = existingCache.twitchSubscriberEmotesUserId;

  const subscriberByKey = reconcileSettledSpecs(settled, {
    channelId,
    existingCache:
      !cachedUserId || cachedUserId === twitchUserId
        ? existingCache
        : undefined,
    existingGlobalCache,
  });

  const didFetch = settled.every(entry => entry.result.status === 'fulfilled');

  chatStore$.persisted.channelCaches[channelId]?.assign({
    twitchSubscriberEmotes: subscriberByKey.get('twitchSubscriberEmotes') ?? [],
    twitchSubscriberEmotesUserId: didFetch ? twitchUserId : cachedUserId,
  });

  return { aborted: false, settled };
};

const refreshCachedBadges = async ({
  channelId,
  existingCache,
  existingGlobalCache,
  plan,
  signal,
}: CachedRefreshArgs): Promise<CachedRefreshOutcome> => {
  if (!plan.refreshBadges) {
    logger.chat.info('Using cached channel resources', {
      name: 'chat_resources_info',
      action: 'cached_channel_resources_used',
      cache_age_ms: plan.cacheAgeMs,
      category: 'data_loading',
      channel_id: channelId,
      screen: 'chat',
    });
    return REFRESH_SKIPPED;
  }

  if (exitIfAborted(signal)) {
    return REFRESH_ABORTED;
  }

  const badgeSpecs = buildBadgeResourceSpecs({ channelId }).filter(
    spec => spec.scope !== 'global',
  );

  const settled = await settleSpecs(badgeSpecs);

  if (exitIfAborted(signal)) {
    return REFRESH_ABORTED;
  }

  reportResourceResults({
    channelId,
    settled,
    trigger: 'cached_badges_refresh',
  });

  const badgeByKey = reconcileSettledSpecs(settled, {
    channelId,
    existingCache,
    existingGlobalCache,
  });

  const badgeResourceSets = mapSlices(
    CHANNEL_BADGE_SLICE_KEYS,
    key => badgeByKey.get(key) ?? [],
  );

  const hasBadgeResourceFailure = settled.some(
    entry => entry.result.status === 'rejected',
  );

  chatStore$.persisted.channelCaches[channelId]?.assign({
    ...badgeResourceSets,
    badgesLastUpdated: hasBadgeResourceFailure
      ? existingCache.badgesLastUpdated
      : Date.now(),
  });

  logger.chat.info('Refetched badges (1h TTL); using cached emotes', {
    name: 'chat_resources_info',
    action: 'badges_refetched_cached_emotes',
    badge_cache_age_ms: plan.badgeCacheAgeMs,
    category: 'data_loading',
    channel_id: channelId,
    screen: 'chat',
  });

  return { aborted: false, settled };
};

const refreshStaleGlobalResources = async ({
  channelId,
  plan,
  signal,
}: CachedRefreshArgs): Promise<CachedRefreshOutcome> => {
  if (!plan.refreshGlobalResources) {
    return REFRESH_SKIPPED;
  }

  if (exitIfAborted(signal)) {
    return REFRESH_ABORTED;
  }

  const settled = await refreshGlobalChatResources({
    channelId,
    trigger: 'cached_global_resources_refresh',
  });

  if (exitIfAborted(signal)) {
    return REFRESH_ABORTED;
  }

  logger.chat.info('Refetched stale global provider slices', {
    name: 'chat_resources_info',
    action: 'global_resources_refetched',
    category: 'data_loading',
    channel_id: channelId,
    screen: 'chat',
  });

  return { aborted: false, settled };
};

/**
 * Runs the cache-hit path: refresh only the slices the plan marked stale, then
 * mark the channel loaded. The steps run in order because each one writes the
 * cache the next one reads. Returns false when the load was aborted.
 */
const refreshCachedChannelResources = async (
  args: CachedRefreshArgs,
): Promise<boolean> => {
  const emoteSetId = await refreshCachedSevenTvEmoteSetId(args);
  if (emoteSetId.aborted) {
    return false;
  }

  const subscriberEmotes = await refreshCachedSubscriberEmotes(args);
  if (subscriberEmotes.aborted) {
    return false;
  }

  const badges = await refreshCachedBadges(args);
  if (badges.aborted) {
    return false;
  }

  const globalResources = await refreshStaleGlobalResources(args);
  if (globalResources.aborted) {
    return false;
  }

  const { channelId, existingCache, existingGlobalCache, twitchUserId } = args;

  notifyProviderLoadFailures(
    channelId,
    [
      ...subscriberEmotes.settled,
      ...badges.settled,
      ...globalResources.settled,
    ],
    existingCache,
    existingGlobalCache,
  );

  batch(() => {
    setCurrentChannelId(channelId);
    chatStore$.loadingState.set('COMPLETED');
  });

  if (twitchUserId) {
    void notify7TVPresence(twitchUserId, channelId);
    void fetchUserPersonalEmotes(twitchUserId, channelId);
  }

  void resolveSubscriberChannelProfiles(channelId);
  return true;
};

const loadChannelResourcesInternal = async (
  channelId: string,
  shouldForceRefresh: boolean,
  signal?: AbortSignal,
  twitchUserId?: string,
): Promise<boolean> => {
  if (signal?.aborted) {
    return false;
  }

  chatStore$.loadingState.set('LOADING');

  if (shouldForceRefresh) {
    // Forget the fetch-once users too, or fetchUserPersonalEmotes
    // short-circuits into the emptied cache.
    clearPersonalEmotesCache();

    clearGlobalResourceCache();

    // "Refresh emotes" is what a user reaches for when the 7TV set looks
    // wrong, so re-resolve it.
    invalidateSevenTvUser(channelId);
  }

  try {
    ensureChannelCacheHydrated(channelId);
    const caches = chatStore$.persisted.channelCaches.peek();
    const existingCache = caches?.[channelId];
    const existingGlobalCache = chatStore$.persisted.globalCaches.peek();

    const plan = planChannelRefresh({
      cache: existingCache,
      forceRefresh: shouldForceRefresh,
      globalCache: existingGlobalCache,
      now: Date.now(),
      twitchUserId,
    });

    if (plan.kind === 'cached' && existingCache) {
      return await refreshCachedChannelResources({
        channelId,
        existingCache,
        existingGlobalCache,
        plan,
        signal,
        twitchUserId,
      });
    }

    setCurrentChannelId(channelId);

    if (exitIfAborted(signal)) {
      return false;
    }

    // Resolve the 7TV set id as a promise the spec awaits internally, so the
    // other 13 resource fetches start immediately instead of stalling behind it.
    const fallbackSevenTvSetId =
      existingCache?.sevenTvEmoteSetId ?? SEVEN_TV_GLOBAL_EMOTE_SET_ID;

    const sevenTvSetIdPromise = sevenTvService
      .getEmoteSetId(channelId)
      .catch((error: unknown) => {
        logger.chat.warn('Failed to resolve 7TV emote set ID', {
          name: 'seven_tv_emotes_warning',
          error,
          action: 'emote_set_id_failed',
          channel_id: channelId,
          provider: 'seven_tv',
          resource_type: 'emotes',
          scope: 'channel',
          screen: 'chat',
        });

        return fallbackSevenTvSetId;
      });

    const emoteSpecs = buildEmoteResourceSpecs({
      channelId,
      sevenTvSetId: sevenTvSetIdPromise,
      sevenTvSetIdFallback: fallbackSevenTvSetId,
      twitchUserId,
    }).filter(spec => spec.scope !== 'global');

    const badgeSpecs = buildBadgeResourceSpecs({ channelId }).filter(
      spec => spec.scope !== 'global',
    );

    const [emoteSettled, badgeSettled, globalSettled] = await startSpanAsync(
      'fetch-emotes-and-badges',
      'http.client',
      () =>
        Promise.all([
          settleSpecs(emoteSpecs),
          settleSpecs(badgeSpecs),
          refreshGlobalChatResources({
            channelId,
            trigger: 'full_channel_resource_load',
          }),
        ]),
      {
        channel_id: channelId,
        service_count: emoteSpecs.length + badgeSpecs.length,
      },
    );

    if (exitIfAborted(signal)) {
      return false;
    }

    // Settled (or about to settle behind the same client timeout) by the time
    // the resource fetches above have finished.
    const sevenTvSetId = await sevenTvSetIdPromise;

    reportResourceResults({
      channelId,
      settled: [...emoteSettled, ...badgeSettled],
      trigger: 'full_channel_resource_load',
    });

    const cacheContext = { channelId, existingCache, existingGlobalCache };
    const emoteByKey = reconcileSettledSpecs(emoteSettled, cacheContext);
    const badgeByKey = reconcileSettledSpecs(badgeSettled, cacheContext);

    const emoteResourceSets = mapSlices(
      CHANNEL_EMOTE_SLICE_KEYS,
      key => emoteByKey.get(key) ?? [],
    );

    const badgeResourceSets = mapSlices(
      CHANNEL_BADGE_SLICE_KEYS,
      key => badgeByKey.get(key) ?? [],
    );

    if (exitIfAborted(signal)) {
      return false;
    }

    const hasChannelEmoteFailure = emoteSettled.some(
      entry => entry.result.status === 'rejected',
    );

    const hasChannelBadgeFailure = badgeSettled.some(
      entry => entry.result.status === 'rejected',
    );

    const now = Date.now();

    const channelData: ChannelCacheType = {
      lastUpdated: hasChannelEmoteFailure
        ? (existingCache?.lastUpdated ?? 0)
        : now,
      badgesLastUpdated: hasChannelBadgeFailure
        ? (existingCache?.badgesLastUpdated ?? 0)
        : now,
      ...emoteResourceSets,
      twitchSubscriberChannelProfiles:
        existingCache?.twitchSubscriberChannelProfiles ?? {},
      ...badgeResourceSets,
      ...{
        twitchSubscriberEmotesUserId: twitchUserId ?? undefined,
        sevenTvEmoteSetId:
          sevenTvSetId === SEVEN_TV_GLOBAL_EMOTE_SET_ID
            ? undefined
            : sevenTvSetId,
      },
    };

    clearChannelPersonalEmotes(channelId);

    batch(() => {
      const currentCaches = chatStore$.persisted.channelCaches.peek() ?? {};

      chatStore$.persisted.channelCaches.set(
        limitChannelCaches(
          { ...currentCaches, [channelId]: channelData },
          channelId,
        ),
      );

      chatStore$.loadingState.set('COMPLETED');
    });

    // After the batch, so the listener has queued the new channel's write.
    for (const droppedId of prunePersistedChannelCaches(channelId)) {
      chatStore$.persisted.channelCaches[droppedId]?.delete();
    }

    notifyProviderLoadFailures(
      channelId,
      [...emoteSettled, ...badgeSettled, ...globalSettled],
      existingCache,
      existingGlobalCache,
    );

    if (twitchUserId) {
      void notify7TVPresence(twitchUserId, channelId);
      void fetchUserPersonalEmotes(twitchUserId, channelId);
    }

    void resolveSubscriberChannelProfiles(channelId);

    logger.chat.info('Loaded channel resources', {
      name: 'chat_resources_info',
      action: 'channel_resources_loaded',
      badge_count: countReconciledItems(badgeByKey),
      category: 'data_loading',
      channel_id: channelId,
      emote_count: countReconciledItems(emoteByKey),
      screen: 'chat',
    });

    return true;
  } catch (error) {
    if (exitIfAborted(signal)) {
      return false;
    }

    logger.chat.error('Failed to load channel resources', {
      name: 'chat_resources_error',
      error,
      action: 'channel_resources_failed',
      channel_id: channelId,
      screen: 'chat',
    });

    addMessage(
      createSystemMessage(
        channelId,
        "Couldn't load channel emotes and badges. Try refreshing.",
        getPreferences().chatTimestampFormat,
      ),
    );

    chatStore$.loadingState.set('ERROR');
    return false;
  }
};

/**
 * Fire-and-forget cheermote fetch; failures only log because cheer rendering
 * degrades to plain text without them.
 */
const loadChannelCheermotes = (channelId: string): void => {
  fetchChannelCheermotes(channelId, () =>
    twitchService.getCheermotes(channelId),
  ).catch((error: unknown) => {
    logger.chat.warn('Failed to load channel cheermotes', {
      name: 'chat_resources_warning',
      error,
      action: 'cheermotes_failed',
      channel_id: channelId,
      screen: 'chat',
    });
  });
};

export const loadChannelResources = async ({
  channelId,
  forceRefresh: shouldForceRefresh = false,
  signal,
  twitchUserId,
}: LoadChannelResourcesOptions): Promise<boolean> => {
  loadChannelCheermotes(channelId);

  return startSpanAsync(
    'load-channel-resources',
    'chat.load',
    () =>
      loadChannelResourcesInternal(
        channelId,
        shouldForceRefresh,
        signal,
        twitchUserId,
      ),
    { channel_id: channelId, force_refresh: shouldForceRefresh },
  );
};

/**
 * Stale-stamps the channel's cached slices and drops the process-level caches
 * a reload does not clear itself (BTTV badge list, cheermote stamp).
 */
export const invalidateChatResourceCaches = (channelId: string): void => {
  const channelCache = chatStore$.persisted.channelCaches[channelId];

  if (channelCache?.peek()) {
    channelCache.assign({ lastUpdated: 0, badgesLastUpdated: 0 });
  }

  clearGlobalResourceCache();
  clearBttvBadgesCache();
  cheermoteFetchGuard.clearKey(channelId);
};

export const clearCache = (channelId: string) => {
  batch(() => {
    const currentCaches = chatStore$.persisted.channelCaches.peek() ?? {};

    const { [channelId]: _, ...rest } = currentCaches;
    chatStore$.persisted.channelCaches.set(rest);

    if (chatStore$.currentChannelId.peek() === channelId) {
      setCurrentChannelId(null);
    }
  });

  clearGlobalResourceCache();
  invalidateCosmeticsCache();
};

export const clearPersistedChatResources = (): void => {
  batch(() => {
    clearChannelResources();
    clearMessages();
    chatStore$.persisted.channelCaches.set({});
    chatStore$.recentMessagesByChannel.set({});
    chatStore$.persisted.globalCaches.set(makeEmptyGlobalCacheData());
  });

  if (RECENT_MESSAGES_PERSISTENCE_ENABLED) {
    clearPersistedRecentMessages();
  }

  if (CHANNEL_CACHE_PERSISTENCE_ENABLED) {
    clearPersistedChannelCaches();
  }

  clearSubscriberProfilesCache();
  clearSessionCache();
  clearGlobalResourceCache();
  void clearChatStorePersistence();
};

const GATE_PREFERENCE_KEYS = [
  ...new Set<keyof Preferences>([
    ...CHANNEL_SLICE_KEYS.map(key => SLICE_BY_KEY[key].preference),
    ...GLOBAL_SLICE_KEYS.map(key => SLICE_BY_KEY[key].preference),
    'showBttvBadges',
  ]),
];

const EMOTE_DATA_INPUT_COUNT =
  CHANNEL_SLICE_KEYS.length +
  GLOBAL_SLICE_KEYS.length +
  GATE_PREFERENCE_KEYS.length +
  2;

const scratchEmoteDataInputs: unknown[] = Array.from<unknown>({
  length: EMOTE_DATA_INPUT_COUNT,
});

/**
 * Keyed on every value `gateEmoteData` reads, not on the parent objects.
 * Legend State writes a nested `.set()` into the parent object in place, so
 * the channel cache and preferences objects keep their identity when one
 * slice or flag changes.
 */
let resolvedEmoteDataCache: {
  channelId: string;
  inputs: unknown[];
  value: GatedEmoteData;
} | null = null;

function fillEmoteDataInputs(
  cache: ChannelCacheType,
  globalCache: GlobalCacheType,
  preferences: Preferences,
  chatterinoBadges: SanitisedBadgeSet[],
  bttvBadges: SanitisedBadgeSet[],
): void {
  let index = 0;

  for (const key of CHANNEL_SLICE_KEYS) {
    scratchEmoteDataInputs[index] = cache[key];
    index += 1;
  }

  for (const key of GLOBAL_SLICE_KEYS) {
    scratchEmoteDataInputs[index] = globalCache[key];
    index += 1;
  }

  for (const key of GATE_PREFERENCE_KEYS) {
    scratchEmoteDataInputs[index] = preferences[key];
    index += 1;
  }

  scratchEmoteDataInputs[index] = chatterinoBadges;
  scratchEmoteDataInputs[index + 1] = bttvBadges;
}

function emoteDataInputsMatch(inputs: unknown[]): boolean {
  for (let index = 0; index < EMOTE_DATA_INPUT_COUNT; index += 1) {
    if (inputs[index] !== scratchEmoteDataInputs[index]) {
      return false;
    }
  }

  return true;
}

export const getCurrentEmoteData = (channelId?: string): GatedEmoteData => {
  const targetChannelId = channelId ?? chatStore$.currentChannelId.peek();

  if (!targetChannelId) {
    return EMPTY_GATED_EMOTE_DATA;
  }

  const caches = chatStore$.persisted.channelCaches.peek();
  const cache = caches?.[targetChannelId];

  if (!cache) {
    return EMPTY_GATED_EMOTE_DATA;
  }

  const globalCache = chatStore$.persisted.globalCaches.peek();
  const preferences = getPreferences();
  const chatterinoBadges = getChatterinoBadges();
  const bttvBadges = getBttvBadges();

  fillEmoteDataInputs(
    cache,
    globalCache,
    preferences,
    chatterinoBadges,
    bttvBadges,
  );

  const memo = resolvedEmoteDataCache;

  if (
    memo &&
    memo.channelId === targetChannelId &&
    emoteDataInputsMatch(memo.inputs)
  ) {
    return memo.value;
  }

  const value = gateEmoteData({
    slices: { ...cache, ...globalCache },
    preferences,
    chatterinoBadges,
    bttvBadges,
  });

  resolvedEmoteDataCache = {
    channelId: targetChannelId,
    inputs: scratchEmoteDataInputs.slice(),
    value,
  };

  return value;
};
