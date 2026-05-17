import { bttvEmoteService } from '@app/services/bttv-emote-service';
import { chatterinoService } from '@app/services/chatterino-service';
import { ffzService } from '@app/services/ffz-service';
import { startSpanAsync } from '@app/lib/sentry';
import { sevenTvService } from '@app/services/seventv-service';
import { twitchBadgeService } from '@app/services/twitch-badge-service';
import type { SanitisedBadgeSet } from '@app/services/twitch-badge-service';
import { twitchEmoteService } from '@app/services/twitch-emote-service';
import type { SanitisedEmote } from '@app/types/emote';
import { logger } from '@app/utils/logger';
import { recordInfo } from '@app/lib/sentry';
import { getEmojiEmotes } from '@app/utils/emoji/emojiEmotes';
import { batch } from '@legendapp/state';

import { getPreferences } from '../preferenceStore';
import type { ChannelCacheType } from './constants';
import {
  BADGE_CACHE_DURATION,
  CACHE_DURATION,
  emptyEmoteData,
} from './constants';
import { clearEmoteImageCache } from './emoteImages';
import { chatStore$, limitChannelCaches } from './state';

const channelLoadAbort = (() => {
  let current: AbortController | null = null;
  return {
    startNext(): AbortController {
      if (current) {
        current.abort();
        logger.main.info('🚫 Aborted previous load request');
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
      logger.main.info('🚫 Aborted current load request');
    },
  };
})();

export const createLoadController = (): AbortController =>
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

const personalEmoteFetchPromises = new Map<string, Promise<SanitisedEmote[]>>();
const checkedUsersForPersonalEmotes = new Set<string>();

export const fetchUserPersonalEmotes = async (
  twitchUserId: string,
  channelId: string,
): Promise<SanitisedEmote[]> => {
  if (checkedUsersForPersonalEmotes.has(twitchUserId)) {
    const cache = chatStore$.persisted.channelCaches[channelId]?.peek();
    return cache?.sevenTvPersonalEmotes?.[twitchUserId] || [];
  }
  const existingPromise = personalEmoteFetchPromises.get(twitchUserId);

  if (existingPromise) {
    return existingPromise;
  }
  const cache = chatStore$.persisted.channelCaches[channelId]?.peek();

  if (cache?.sevenTvPersonalEmotes?.[twitchUserId]?.length) {
    checkedUsersForPersonalEmotes.add(twitchUserId);
    return cache.sevenTvPersonalEmotes[twitchUserId];
  }

  const fetchPromise = (async (): Promise<SanitisedEmote[]> => {
    try {
      const personalEmotes =
        await sevenTvService.getPersonalEmoteSet(twitchUserId);
      checkedUsersForPersonalEmotes.add(twitchUserId);

      if (personalEmotes.length > 0) {
        const channelCache = chatStore$.persisted.channelCaches[channelId];

        if (channelCache) {
          const currentPersonalEmotes =
            channelCache.sevenTvPersonalEmotes?.peek() || {};
          channelCache.sevenTvPersonalEmotes.set({
            ...currentPersonalEmotes,
            [twitchUserId]: personalEmotes,
          });
          logger.stv.info(
            `Cached ${personalEmotes.length} personal emotes for user ${twitchUserId}`,
          );
        }
      }
      return personalEmotes;
    } catch (error) {
      logger.stv.error(
        `Failed to fetch personal emotes for user ${twitchUserId}:`,
        error,
      );
      checkedUsersForPersonalEmotes.add(twitchUserId);
      return [];
    } finally {
      personalEmoteFetchPromises.delete(twitchUserId);
    }
  })();
  personalEmoteFetchPromises.set(twitchUserId, fetchPromise);
  return fetchPromise;
};

export const getUserPersonalEmotes = (
  twitchUserId: string,
  channelId: string,
): SanitisedEmote[] => {
  const cache = chatStore$.persisted.channelCaches[channelId]?.peek();
  return cache?.sevenTvPersonalEmotes?.[twitchUserId] || [];
};

export const hasCheckedPersonalEmotes = (twitchUserId: string): boolean =>
  checkedUsersForPersonalEmotes.has(twitchUserId);

export const clearPersonalEmotesCache = () => {
  checkedUsersForPersonalEmotes.clear();
  personalEmoteFetchPromises.clear();
};

export const clearChannelResources = () => {
  batch(() => {
    chatStore$.currentChannelId.set(null);
    chatStore$.loadingState.set('IDLE');
    chatStore$.emojis.set(getEmojiEmotes(getPreferences().emojiStyle));
    chatStore$.bits.set([]);
  });
  checkedUsersForPersonalEmotes.clear();
};

export const notify7TVPresence = async (
  twitchUserId: string | undefined,
  twitchChannelId: string,
): Promise<void> => {
  if (!twitchUserId || !twitchChannelId) {
    logger.stvWs.debug(
      'Skipping 7TV presence notification: missing user or channel ID',
    );
    return;
  }

  try {
    const sevenTvUserId = await sevenTvService.get7tvUserId(twitchUserId);
    if (!sevenTvUserId) {
      logger.stvWs.warn(
        `Could not get 7TV user ID for Twitch user: ${twitchUserId}`,
      );
      return;
    }
    await sevenTvService.sendPresence(twitchChannelId, sevenTvUserId);
    logger.stvWs.info(
      `Notified 7TV about presence in channel ${twitchChannelId} for user ${twitchUserId}`,
    );
  } catch (error) {
    logger.stvWs.error(
      `Failed to notify 7TV about presence: ${String(error)}`,
      error,
    );
  }
};

export interface LoadChannelResourcesOptions {
  channelId: string;
  forceRefresh?: boolean;
  signal?: AbortSignal;
  twitchUserId?: string;
}

type Identifiable = { id: string };

type EmoteResourceSets = Pick<
  ChannelCacheType,
  | 'twitchChannelEmotes'
  | 'twitchGlobalEmotes'
  | 'twitchSubscriberEmotes'
  | 'sevenTvChannelEmotes'
  | 'sevenTvGlobalEmotes'
  | 'bttvGlobalEmotes'
  | 'bttvChannelEmotes'
  | 'ffzChannelEmotes'
  | 'ffzGlobalEmotes'
>;

type BadgeResourceSets = Pick<
  ChannelCacheType,
  | 'twitchChannelBadges'
  | 'twitchGlobalBadges'
  | 'ffzGlobalBadges'
  | 'ffzChannelBadges'
  | 'chatterinoBadges'
>;

const deduplicateById = <T extends Identifiable>(items: readonly T[]): T[] =>
  Array.from(new Map(items.map(item => [item.id, item])).values());

const getSettledValue = <T>(
  result: PromiseSettledResult<T[]> | undefined,
): T[] => (result?.status === 'fulfilled' ? result.value : []);

const getDedupedSettledValue = <T extends Identifiable>(
  result: PromiseSettledResult<T[]> | undefined,
): T[] => deduplicateById(getSettledValue(result));

const combineUniqueById = <T extends Identifiable>(
  ...itemGroups: readonly T[][]
): T[] => deduplicateById(itemGroups.flat());

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
  try {
    if (!shouldForceRefresh) {
      const caches = chatStore$.persisted.channelCaches.peek();
      const existingCache = caches?.[channelId];
      if (existingCache) {
        const cacheAge = Date.now() - existingCache.lastUpdated;
        const hasEmptyEmotes =
          (existingCache.twitchChannelEmotes?.length || 0) === 0 &&
          (existingCache.twitchGlobalEmotes?.length || 0) === 0 &&
          (existingCache.sevenTvChannelEmotes?.length || 0) === 0 &&
          (existingCache.sevenTvGlobalEmotes?.length || 0) === 0 &&
          (existingCache.ffzChannelEmotes?.length || 0) === 0 &&
          (existingCache.ffzGlobalEmotes?.length || 0) === 0 &&
          (existingCache.bttvChannelEmotes?.length || 0) === 0 &&
          (existingCache.bttvGlobalEmotes?.length || 0) === 0;

        const missingEmoteSetId = !existingCache.sevenTvEmoteSetId;
        const missingCurrentSubscriberEmotes =
          Boolean(twitchUserId) &&
          existingCache.twitchSubscriberEmotesUserId !== twitchUserId;

        const badgeCacheAge =
          Date.now() -
          (existingCache.badgesLastUpdated ?? existingCache.lastUpdated ?? 0);

        const badgesStale = badgeCacheAge >= BADGE_CACHE_DURATION;

        if (!hasEmptyEmotes && cacheAge < CACHE_DURATION) {
          if (missingEmoteSetId) {
            if (exitIfAborted(signal, true)) {
              return false;
            }
            try {
              const sevenTvSetId =
                await sevenTvService.getEmoteSetId(channelId);

              if (exitIfAborted(signal, true)) {
                return false;
              }

              const channelCache =
                chatStore$.persisted.channelCaches[channelId];

              if (channelCache) {
                channelCache.assign({
                  sevenTvEmoteSetId:
                    sevenTvSetId !== 'global' ? sevenTvSetId : undefined,
                });
              }
            } catch (error) {
              if (exitIfAborted(signal, true)) {
                return false;
              }
              logger.chat.warn(
                'Failed to get 7TV emote set ID for cached data:',
                error,
              );
            }
          }

          if (missingCurrentSubscriberEmotes && twitchUserId) {
            if (exitIfAborted(signal, true)) {
              return false;
            }

            const twitchSubscriberEmotes = await Promise.allSettled([
              twitchEmoteService.getSubscriberEmotes(twitchUserId, channelId),
            ]);

            if (exitIfAborted(signal, true)) {
              return false;
            }

            const subscriberEmotes = getSettledValue(twitchSubscriberEmotes[0]);
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

          if (badgesStale) {
            if (exitIfAborted(signal, true)) {
              return false;
            }

            const [
              twitchChannelBadges,
              twitchGlobalBadges,
              ffzGlobalBadges,
              ffzChannelBadges,
              chatterinoBadges,
            ] = await Promise.allSettled([
              twitchBadgeService.listSanitisedChannelBadges(channelId),
              twitchBadgeService.listSanitisedGlobalBadges(),
              ffzService.getSanitisedGlobalBadges(),
              ffzService.getSanitisedChannelBadges(channelId),
              Promise.resolve(chatterinoService.listSanitisedBadges()),
            ]);

            if (exitIfAborted(signal, true)) {
              return false;
            }

            const badgeResourceSets = {
              twitchChannelBadges: getDedupedSettledValue(twitchChannelBadges),
              twitchGlobalBadges: getDedupedSettledValue(twitchGlobalBadges),
              ffzGlobalBadges: getDedupedSettledValue(ffzGlobalBadges),
              ffzChannelBadges: getDedupedSettledValue(ffzChannelBadges),
              chatterinoBadges: getDedupedSettledValue(chatterinoBadges),
            } satisfies BadgeResourceSets;

            const allBadges = combineUniqueById<SanitisedBadgeSet>(
              badgeResourceSets.twitchChannelBadges,
              badgeResourceSets.twitchGlobalBadges,
              badgeResourceSets.ffzGlobalBadges,
              badgeResourceSets.ffzChannelBadges,
              badgeResourceSets.chatterinoBadges,
            );

            const channelCache = chatStore$.persisted.channelCaches[channelId];

            if (channelCache) {
              channelCache.assign({
                badges: allBadges,
                ...badgeResourceSets,
                badgesLastUpdated: Date.now(),
              });
            }
            recordInfo({
              name: 'DataLoadingInfo',
              message: 'Refetched badges (1h TTL); using cached emotes',
              params: {
                category: 'DataLoading',
                action: 'badges_refetched_cached_emotes',
                channelId,
                badgeCacheAge,
              },
            });
          } else {
            recordInfo({
              name: 'DataLoadingInfo',
              message: 'Using cached channel resources',
              params: {
                category: 'DataLoading',
                action: 'cached_channel_resources_used',
                channelId,
                cacheAge,
              },
            });
          }
          batch(() => {
            chatStore$.currentChannelId.set(channelId);
            chatStore$.loadingState.set('COMPLETED');
          });
          if (twitchUserId) {
            void notify7TVPresence(twitchUserId, channelId);
          }
          return true;
        }
      }
    }

    chatStore$.currentChannelId.set(channelId);

    if (exitIfAborted(signal, true)) {
      return false;
    }

    let sevenTvSetId = 'global';

    try {
      sevenTvSetId = await sevenTvService.getEmoteSetId(channelId);
    } catch (error) {
      logger.chat.warn('Failed to get 7TV emote set ID:', error);
    }

    if (exitIfAborted(signal, true)) {
      return false;
    }

    const [
      sevenTvChannelEmotes,
      sevenTvGlobalEmotes,
      twitchChannelEmotes,
      twitchGlobalEmotes,
      twitchSubscriberEmotes,
      bttvGlobalEmotes,
      bttvChannelEmotes,
      ffzChannelEmotes,
      ffzGlobalEmotes,
      twitchChannelBadges,
      twitchGlobalBadges,
      ffzGlobalBadges,
      ffzChannelBadges,
      chatterinoBadges,
    ] = await startSpanAsync(
      'fetch-emotes-and-badges',
      'http.client',
      () =>
        Promise.allSettled([
          sevenTvService.getSanitisedEmoteSet(sevenTvSetId),
          sevenTvService.getSanitisedEmoteSet('global'),
          twitchEmoteService.getChannelEmotes(channelId),
          twitchEmoteService.getGlobalEmotes(),
          twitchUserId
            ? twitchEmoteService.getSubscriberEmotes(twitchUserId, channelId)
            : Promise.resolve([]),
          bttvEmoteService.getSanitisedGlobalEmotes(),
          bttvEmoteService.getSanitisedChannelEmotes(channelId),
          ffzService.getSanitisedChannelEmotes(channelId),
          ffzService.getSanitisedGlobalEmotes(),
          twitchBadgeService.listSanitisedChannelBadges(channelId),
          twitchBadgeService.listSanitisedGlobalBadges(),
          ffzService.getSanitisedGlobalBadges(),
          ffzService.getSanitisedChannelBadges(channelId),
          Promise.resolve(chatterinoService.listSanitisedBadges()),
        ]),
      { channelId, services: 14 },
    );

    if (exitIfAborted(signal, true)) {
      return false;
    }

    const emoteResourceSets = {
      sevenTvChannelEmotes: getDedupedSettledValue(sevenTvChannelEmotes),
      sevenTvGlobalEmotes: getDedupedSettledValue(sevenTvGlobalEmotes),
      twitchChannelEmotes: getDedupedSettledValue(twitchChannelEmotes),
      twitchGlobalEmotes: getDedupedSettledValue(twitchGlobalEmotes),
      twitchSubscriberEmotes: getDedupedSettledValue(twitchSubscriberEmotes),
      bttvGlobalEmotes: getDedupedSettledValue(bttvGlobalEmotes),
      bttvChannelEmotes: getDedupedSettledValue(bttvChannelEmotes),
      ffzChannelEmotes: getDedupedSettledValue(ffzChannelEmotes),
      ffzGlobalEmotes: getDedupedSettledValue(ffzGlobalEmotes),
    } satisfies EmoteResourceSets;

    const badgeResourceSets = {
      twitchChannelBadges: getDedupedSettledValue(twitchChannelBadges),
      twitchGlobalBadges: getDedupedSettledValue(twitchGlobalBadges),
      ffzGlobalBadges: getDedupedSettledValue(ffzGlobalBadges),
      ffzChannelBadges: getDedupedSettledValue(ffzChannelBadges),
      chatterinoBadges: getDedupedSettledValue(chatterinoBadges),
    } satisfies BadgeResourceSets;

    const allEmotes = combineUniqueById<SanitisedEmote>(
      emoteResourceSets.sevenTvChannelEmotes,
      emoteResourceSets.sevenTvGlobalEmotes,
      emoteResourceSets.twitchChannelEmotes,
      emoteResourceSets.twitchGlobalEmotes,
      emoteResourceSets.twitchSubscriberEmotes,
      emoteResourceSets.bttvGlobalEmotes,
      emoteResourceSets.bttvChannelEmotes,
      emoteResourceSets.ffzChannelEmotes,
      emoteResourceSets.ffzGlobalEmotes,
    );

    const allBadges = combineUniqueById<SanitisedBadgeSet>(
      badgeResourceSets.twitchChannelBadges,
      badgeResourceSets.twitchGlobalBadges,
      badgeResourceSets.ffzGlobalBadges,
      badgeResourceSets.ffzChannelBadges,
      badgeResourceSets.chatterinoBadges,
    );

    if (exitIfAborted(signal, true)) {
      return false;
    }

    const channelData: ChannelCacheType = {
      emotes: allEmotes,
      badges: allBadges,
      lastUpdated: Date.now(),
      badgesLastUpdated: Date.now(),
      ...emoteResourceSets,
      twitchSubscriberEmotesUserId: twitchUserId ?? undefined,
      ...badgeResourceSets,
      sevenTvPersonalBadges: {},
      sevenTvPersonalEmotes: {},
      sevenTvEmoteSetId: sevenTvSetId !== 'global' ? sevenTvSetId : undefined,
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
    }

    recordInfo({
      name: 'DataLoadingInfo',
      message: 'Loaded channel resources',
      params: {
        category: 'DataLoading',
        action: 'channel_resources_loaded',
        channelId,
        emoteCount: allEmotes.length,
        badgeCount: allBadges.length,
      },
    });

    return true;
  } catch (error) {
    if (exitIfAborted(signal, true)) {
      return false;
    }
    logger.chat.error('Error loading channel resources:', error);
    chatStore$.loadingState.set('ERROR');
    return false;
  }
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
    { channelId, forceRefresh: shouldForceRefresh },
  );
};

export const getCacheAge = (channelId: string): number | null => {
  const caches = chatStore$.persisted.channelCaches.peek();
  const cache = caches?.[channelId];
  if (!cache) {
    return null;
  }
  return Date.now() - cache.lastUpdated;
};

export const isCacheExpired = (
  channelId: string,
  maxAge = CACHE_DURATION,
): boolean => {
  const cacheAge = getCacheAge(channelId);
  if (cacheAge === null) {
    return true;
  }
  return cacheAge > maxAge;
};

export const expireCache = (channelId?: string) => {
  if (channelId) {
    const caches = chatStore$.persisted.channelCaches.peek();
    if (caches?.[channelId]) {
      const channelCache = chatStore$.persisted.channelCaches[channelId];
      if (channelCache) {
        channelCache.lastUpdated.set(0);
        channelCache.badgesLastUpdated.set(0);
      }
    }
  } else {
    const caches = chatStore$.persisted.channelCaches.peek() ?? {};
    Object.keys(caches).forEach(id => {
      const cache = chatStore$.persisted.channelCaches[id];
      if (cache) {
        cache.lastUpdated.set(0);
        cache.badgesLastUpdated.set(0);
      }
    });
    chatStore$.persisted.lastGlobalUpdate.set(0);
  }
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
  }
};

export const clearAllCache = () => {
  batch(() => {
    chatStore$.persisted.channelCaches.set({});
    chatStore$.persisted.lastGlobalUpdate.set(0);
    chatStore$.currentChannelId.set(null);
    chatStore$.loadingState.set('IDLE');
    chatStore$.emojis.set(getEmojiEmotes(getPreferences().emojiStyle));
    chatStore$.bits.set([]);
    chatStore$.ttvUsers.set([]);
    chatStore$.messages.set([]);
  });
  clearEmoteImageCache();
};

export const refreshChannelResources = async (
  channelId: string,
  forceRefresh = false,
  twitchUserId?: string,
): Promise<boolean> => {
  if (forceRefresh) {
    clearCache(channelId);
  }
  return loadChannelResources({ channelId, forceRefresh, twitchUserId });
};

export const getCurrentEmoteData = (channelId?: string) => {
  const targetChannelId = channelId ?? chatStore$.currentChannelId.peek();
  if (!targetChannelId) {
    return emptyEmoteData;
  }
  const caches = chatStore$.persisted.channelCaches.peek();
  const cache = caches?.[targetChannelId];
  if (!cache) {
    return emptyEmoteData;
  }

  const preferences = getPreferences();

  return {
    twitchChannelEmotes: preferences.showTwitchEmotes
      ? (cache.twitchChannelEmotes ?? [])
      : [],
    twitchGlobalEmotes: preferences.showTwitchEmotes
      ? (cache.twitchGlobalEmotes ?? [])
      : [],
    twitchSubscriberEmotes: preferences.showTwitchEmotes
      ? (cache.twitchSubscriberEmotes ?? [])
      : [],
    sevenTvChannelEmotes: preferences.show7TvEmotes
      ? (cache.sevenTvChannelEmotes ?? [])
      : [],
    sevenTvGlobalEmotes: preferences.show7TvEmotes
      ? (cache.sevenTvGlobalEmotes ?? [])
      : [],
    ffzChannelEmotes: preferences.showFFzEmotes
      ? (cache.ffzChannelEmotes ?? [])
      : [],
    ffzGlobalEmotes: preferences.showFFzEmotes
      ? (cache.ffzGlobalEmotes ?? [])
      : [],
    bttvGlobalEmotes: preferences.showBttvEmotes
      ? (cache.bttvGlobalEmotes ?? [])
      : [],
    bttvChannelEmotes: preferences.showBttvEmotes
      ? (cache.bttvChannelEmotes ?? [])
      : [],
    twitchChannelBadges: preferences.showTwitchBadges
      ? (cache.twitchChannelBadges ?? [])
      : [],
    twitchGlobalBadges: preferences.showTwitchBadges
      ? (cache.twitchGlobalBadges ?? [])
      : [],
    ffzChannelBadges: preferences.showFFzBadges
      ? (cache.ffzChannelBadges ?? [])
      : [],
    ffzGlobalBadges: preferences.showFFzBadges
      ? (cache.ffzGlobalBadges ?? [])
      : [],
    chatterinoBadges: preferences.showChatterinoEmotes
      ? (cache.chatterinoBadges ?? [])
      : [],
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
  logger.chat.info(
    `Updating SevenTV emotes for channel ${channelId}: +${added.length} -${removed.length}`,
  );
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

export const getCachedEmotes = (channelId: string): SanitisedEmote[] => {
  const caches = chatStore$.persisted.channelCaches.peek();
  const cache = caches?.[channelId];
  return cache?.emotes ?? [];
};

export const getCachedBadges = (channelId: string): SanitisedBadgeSet[] => {
  const caches = chatStore$.persisted.channelCaches.peek();
  const cache = caches?.[channelId];
  return cache?.badges ?? [];
};
