import { batch } from '@legendapp/state';

import { clearChatStorePersistence } from '@app/lib/observablePersistence';
import { startSpanAsync } from '@app/lib/sentry';
import { sevenTvService } from '@app/services/seventv-service';
import { twitchService } from '@app/services/twitch-service';
import { getPreferences } from '@app/store/preferences/state';
import type { SanitisedEmote } from '@app/types/emote';
import { createFetchOnceGuard } from '@app/utils/async/fetchOnceGuard';
import { getChatterinoBadges } from '@app/utils/chat/chatterinoBadges';
import { fetchChannelCheermotes } from '@app/utils/chat/cheermoteStore';
import { getEmojiEmotes } from '@app/utils/emoji/emojiEmotes';
import { logger } from '@app/utils/logger';

import { chatStore$, limitChannelCaches } from '../observables/chatStore';
import {
  clearPersistedRecentMessages,
  RECENT_MESSAGES_PERSISTENCE_ENABLED,
} from '../observables/recentMessagesPersistence';
import type {
  ChannelCacheType,
  SanitisedBadgeSet,
  SubscriberChannelProfile,
} from '../types/constants';
import { emptyResolvedEmoteData } from '../types/constants';
import { planChannelRefresh } from './channelRefreshPlan';
import {
  type BadgeResourceSets,
  buildBadgeResourceSpecs,
  buildEmoteResourceSpecs,
  buildSubscriberEmoteSpec,
  clearGlobalResourceCache,
  combineUniqueById,
  deduplicateById,
  type EmoteResourceSets,
  reconcileSettledSpecs,
  reportResourceResults,
  settleSpecs,
} from './channelResources';
import { clearUserCosmeticsCache } from './cosmetics';
import { clearEmoteImageCache } from './emoteImages';

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

const exitIfAborted = (
  signal: AbortSignal | undefined,
  resetLoading: boolean,
): boolean => {
  if (!signal?.aborted) {
    return false;
  }
  if (resetLoading) {
    chatStore$.loadingState.set('IDLE');
  }
  return true;
};

const personalEmotesGuard = createFetchOnceGuard();

export const fetchUserPersonalEmotes = async (
  twitchUserId: string,
  channelId: string,
): Promise<SanitisedEmote[]> => {
  if (personalEmotesGuard.hasFetched(twitchUserId)) {
    const cache = chatStore$.persisted.channelCaches[channelId]?.peek();
    return cache?.sevenTvPersonalEmotes?.[twitchUserId] || [];
  }
  const cache = chatStore$.persisted.channelCaches[channelId]?.peek();

  if (cache?.sevenTvPersonalEmotes?.[twitchUserId]?.length) {
    personalEmotesGuard.markFetched(twitchUserId);
    return cache.sevenTvPersonalEmotes[twitchUserId];
  }

  return personalEmotesGuard.run(twitchUserId, async ctx => {
    try {
      const personalEmotes =
        await sevenTvService.getPersonalEmoteSet(twitchUserId);
      ctx.markFetched();

      if (personalEmotes.length > 0 && ctx.stillCurrent()) {
        const channelCache = chatStore$.persisted.channelCaches[channelId];

        if (channelCache) {
          const currentPersonalEmotes =
            channelCache.sevenTvPersonalEmotes?.peek() || {};
          channelCache.sevenTvPersonalEmotes.set({
            ...currentPersonalEmotes,
            [twitchUserId]: personalEmotes,
          });
        }
      }
      return personalEmotes;
    } catch (error) {
      logger.stv.warn(
        `Failed to fetch personal emotes for user ${twitchUserId}:`,
        {
          name: 'seven_tv_emotes_warning',
          error,
          action: 'personal_emotes_failed',
          channel_id: channelId,
          provider: 'seven_tv',
          resource_type: 'emotes',
          scope: 'personal',
          screen: 'chat',
          twitch_user_id: twitchUserId,
        },
      );
      ctx.markFetched();
      return [];
    }
  });
};

export const getUserPersonalEmotes = (
  twitchUserId: string,
  channelId: string,
): SanitisedEmote[] => {
  const cache = chatStore$.persisted.channelCaches[channelId]?.peek();
  return cache?.sevenTvPersonalEmotes?.[twitchUserId] || [];
};

export const clearPersonalEmotesCache = () => {
  personalEmotesGuard.clear();
};

// Runs are keyed by channel id; stamps are keyed by owner id, and only owner
// ids Twitch never returns (deleted/suspended accounts) get stamped. Those
// would otherwise be re-requested on every cached-path channel revisit, while
// resolved ids are already deduped per channel by the profile cache itself.
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
        // Helix /chat/emotes/user also returns global emotes with sentinel
        // owner ids like "twitch"; a non-numeric id 400s the whole batched
        // /users request, so only real user ids may enter the lookup.
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
  batch(() => {
    chatStore$.currentChannelId.set(null);
    chatStore$.loadingState.set('IDLE');
    chatStore$.emojis.set(getEmojiEmotes(getPreferences().emojiStyle));
    chatStore$.bits.set([]);
  });
  personalEmotesGuard.clear();
};

export const notify7TVPresence = async (
  twitchUserId: string | undefined,
  twitchChannelId: string,
): Promise<void> => {
  if (!twitchUserId || !twitchChannelId) {
    return;
  }

  try {
    const sevenTvUserId = await sevenTvService.get7tvUserId(twitchUserId);
    if (!sevenTvUserId) {
      return;
    }
    await sevenTvService.sendPresence(twitchChannelId, sevenTvUserId);
  } catch (error) {
    logger.stvWs.warn(`Failed to notify 7TV about presence: ${String(error)}`, {
      name: 'seven_tv_presence_warning',
      error,
      action: 'presence_notify_failed',
      channel_id: twitchChannelId,
      provider: 'seven_tv',
      resource_type: 'presence',
      screen: 'chat',
      twitch_user_id: twitchUserId,
    });
  }
};

export interface LoadChannelResourcesOptions {
  channelId: string;
  forceRefresh?: boolean;
  signal?: AbortSignal;
  twitchUserId?: string;
}

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
    // The full load below resets sevenTvPersonalEmotes to {}, so the checked
    // set must forget those users or fetchUserPersonalEmotes short-circuits
    // into the emptied cache until the channel is left and re-entered.
    clearPersonalEmotesCache();
    // An explicit refresh should re-download global provider data too, not
    // serve it from the session cache.
    clearGlobalResourceCache();
  }
  try {
    const caches = chatStore$.persisted.channelCaches.peek();
    const existingCache = caches?.[channelId];

    const plan = planChannelRefresh({
      cache: existingCache,
      forceRefresh: shouldForceRefresh,
      now: Date.now(),
      twitchUserId,
    });

    if (plan.kind === 'cached' && existingCache) {
      if (plan.fetchEmoteSetId) {
        if (exitIfAborted(signal, true)) {
          return false;
        }
        try {
          const sevenTvSetId = await sevenTvService.getEmoteSetId(channelId);

          if (exitIfAborted(signal, true)) {
            return false;
          }

          const channelCache = chatStore$.persisted.channelCaches[channelId];

          if (channelCache) {
            channelCache.assign({
              sevenTvEmoteSetId:
                sevenTvSetId === 'global' ? undefined : sevenTvSetId,
            });
          }
        } catch (error) {
          if (exitIfAborted(signal, true)) {
            return false;
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
      }

      if (plan.fetchSubscriberEmotes && twitchUserId) {
        if (exitIfAborted(signal, true)) {
          return false;
        }

        const subscriberSettled = await settleSpecs([
          buildSubscriberEmoteSpec({ channelId, twitchUserId }),
        ]);

        if (exitIfAborted(signal, true)) {
          return false;
        }

        reportResourceResults({
          channelId,
          settled: subscriberSettled,
          trigger: 'cached_subscriber_emotes_refresh',
        });

        const subscriberResult = subscriberSettled[0]?.result;
        const subscriberEmotes =
          subscriberResult?.status === 'fulfilled'
            ? subscriberResult.value
            : [];
        const channelCache = chatStore$.persisted.channelCaches[channelId];

        if (channelCache) {
          channelCache.assign({
            twitchSubscriberEmotes: subscriberEmotes,
            twitchSubscriberEmotesUserId: twitchUserId,
            emotes: deduplicateById([
              ...subscriberEmotes,
              ...(existingCache.emotes ?? []),
            ]),
          });
        }
      }

      if (plan.refreshBadges) {
        if (exitIfAborted(signal, true)) {
          return false;
        }

        const badgeSpecs = buildBadgeResourceSpecs({ channelId });
        const badgeSettled = await settleSpecs(badgeSpecs);

        if (exitIfAborted(signal, true)) {
          return false;
        }

        reportResourceResults({
          channelId,
          settled: badgeSettled,
          trigger: 'cached_badges_refresh',
        });

        const badgeByKey = reconcileSettledSpecs(badgeSettled, {
          channelId,
          existingCache,
        });

        const badgeResourceSets: BadgeResourceSets = {
          twitchChannelBadges: badgeByKey.get('twitchChannelBadges') ?? [],
          twitchGlobalBadges: badgeByKey.get('twitchGlobalBadges') ?? [],
          ffzGlobalBadges: badgeByKey.get('ffzGlobalBadges') ?? [],
          ffzChannelBadges: badgeByKey.get('ffzChannelBadges') ?? [],
        };

        const allBadges = combineUniqueById(
          ...badgeSettled.map(entry => badgeByKey.get(entry.spec.key) ?? []),
        );

        const channelCache = chatStore$.persisted.channelCaches[channelId];

        if (channelCache) {
          const hasBadgeResourceFailure = badgeSettled.some(
            entry => entry.result.status === 'rejected',
          );

          channelCache.assign({
            badges: allBadges,
            ...badgeResourceSets,
            badgesLastUpdated: hasBadgeResourceFailure
              ? existingCache.badgesLastUpdated
              : Date.now(),
          });
        }
        logger.chat.info('Refetched badges (1h TTL); using cached emotes', {
          name: 'chat_resources_info',
          action: 'badges_refetched_cached_emotes',
          badge_cache_age_ms: plan.badgeCacheAgeMs,
          category: 'data_loading',
          channel_id: channelId,
          screen: 'chat',
        });
      } else {
        logger.chat.info('Using cached channel resources', {
          name: 'chat_resources_info',
          action: 'cached_channel_resources_used',
          cache_age_ms: plan.cacheAgeMs,
          category: 'data_loading',
          channel_id: channelId,
          screen: 'chat',
        });
      }
      batch(() => {
        chatStore$.currentChannelId.set(channelId);
        chatStore$.loadingState.set('COMPLETED');
      });
      if (twitchUserId) {
        void notify7TVPresence(twitchUserId, channelId);
        void fetchUserPersonalEmotes(twitchUserId, channelId);
      }
      void resolveSubscriberChannelProfiles(channelId);
      return true;
    }

    chatStore$.currentChannelId.set(channelId);

    if (exitIfAborted(signal, true)) {
      return false;
    }

    // Only the 7TV channel-emote fetch needs the set id, so resolve it as a
    // promise the spec awaits internally — the other 13 resource fetches
    // start immediately instead of stalling a full round trip behind it.
    const fallbackSevenTvSetId = existingCache?.sevenTvEmoteSetId ?? 'global';
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
    });
    const badgeSpecs = buildBadgeResourceSpecs({ channelId });

    const [emoteSettled, badgeSettled] = await startSpanAsync(
      'fetch-emotes-and-badges',
      'http.client',
      () => Promise.all([settleSpecs(emoteSpecs), settleSpecs(badgeSpecs)]),
      {
        channel_id: channelId,
        service_count: emoteSpecs.length + badgeSpecs.length,
      },
    );

    if (exitIfAborted(signal, true)) {
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

    const cacheContext = { channelId, existingCache };
    const emoteByKey = reconcileSettledSpecs(emoteSettled, cacheContext);
    const badgeByKey = reconcileSettledSpecs(badgeSettled, cacheContext);

    const emoteResourceSets: EmoteResourceSets = {
      sevenTvChannelEmotes: emoteByKey.get('sevenTvChannelEmotes') ?? [],
      sevenTvGlobalEmotes: emoteByKey.get('sevenTvGlobalEmotes') ?? [],
      twitchChannelEmotes: emoteByKey.get('twitchChannelEmotes') ?? [],
      twitchGlobalEmotes: emoteByKey.get('twitchGlobalEmotes') ?? [],
      twitchSubscriberEmotes: emoteByKey.get('twitchSubscriberEmotes') ?? [],
      bttvGlobalEmotes: emoteByKey.get('bttvGlobalEmotes') ?? [],
      bttvChannelEmotes: emoteByKey.get('bttvChannelEmotes') ?? [],
      ffzChannelEmotes: emoteByKey.get('ffzChannelEmotes') ?? [],
      ffzGlobalEmotes: emoteByKey.get('ffzGlobalEmotes') ?? [],
    };

    const badgeResourceSets: BadgeResourceSets = {
      twitchChannelBadges: badgeByKey.get('twitchChannelBadges') ?? [],
      twitchGlobalBadges: badgeByKey.get('twitchGlobalBadges') ?? [],
      ffzGlobalBadges: badgeByKey.get('ffzGlobalBadges') ?? [],
      ffzChannelBadges: badgeByKey.get('ffzChannelBadges') ?? [],
    };

    const allEmotes = combineUniqueById(
      ...emoteSettled.map(entry => emoteByKey.get(entry.spec.key) ?? []),
    );

    const allBadges = combineUniqueById(
      ...badgeSettled.map(entry => badgeByKey.get(entry.spec.key) ?? []),
    );

    if (exitIfAborted(signal, true)) {
      return false;
    }

    const hasEmoteResourceFailure = emoteSettled.some(
      entry => entry.result.status === 'rejected',
    );
    const hasBadgeResourceFailure = badgeSettled.some(
      entry => entry.result.status === 'rejected',
    );
    const now = Date.now();

    const channelData: ChannelCacheType = {
      emotes: allEmotes,
      badges: allBadges,
      lastUpdated:
        hasEmoteResourceFailure && existingCache
          ? existingCache.lastUpdated
          : now,
      badgesLastUpdated:
        hasBadgeResourceFailure && existingCache
          ? existingCache.badgesLastUpdated
          : now,
      ...emoteResourceSets,
      twitchSubscriberEmotesUserId: twitchUserId ?? undefined,
      twitchSubscriberChannelProfiles:
        existingCache?.twitchSubscriberChannelProfiles ?? {},
      ...badgeResourceSets,
      sevenTvPersonalBadges: {},
      sevenTvPersonalEmotes: {},
      sevenTvEmoteSetId: sevenTvSetId === 'global' ? undefined : sevenTvSetId,
    };

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

    if (twitchUserId) {
      void notify7TVPresence(twitchUserId, channelId);
      void fetchUserPersonalEmotes(twitchUserId, channelId);
    }
    void resolveSubscriberChannelProfiles(channelId);

    logger.chat.info('Loaded channel resources', {
      name: 'chat_resources_info',
      action: 'channel_resources_loaded',
      badge_count: allBadges.length,
      category: 'data_loading',
      channel_id: channelId,
      emote_count: allEmotes.length,
      screen: 'chat',
    });

    return true;
  } catch (error) {
    if (exitIfAborted(signal, true)) {
      return false;
    }
    logger.chat.error('Failed to load channel resources', {
      name: 'chat_resources_error',
      error,
      action: 'channel_resources_failed',
      channel_id: channelId,
      screen: 'chat',
    });
    chatStore$.loadingState.set('ERROR');
    return false;
  }
};

/**
 * Fire-and-forget cheermote fetch; failures only log because cheer rendering
 * degrades to plain text without them.
 */
export const loadChannelCheermotes = (channelId: string): void => {
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

export const loadChannelResources = async (
  options: LoadChannelResourcesOptions | string,
  forceRefresh = false,
): Promise<boolean> => {
  const opts: LoadChannelResourcesOptions =
    typeof options === 'string'
      ? { channelId: options, forceRefresh }
      : options;

  const {
    channelId,
    forceRefresh: shouldForceRefresh = false,
    signal,
    twitchUserId,
  } = opts;

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

export const clearCache = (channelId?: string) => {
  if (channelId) {
    batch(() => {
      const currentCaches = chatStore$.persisted.channelCaches.peek() ?? {};

      const { [channelId]: _, ...rest } = currentCaches;
      chatStore$.persisted.channelCaches.set(rest);
      if (chatStore$.currentChannelId.peek() === channelId) {
        chatStore$.currentChannelId.set(null);
      }
    });
  } else {
    batch(() => {
      chatStore$.persisted.channelCaches.set({});
      chatStore$.persisted.lastGlobalUpdate.set(0);
      chatStore$.currentChannelId.set(null);
      chatStore$.loadingState.set('IDLE');
    });
    clearGlobalResourceCache();
  }
};

export const clearChatCosmeticsCache = (): void => {
  batch(() => {
    chatStore$.persisted.channelCaches.set({});
    chatStore$.recentMessagesByChannel.set({});
    chatStore$.persisted.lastGlobalUpdate.set(0);
    chatStore$.currentChannelId.set(null);
    chatStore$.loadingState.set('IDLE');
    chatStore$.emojis.set(getEmojiEmotes(getPreferences().emojiStyle));
    chatStore$.bits.set([]);
    chatStore$.messages.set([]);
  });
  if (RECENT_MESSAGES_PERSISTENCE_ENABLED) {
    clearPersistedRecentMessages();
  }
  clearUserCosmeticsCache();
  clearPersonalEmotesCache();
  clearSubscriberProfilesCache();
  clearEmoteImageCache();
  clearGlobalResourceCache();
  void clearChatStorePersistence();
};

const NO_EMOTES: SanitisedEmote[] = [];
const NO_BADGES: SanitisedBadgeSet[] = [];

export const getCurrentEmoteData = (channelId?: string) => {
  const targetChannelId = channelId ?? chatStore$.currentChannelId.peek();
  if (!targetChannelId) {
    return emptyResolvedEmoteData;
  }
  const caches = chatStore$.persisted.channelCaches.peek();
  const cache = caches?.[targetChannelId];
  if (!cache) {
    return emptyResolvedEmoteData;
  }

  const preferences = getPreferences();

  return {
    twitchChannelEmotes: preferences.showTwitchEmotes
      ? (cache.twitchChannelEmotes ?? NO_EMOTES)
      : NO_EMOTES,
    twitchGlobalEmotes: preferences.showTwitchEmotes
      ? (cache.twitchGlobalEmotes ?? NO_EMOTES)
      : NO_EMOTES,
    twitchSubscriberEmotes: preferences.showTwitchEmotes
      ? (cache.twitchSubscriberEmotes ?? NO_EMOTES)
      : NO_EMOTES,
    sevenTvChannelEmotes: preferences.show7TvEmotes
      ? (cache.sevenTvChannelEmotes ?? NO_EMOTES)
      : NO_EMOTES,
    sevenTvGlobalEmotes: preferences.show7TvEmotes
      ? (cache.sevenTvGlobalEmotes ?? NO_EMOTES)
      : NO_EMOTES,
    ffzChannelEmotes: preferences.showFFzEmotes
      ? (cache.ffzChannelEmotes ?? NO_EMOTES)
      : NO_EMOTES,
    ffzGlobalEmotes: preferences.showFFzEmotes
      ? (cache.ffzGlobalEmotes ?? NO_EMOTES)
      : NO_EMOTES,
    bttvGlobalEmotes: preferences.showBttvEmotes
      ? (cache.bttvGlobalEmotes ?? NO_EMOTES)
      : NO_EMOTES,
    bttvChannelEmotes: preferences.showBttvEmotes
      ? (cache.bttvChannelEmotes ?? NO_EMOTES)
      : NO_EMOTES,
    twitchChannelBadges: preferences.showTwitchBadges
      ? (cache.twitchChannelBadges ?? NO_BADGES)
      : NO_BADGES,
    twitchGlobalBadges: preferences.showTwitchBadges
      ? (cache.twitchGlobalBadges ?? NO_BADGES)
      : NO_BADGES,
    ffzChannelBadges: preferences.showFFzBadges
      ? (cache.ffzChannelBadges ?? NO_BADGES)
      : NO_BADGES,
    ffzGlobalBadges: preferences.showFFzBadges
      ? (cache.ffzGlobalBadges ?? NO_BADGES)
      : NO_BADGES,
    chatterinoBadges: preferences.showChatterinoEmotes
      ? getChatterinoBadges()
      : NO_BADGES,
  };
};

export const getSevenTvEmoteSetId = (channelId?: string): string | null => {
  const targetChannelId = channelId ?? chatStore$.currentChannelId.peek();
  if (!targetChannelId) {
    return null;
  }
  const caches = chatStore$.persisted.channelCaches.peek();
  const cache = caches?.[targetChannelId];
  return cache?.sevenTvEmoteSetId ?? null;
};

export const updateSevenTvEmotes = (
  channelId: string,
  added: SanitisedEmote[],
  removed: SanitisedEmote[],
) => {
  const caches = chatStore$.persisted.channelCaches.peek();
  const cache = caches?.[channelId];

  if (!cache) {
    logger.chat.warn(
      `No channel cache found for ${channelId}, skipping emote update`,
    );
    return;
  }

  const currentEmotes = cache.sevenTvChannelEmotes ?? [];
  const emotesAfterRemoval = currentEmotes.filter(
    (emote: SanitisedEmote) =>
      !removed.some((r: SanitisedEmote) => r.id === emote.id),
  );
  const updatedEmotes = [...emotesAfterRemoval, ...added];
  batch(() => {
    const channelCache = chatStore$.persisted.channelCaches[channelId];
    if (channelCache) {
      channelCache.sevenTvChannelEmotes.set(updatedEmotes);
      channelCache.lastUpdated.set(Date.now());
    }
  });
};
