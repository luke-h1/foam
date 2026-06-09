import { bttvEmoteService } from '@app/services/bttv-emote-service';
import { chatterinoService } from '@app/services/chatterino-service';
import { ffzService } from '@app/services/ffz-service';
import { sevenTvService } from '@app/services/seventv-service';
import { twitchBadgeService } from '@app/services/twitch-badge-service';
import type { SanitisedBadgeSet } from '@app/services/twitch-badge-service';
import { twitchEmoteService } from '@app/services/twitch-emote-service';
import { twitchService } from '@app/services/twitch-service';
import type { SanitisedEmote } from '@app/types/emote';
import { logger } from '@app/utils/logger';
import {
  recordError,
  recordInfo,
  recordWarning,
  startSpanAsync,
} from '@app/lib/sentry';
import type { MonitoringWarningName } from '@app/lib/sentry';
import { clearChatStorePersistence } from '@app/lib/observablePersistence';
import { getEmojiEmotes } from '@app/utils/emoji/emojiEmotes';
import { batch } from '@legendapp/state';

import { getPreferences } from '../../preferences/state';
import { clearUserCosmeticsCache } from './cosmetics';
import type { ChannelCacheType } from '../types/constants';
import {
  BADGE_CACHE_DURATION,
  CACHE_DURATION,
  emptyEmoteData,
} from '../types/constants';
import { clearEmoteImageCache } from './emoteImages';
import { chatStore$, limitChannelCaches } from '../observables/chatStore';

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
          recordInfo({
            name: 'seven_tv_emotes_info',
            message: 'Cached 7TV personal emotes',
            params: {
              action: 'personal_emotes_cached',
              channel_id: channelId,
              emote_count: personalEmotes.length,
              provider: 'seven_tv',
              resource_type: 'emotes',
              scope: 'personal',
              screen: 'chat',
              twitch_user_id: twitchUserId,
            },
          });
        }
      }
      return personalEmotes;
    } catch (error) {
      logger.stv.error(
        `Failed to fetch personal emotes for user ${twitchUserId}:`,
        error,
      );
      recordWarning({
        name: 'seven_tv_emotes_warning',
        message: 'Failed to fetch 7TV personal emotes',
        params: {
          action: 'personal_emotes_failed',
          channel_id: channelId,
          provider: 'seven_tv',
          resource_type: 'emotes',
          scope: 'personal',
          screen: 'chat',
          twitch_user_id: twitchUserId,
        },
        warningCause: error,
      });
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
      recordInfo({
        name: 'seven_tv_presence_info',
        message: 'Skipped 7TV presence because user was not linked',
        params: {
          action: 'presence_user_not_linked',
          channel_id: twitchChannelId,
          provider: 'seven_tv',
          resource_type: 'presence',
          screen: 'chat',
          twitch_user_id: twitchUserId,
        },
      });
      return;
    }
    await sevenTvService.sendPresence(twitchChannelId, sevenTvUserId);
    logger.stvWs.info(
      `Notified 7TV about presence in channel ${twitchChannelId} for user ${twitchUserId}`,
    );
    recordInfo({
      name: 'seven_tv_presence_info',
      message: 'Notified 7TV presence',
      params: {
        action: 'presence_notified',
        channel_id: twitchChannelId,
        provider: 'seven_tv',
        resource_type: 'presence',
        screen: 'chat',
        seven_tv_user_id: sevenTvUserId,
        twitch_user_id: twitchUserId,
      },
    });
  } catch (error) {
    logger.stvWs.error(
      `Failed to notify 7TV about presence: ${String(error)}`,
      error,
    );
    recordWarning({
      name: 'seven_tv_presence_warning',
      message: 'Failed to notify 7TV presence',
      params: {
        action: 'presence_notify_failed',
        channel_id: twitchChannelId,
        provider: 'seven_tv',
        resource_type: 'presence',
        screen: 'chat',
        twitch_user_id: twitchUserId,
      },
      warningCause: error,
    });
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

type ProviderName = 'bttv' | 'chatterino' | 'ffz' | 'seven_tv' | 'twitch';
type ProviderResourceScope = 'channel' | 'global' | 'local' | 'personal';
type ProviderResourceType = 'badges' | 'emotes';

interface ProviderResourceResult<
  TItems extends readonly unknown[] = unknown[],
> {
  name: string;
  provider: ProviderName;
  resource_type: ProviderResourceType;
  result: PromiseSettledResult<TItems>;
  scope: ProviderResourceScope;
  warning_name: MonitoringWarningName;
}

const deduplicateById = <T extends Identifiable>(items: readonly T[]): T[] =>
  Array.from(new Map(items.map(item => [item.id, item])).values());

const getSettledValue = <T>(
  result: PromiseSettledResult<T[]> | undefined,
): T[] => (result?.status === 'fulfilled' ? result.value : []);

const getDedupedSettledOrCachedValue = <
  T extends Identifiable,
  TKey extends keyof ChannelCacheType,
>({
  channelId,
  existingCache,
  key,
  provider,
  resourceName,
  resourceType,
  result,
  scope,
}: {
  channelId: string;
  existingCache: ChannelCacheType | undefined;
  key: TKey;
  provider: ProviderName;
  resourceName: string;
  resourceType: ProviderResourceType;
  result: PromiseSettledResult<T[]>;
  scope: ProviderResourceScope;
}): T[] => {
  if (result.status === 'fulfilled') {
    return deduplicateById(result.value);
  }

  const cachedItems = (existingCache?.[key] ?? []) as unknown as T[];

  if (cachedItems.length > 0) {
    logger.chat.info(`Using cached ${resourceName} as fallback.`);
    recordInfo({
      name: 'chat_resources_info',
      message: `Using cached ${resourceName} as fallback`,
      params: {
        action: 'provider_resource_cache_fallback_used',
        cached_count: cachedItems.length,
        channel_id: channelId,
        provider,
        resource_name: resourceName,
        resource_type: resourceType,
        scope,
        screen: 'chat',
      },
    });
  }

  return deduplicateById(cachedItems);
};

const combineUniqueById = <T extends Identifiable>(
  ...itemGroups: readonly T[][]
): T[] => deduplicateById(itemGroups.flat());

const getSettledItemCount = <TItems extends readonly unknown[]>(
  result: PromiseSettledResult<TItems>,
): number => (result.status === 'fulfilled' ? result.value.length : 0);

function reportProviderResourceResults({
  channelId,
  resources,
  trigger,
}: {
  channelId: string;
  resources: readonly ProviderResourceResult[];
  trigger: string;
}): void {
  const counts: Record<string, number> = {};
  let failedResources = 0;

  resources.forEach(resource => {
    counts[
      `${resource.provider}_${resource.scope}_${resource.resource_type}_count`
    ] = getSettledItemCount(resource.result);

    if (resource.result.status !== 'rejected') {
      return;
    }

    failedResources += 1;
    recordWarning({
      name: resource.warning_name,
      message: `Failed to load ${resource.name}`,
      params: {
        action: 'provider_resource_failed',
        channel_id: channelId,
        provider: resource.provider,
        resource_name: resource.name,
        resource_type: resource.resource_type,
        scope: resource.scope,
        screen: 'chat',
        trigger,
      },
      warningCause: resource.result.reason,
    });
  });

  recordInfo({
    name: 'chat_resources_info',
    message: 'Provider resources settled',
    params: {
      action: 'provider_resources_settled',
      channel_id: channelId,
      failed_resources: failedResources,
      screen: 'chat',
      total_resources: resources.length,
      trigger,
      ...counts,
    },
  });
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
  try {
    const caches = chatStore$.persisted.channelCaches.peek();
    const existingCache = caches?.[channelId];

    if (!shouldForceRefresh) {
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
                    sevenTvSetId === 'global' ? undefined : sevenTvSetId,
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
              recordWarning({
                name: 'seven_tv_emotes_warning',
                message: 'Failed to resolve cached 7TV emote set ID',
                params: {
                  action: 'cached_emote_set_id_failed',
                  channel_id: channelId,
                  provider: 'seven_tv',
                  resource_type: 'emotes',
                  scope: 'channel',
                  screen: 'chat',
                },
                warningCause: error,
              });
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

            const subscriberResult = twitchSubscriberEmotes[0];
            if (subscriberResult) {
              reportProviderResourceResults({
                channelId,
                resources: [
                  {
                    name: 'twitch_subscriber_emotes',
                    provider: 'twitch',
                    resource_type: 'emotes',
                    result: subscriberResult,
                    scope: 'personal',
                    warning_name: 'twitch_emotes_warning',
                  },
                ],
                trigger: 'cached_subscriber_emotes_refresh',
              });
            }

            const subscriberEmotes = getSettledValue(subscriberResult);
            const channelCache = chatStore$.persisted.channelCaches[channelId];

            if (channelCache) {
              const ownerIds = [
                ...new Set(
                  subscriberEmotes
                    .map(e =>
                      'owner_id' in e
                        ? (e as { owner_id?: string }).owner_id
                        : undefined,
                    )
                    .filter((id): id is string => Boolean(id)),
                ),
              ];

              const profileResults = await Promise.allSettled(
                ownerIds.map(id => twitchService.getUser(undefined, id)),
              );

              const profiles: Record<
                string,
                { name: string; profileImageUrl: string }
              > = {};
              profileResults.forEach((result, idx) => {
                const ownerId = ownerIds[idx];
                if (
                  result.status === 'fulfilled' &&
                  result.value?.id &&
                  ownerId
                ) {
                  profiles[ownerId] = {
                    name: result.value.display_name,
                    profileImageUrl: result.value.profile_image_url,
                  };
                }
              });

              channelCache.assign({
                twitchSubscriberEmotes: subscriberEmotes,
                twitchSubscriberEmotesUserId: twitchUserId,
                twitchSubscriberChannelProfiles: profiles,
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

            reportProviderResourceResults({
              channelId,
              resources: [
                {
                  name: 'twitch_channel_badges',
                  provider: 'twitch',
                  resource_type: 'badges',
                  result: twitchChannelBadges,
                  scope: 'channel',
                  warning_name: 'twitch_badges_warning',
                },
                {
                  name: 'twitch_global_badges',
                  provider: 'twitch',
                  resource_type: 'badges',
                  result: twitchGlobalBadges,
                  scope: 'global',
                  warning_name: 'twitch_badges_warning',
                },
                {
                  name: 'ffz_global_badges',
                  provider: 'ffz',
                  resource_type: 'badges',
                  result: ffzGlobalBadges,
                  scope: 'global',
                  warning_name: 'ffz_badges_warning',
                },
                {
                  name: 'ffz_channel_badges',
                  provider: 'ffz',
                  resource_type: 'badges',
                  result: ffzChannelBadges,
                  scope: 'channel',
                  warning_name: 'ffz_badges_warning',
                },
                {
                  name: 'chatterino_badges',
                  provider: 'chatterino',
                  resource_type: 'badges',
                  result: chatterinoBadges,
                  scope: 'local',
                  warning_name: 'chatterino_badges_warning',
                },
              ],
              trigger: 'cached_badges_refresh',
            });

            const badgeResourceSets = {
              twitchChannelBadges: getDedupedSettledOrCachedValue({
                channelId,
                existingCache,
                key: 'twitchChannelBadges',
                provider: 'twitch',
                resourceName: 'Twitch channel badges',
                resourceType: 'badges',
                result: twitchChannelBadges,
                scope: 'channel',
              }),
              twitchGlobalBadges: getDedupedSettledOrCachedValue({
                channelId,
                existingCache,
                key: 'twitchGlobalBadges',
                provider: 'twitch',
                resourceName: 'Twitch global badges',
                resourceType: 'badges',
                result: twitchGlobalBadges,
                scope: 'global',
              }),
              ffzGlobalBadges: getDedupedSettledOrCachedValue({
                channelId,
                existingCache,
                key: 'ffzGlobalBadges',
                provider: 'ffz',
                resourceName: 'FFZ global badges',
                resourceType: 'badges',
                result: ffzGlobalBadges,
                scope: 'global',
              }),
              ffzChannelBadges: getDedupedSettledOrCachedValue({
                channelId,
                existingCache,
                key: 'ffzChannelBadges',
                provider: 'ffz',
                resourceName: 'FFZ channel badges',
                resourceType: 'badges',
                result: ffzChannelBadges,
                scope: 'channel',
              }),
              chatterinoBadges: getDedupedSettledOrCachedValue({
                channelId,
                existingCache,
                key: 'chatterinoBadges',
                provider: 'chatterino',
                resourceName: 'Chatterino badges',
                resourceType: 'badges',
                result: chatterinoBadges,
                scope: 'local',
              }),
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
              const hasBadgeResourceFailure = [
                twitchChannelBadges,
                twitchGlobalBadges,
                ffzGlobalBadges,
                ffzChannelBadges,
                chatterinoBadges,
              ].some(result => result.status === 'rejected');

              channelCache.assign({
                badges: allBadges,
                ...badgeResourceSets,
                badgesLastUpdated: hasBadgeResourceFailure
                  ? existingCache.badgesLastUpdated
                  : Date.now(),
              });
            }
            recordInfo({
              name: 'chat_resources_info',
              message: 'Refetched badges (1h TTL); using cached emotes',
              params: {
                action: 'badges_refetched_cached_emotes',
                badge_cache_age_ms: badgeCacheAge,
                category: 'data_loading',
                channel_id: channelId,
                screen: 'chat',
              },
            });
          } else {
            recordInfo({
              name: 'chat_resources_info',
              message: 'Using cached channel resources',
              params: {
                action: 'cached_channel_resources_used',
                cache_age_ms: cacheAge,
                category: 'data_loading',
                channel_id: channelId,
                screen: 'chat',
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

    let sevenTvSetId = existingCache?.sevenTvEmoteSetId ?? 'global';

    try {
      sevenTvSetId = await sevenTvService.getEmoteSetId(channelId);
    } catch (error) {
      logger.chat.warn('Failed to get 7TV emote set ID:', error);
      recordWarning({
        name: 'seven_tv_emotes_warning',
        message: 'Failed to resolve 7TV emote set ID',
        params: {
          action: 'emote_set_id_failed',
          channel_id: channelId,
          provider: 'seven_tv',
          resource_type: 'emotes',
          scope: 'channel',
          screen: 'chat',
        },
        warningCause: error,
      });
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
      { channel_id: channelId, service_count: 14 },
    );

    if (exitIfAborted(signal, true)) {
      return false;
    }

    reportProviderResourceResults({
      channelId,
      resources: [
        {
          name: 'seven_tv_channel_emotes',
          provider: 'seven_tv',
          resource_type: 'emotes',
          result: sevenTvChannelEmotes,
          scope: 'channel',
          warning_name: 'seven_tv_emotes_warning',
        },
        {
          name: 'seven_tv_global_emotes',
          provider: 'seven_tv',
          resource_type: 'emotes',
          result: sevenTvGlobalEmotes,
          scope: 'global',
          warning_name: 'seven_tv_emotes_warning',
        },
        {
          name: 'twitch_channel_emotes',
          provider: 'twitch',
          resource_type: 'emotes',
          result: twitchChannelEmotes,
          scope: 'channel',
          warning_name: 'twitch_emotes_warning',
        },
        {
          name: 'twitch_global_emotes',
          provider: 'twitch',
          resource_type: 'emotes',
          result: twitchGlobalEmotes,
          scope: 'global',
          warning_name: 'twitch_emotes_warning',
        },
        {
          name: 'twitch_subscriber_emotes',
          provider: 'twitch',
          resource_type: 'emotes',
          result: twitchSubscriberEmotes,
          scope: 'personal',
          warning_name: 'twitch_emotes_warning',
        },
        {
          name: 'bttv_global_emotes',
          provider: 'bttv',
          resource_type: 'emotes',
          result: bttvGlobalEmotes,
          scope: 'global',
          warning_name: 'bttv_emotes_warning',
        },
        {
          name: 'bttv_channel_emotes',
          provider: 'bttv',
          resource_type: 'emotes',
          result: bttvChannelEmotes,
          scope: 'channel',
          warning_name: 'bttv_emotes_warning',
        },
        {
          name: 'ffz_channel_emotes',
          provider: 'ffz',
          resource_type: 'emotes',
          result: ffzChannelEmotes,
          scope: 'channel',
          warning_name: 'ffz_emotes_warning',
        },
        {
          name: 'ffz_global_emotes',
          provider: 'ffz',
          resource_type: 'emotes',
          result: ffzGlobalEmotes,
          scope: 'global',
          warning_name: 'ffz_emotes_warning',
        },
        {
          name: 'twitch_channel_badges',
          provider: 'twitch',
          resource_type: 'badges',
          result: twitchChannelBadges,
          scope: 'channel',
          warning_name: 'twitch_badges_warning',
        },
        {
          name: 'twitch_global_badges',
          provider: 'twitch',
          resource_type: 'badges',
          result: twitchGlobalBadges,
          scope: 'global',
          warning_name: 'twitch_badges_warning',
        },
        {
          name: 'ffz_global_badges',
          provider: 'ffz',
          resource_type: 'badges',
          result: ffzGlobalBadges,
          scope: 'global',
          warning_name: 'ffz_badges_warning',
        },
        {
          name: 'ffz_channel_badges',
          provider: 'ffz',
          resource_type: 'badges',
          result: ffzChannelBadges,
          scope: 'channel',
          warning_name: 'ffz_badges_warning',
        },
        {
          name: 'chatterino_badges',
          provider: 'chatterino',
          resource_type: 'badges',
          result: chatterinoBadges,
          scope: 'local',
          warning_name: 'chatterino_badges_warning',
        },
      ],
      trigger: 'full_channel_resource_load',
    });

    const emoteResourceSets = {
      sevenTvChannelEmotes: getDedupedSettledOrCachedValue({
        channelId,
        existingCache,
        key: 'sevenTvChannelEmotes',
        provider: 'seven_tv',
        resourceName: '7TV channel emotes',
        resourceType: 'emotes',
        result: sevenTvChannelEmotes,
        scope: 'channel',
      }),
      sevenTvGlobalEmotes: getDedupedSettledOrCachedValue({
        channelId,
        existingCache,
        key: 'sevenTvGlobalEmotes',
        provider: 'seven_tv',
        resourceName: '7TV global emotes',
        resourceType: 'emotes',
        result: sevenTvGlobalEmotes,
        scope: 'global',
      }),
      twitchChannelEmotes: getDedupedSettledOrCachedValue({
        channelId,
        existingCache,
        key: 'twitchChannelEmotes',
        provider: 'twitch',
        resourceName: 'Twitch channel emotes',
        resourceType: 'emotes',
        result: twitchChannelEmotes,
        scope: 'channel',
      }),
      twitchGlobalEmotes: getDedupedSettledOrCachedValue({
        channelId,
        existingCache,
        key: 'twitchGlobalEmotes',
        provider: 'twitch',
        resourceName: 'Twitch global emotes',
        resourceType: 'emotes',
        result: twitchGlobalEmotes,
        scope: 'global',
      }),
      twitchSubscriberEmotes: getDedupedSettledOrCachedValue({
        channelId,
        existingCache,
        key: 'twitchSubscriberEmotes',
        provider: 'twitch',
        resourceName: 'Twitch subscriber emotes',
        resourceType: 'emotes',
        result: twitchSubscriberEmotes,
        scope: 'personal',
      }),
      bttvGlobalEmotes: getDedupedSettledOrCachedValue({
        channelId,
        existingCache,
        key: 'bttvGlobalEmotes',
        provider: 'bttv',
        resourceName: 'BTTV global emotes',
        resourceType: 'emotes',
        result: bttvGlobalEmotes,
        scope: 'global',
      }),
      bttvChannelEmotes: getDedupedSettledOrCachedValue({
        channelId,
        existingCache,
        key: 'bttvChannelEmotes',
        provider: 'bttv',
        resourceName: 'BTTV channel emotes',
        resourceType: 'emotes',
        result: bttvChannelEmotes,
        scope: 'channel',
      }),
      ffzChannelEmotes: getDedupedSettledOrCachedValue({
        channelId,
        existingCache,
        key: 'ffzChannelEmotes',
        provider: 'ffz',
        resourceName: 'FFZ channel emotes',
        resourceType: 'emotes',
        result: ffzChannelEmotes,
        scope: 'channel',
      }),
      ffzGlobalEmotes: getDedupedSettledOrCachedValue({
        channelId,
        existingCache,
        key: 'ffzGlobalEmotes',
        provider: 'ffz',
        resourceName: 'FFZ global emotes',
        resourceType: 'emotes',
        result: ffzGlobalEmotes,
        scope: 'global',
      }),
    } satisfies EmoteResourceSets;

    const badgeResourceSets = {
      twitchChannelBadges: getDedupedSettledOrCachedValue({
        channelId,
        existingCache,
        key: 'twitchChannelBadges',
        provider: 'twitch',
        resourceName: 'Twitch channel badges',
        resourceType: 'badges',
        result: twitchChannelBadges,
        scope: 'channel',
      }),
      twitchGlobalBadges: getDedupedSettledOrCachedValue({
        channelId,
        existingCache,
        key: 'twitchGlobalBadges',
        provider: 'twitch',
        resourceName: 'Twitch global badges',
        resourceType: 'badges',
        result: twitchGlobalBadges,
        scope: 'global',
      }),
      ffzGlobalBadges: getDedupedSettledOrCachedValue({
        channelId,
        existingCache,
        key: 'ffzGlobalBadges',
        provider: 'ffz',
        resourceName: 'FFZ global badges',
        resourceType: 'badges',
        result: ffzGlobalBadges,
        scope: 'global',
      }),
      ffzChannelBadges: getDedupedSettledOrCachedValue({
        channelId,
        existingCache,
        key: 'ffzChannelBadges',
        provider: 'ffz',
        resourceName: 'FFZ channel badges',
        resourceType: 'badges',
        result: ffzChannelBadges,
        scope: 'channel',
      }),
      chatterinoBadges: getDedupedSettledOrCachedValue({
        channelId,
        existingCache,
        key: 'chatterinoBadges',
        provider: 'chatterino',
        resourceName: 'Chatterino badges',
        resourceType: 'badges',
        result: chatterinoBadges,
        scope: 'local',
      }),
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

    const hasEmoteResourceFailure = [
      sevenTvChannelEmotes,
      sevenTvGlobalEmotes,
      twitchChannelEmotes,
      twitchGlobalEmotes,
      twitchSubscriberEmotes,
      bttvGlobalEmotes,
      bttvChannelEmotes,
      ffzChannelEmotes,
      ffzGlobalEmotes,
    ].some(result => result.status === 'rejected');
    const hasBadgeResourceFailure = [
      twitchChannelBadges,
      twitchGlobalBadges,
      ffzGlobalBadges,
      ffzChannelBadges,
      chatterinoBadges,
    ].some(result => result.status === 'rejected');
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
    }

    recordInfo({
      name: 'chat_resources_info',
      message: 'Loaded channel resources',
      params: {
        action: 'channel_resources_loaded',
        badge_count: allBadges.length,
        category: 'data_loading',
        channel_id: channelId,
        emote_count: allEmotes.length,
        screen: 'chat',
      },
    });

    return true;
  } catch (error) {
    if (exitIfAborted(signal, true)) {
      return false;
    }
    logger.chat.error('Error loading channel resources:', error);
    recordError({
      name: 'chat_resources_error',
      message: 'Failed to load channel resources',
      params: {
        action: 'channel_resources_failed',
        channel_id: channelId,
        screen: 'chat',
      },
      errorCause: error,
    });
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
  }
};

export const clearChatCosmeticsCache = (): void => {
  batch(() => {
    chatStore$.persisted.channelCaches.set({});
    chatStore$.persisted.recentMessagesByChannel.set({});
    chatStore$.persisted.lastGlobalUpdate.set(0);
    chatStore$.currentChannelId.set(null);
    chatStore$.loadingState.set('IDLE');
    chatStore$.emojis.set(getEmojiEmotes(getPreferences().emojiStyle));
    chatStore$.bits.set([]);
    chatStore$.ttvUsers.set([]);
    chatStore$.messages.set([]);
  });
  clearUserCosmeticsCache();
  clearPersonalEmotesCache();
  clearEmoteImageCache();
  void clearChatStorePersistence();
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
