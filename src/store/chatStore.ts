import { bttvEmoteService } from '@app/services/bttv-emote-service';
import { chatterinoService } from '@app/services/chatterino-service';
import { ffzService } from '@app/services/ffz-service';
import {
  SanitisiedEmoteSet,
  sevenTvService,
} from '@app/services/seventv-service';
import {
  SanitisedBadgeSet,
  twitchBadgeService,
} from '@app/services/twitch-badge-service';
import { twitchEmoteService } from '@app/services/twitch-emote-service';
import { ClearChatTags } from '@app/types/chat/irc-tags/clearchat';
import { ClearMsgTags } from '@app/types/chat/irc-tags/clearmsg';
import { GlobalUserStateTags } from '@app/types/chat/irc-tags/globaluserstate';
import { NoticeTags } from '@app/types/chat/irc-tags/notice';
import { NoticeVariants } from '@app/types/chat/irc-tags/noticevariant';
import { RoomStateTags } from '@app/types/chat/irc-tags/roomstate';
import {
  UserNoticeTags,
  UserNoticeTagsByVariant,
  UserNoticeVariantMap,
} from '@app/types/chat/irc-tags/usernotice';
import { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import {
  cacheImageFromUrl,
  clearSessionCache,
  getCachedImageUri,
} from '@app/utils/image/image-cache';
import { logger } from '@app/utils/logger';
import { batch, observable } from '@legendapp/state';
import {
  configureObservablePersistence,
  persistObservable,
} from '@legendapp/state/persist';
import { ObservablePersistMMKV } from '@legendapp/state/persist-plugins/mmkv';
import { useSelector } from '@legendapp/state/react';
import { ViewStyle } from 'react-native';
import { usePreferences } from './preferenceStore';

configureObservablePersistence({
  pluginLocal: ObservablePersistMMKV,
});

interface CosmeticPaint {
  id: string;
  name: string;
  style: string;
  shape: string;
  backgroundImage: string;
  shadows: string | null;
  KIND: 'animated' | 'non-animated';
  url: string;
}

export interface ChatUser {
  name: string;
  color: string;
  cosmetics?: {
    [key: string]: unknown;
    personal_emotes?: SanitisedBadgeSet;
    paints: CosmeticPaint[];
    badges: SanitisedBadgeSet[];
    user_info: {
      lastUpdate: number;
      user_id: string;
      ttv_user_id: string | null;
      paint_id: string | null;
      badge_id: string | null;
      avatar_url: string | null;
      personal_emotes: SanitisedBadgeSet[];
      personal_set_id: string[];
      color?: string;
    };
  };
  avatar: string | null;
  userId: string;
}

export interface Bit {
  name: string;
  tiers: {
    min_bits: string;
  }[];
}

export interface ChatMessageType<
  TNoticeType extends NoticeVariants,
  TVariant extends TNoticeType extends 'usernotice'
    ? keyof UserNoticeVariantMap
    : never = never,
> {
  userstate: UserStateTags;
  message: ParsedPart[];
  badges: SanitisedBadgeSet[];
  channel: string;
  message_id: string;
  message_nonce: string;
  sender: string;
  style?: ViewStyle;
  parentDisplayName?: string;
  replyDisplayName: string;
  replyBody: string;
  parentColor?: string;
  notice_tags?: TNoticeType extends 'userstate'
    ? UserStateTags
    : TNoticeType extends 'usernotice'
      ? TVariant extends keyof UserNoticeVariantMap
        ? UserNoticeTagsByVariant<TVariant>
        : UserNoticeTags
      : TNoticeType extends 'clearchat'
        ? ClearChatTags
        : TNoticeType extends 'clearmsg'
          ? ClearMsgTags
          : TNoticeType extends 'globalusernotice'
            ? GlobalUserStateTags
            : TNoticeType extends 'roomstate'
              ? RoomStateTags
              : TNoticeType extends 'notice'
                ? NoticeTags
                : never;
}

export type ChatLoadingState =
  | 'IDLE'
  | 'RESTORING_FROM_CACHE'
  | 'RESTORED_FROM_CACHE'
  | 'LOADING'
  | 'COMPLETED'
  | 'ERROR';

export interface ChannelCacheType {
  emotes: SanitisiedEmoteSet[];
  badges: SanitisedBadgeSet[];
  lastUpdated: number;
  twitchChannelEmotes: SanitisiedEmoteSet[];
  twitchGlobalEmotes: SanitisiedEmoteSet[];
  sevenTvChannelEmotes: SanitisiedEmoteSet[];
  sevenTvGlobalEmotes: SanitisiedEmoteSet[];
  ffzChannelEmotes: SanitisiedEmoteSet[];
  ffzGlobalEmotes: SanitisiedEmoteSet[];
  bttvGlobalEmotes: SanitisiedEmoteSet[];
  bttvChannelEmotes: SanitisiedEmoteSet[];
  twitchChannelBadges: SanitisedBadgeSet[];
  twitchGlobalBadges: SanitisedBadgeSet[];
  ffzGlobalBadges: SanitisedBadgeSet[];
  ffzChannelBadges: SanitisedBadgeSet[];
  chatterinoBadges: SanitisedBadgeSet[];
  sevenTvEmoteSetId?: string;
}

const MAX_MESSAGES = 500;
const MAX_CACHED_CHANNELS = 10;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 1 day

// Track in-progress downloads to prevent duplicate requests
const emoteImageCachePromises = new Map<string, Promise<string>>();

const emptyEmoteData = {
  twitchChannelEmotes: [] as SanitisiedEmoteSet[],
  twitchGlobalEmotes: [] as SanitisiedEmoteSet[],
  sevenTvChannelEmotes: [] as SanitisiedEmoteSet[],
  sevenTvGlobalEmotes: [] as SanitisiedEmoteSet[],
  ffzChannelEmotes: [] as SanitisiedEmoteSet[],
  ffzGlobalEmotes: [] as SanitisiedEmoteSet[],
  bttvGlobalEmotes: [] as SanitisiedEmoteSet[],
  bttvChannelEmotes: [] as SanitisiedEmoteSet[],
  twitchChannelBadges: [] as SanitisedBadgeSet[],
  twitchGlobalBadges: [] as SanitisedBadgeSet[],
  ffzChannelBadges: [] as SanitisedBadgeSet[],
  ffzGlobalBadges: [] as SanitisedBadgeSet[],
  badges: [] as SanitisedBadgeSet[],
  emotes: [] as SanitisiedEmoteSet[],
  lastUpdated: 0,
  sevenTvEmoteSetId: undefined,
  chatterinoBadges: [] as SanitisedBadgeSet[],
} satisfies ChannelCacheType;

const limitChannelCaches = (
  channelCaches: Record<string, ChannelCacheType>,
  currentChannelId: string | null,
): Record<string, ChannelCacheType> => {
  const entries = Object.entries(channelCaches);
  if (entries.length <= MAX_CACHED_CHANNELS) {
    return channelCaches;
  }

  const sorted = entries.sort((a, b) => {
    if (a[0] === currentChannelId) return -1;
    if (b[0] === currentChannelId) return 1;
    return (b[1].lastUpdated || 0) - (a[1].lastUpdated || 0);
  });

  const limited = sorted.slice(0, MAX_CACHED_CHANNELS);
  logger.main.info(
    `Pruned channelCaches from ${entries.length} to ${limited.length} channels`,
  );
  return Object.fromEntries(limited);
};

export const chatStore$ = observable({
  persisted: {
    channelCaches: {} as Record<string, ChannelCacheType>,
    lastGlobalUpdate: 0,
  },

  // Transient state not persisted between channel swaps
  loadingState: 'IDLE' as ChatLoadingState,
  currentChannelId: null as string | null,
  emojis: [] as SanitisiedEmoteSet[],
  bits: [] as Bit[],
  ttvUsers: [] as ChatUser[],
  messages: [] as ChatMessageType<never>[],
});

persistObservable(chatStore$.persisted, {
  local: 'chat-store-v2',
});

export const addMessage = <TNoticeType extends NoticeVariants>(
  message: ChatMessageType<TNoticeType>,
) => {
  const currentLength = chatStore$.messages.peek().length;
  chatStore$.messages.push(message as ChatMessageType<never>);

  if (currentLength >= MAX_MESSAGES) {
    const removeCount = Math.floor(MAX_MESSAGES * 0.2);
    chatStore$.messages.set(msgs => msgs.slice(removeCount));
  }
};

export const addMessages = (messages: ChatMessageType<never>[]) => {
  if (messages.length === 0) return;

  batch(() => {
    const current = chatStore$.messages.peek();
    const updated = [...current, ...messages];

    if (updated.length > MAX_MESSAGES) {
      const removeCount = Math.floor(MAX_MESSAGES * 0.2);
      chatStore$.messages.set(updated.slice(removeCount));
    } else {
      chatStore$.messages.set(updated);
    }
  });
};

export const clearMessages = () => {
  chatStore$.messages.set([]);
};

export const addTtvUser = (user: ChatUser) => {
  const existingUsers = chatStore$.ttvUsers.peek();
  const newUsers = [...existingUsers, user].filter(
    (existingUser, index, self) =>
      index === self.findIndex(t => t.userId === existingUser.userId),
  );
  chatStore$.ttvUsers.set(newUsers);
};

export const clearTtvUsers = () => {
  chatStore$.ttvUsers.set([]);
};

export const setBits = (bits: Bit[]) => {
  chatStore$.bits.set(bits);
};

export const clearChannelResources = () => {
  batch(() => {
    chatStore$.currentChannelId.set(null);
    chatStore$.loadingState.set('IDLE');
    chatStore$.emojis.set([]);
    chatStore$.bits.set([]);
  });
};

export const loadChannelResources = async (
  channelId: string,
  forceRefresh = false,
): Promise<boolean> => {
  const startTime = performance.now();
  logger.main.info('🏗️ chatStore loadChannelResources called:', {
    channelId,
    forceRefresh,
  });

  chatStore$.loadingState.set('LOADING');

  try {
    let reason = '';

    if (!forceRefresh) {
      const caches = chatStore$.persisted.channelCaches.peek();
      const existingCache = caches?.[channelId];
      logger.main.info('🗄️ Existing cache check:', {
        channelId,
        hasCache: !!existingCache,
      });

      if (!existingCache) {
        reason = 'No persisted state found';
      } else {
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

        logger.main.info('📊 Cache validation:', {
          cacheAge: Math.round(cacheAge / (60 * 1000)),
          hasEmptyEmotes,
          missingEmoteSetId,
        });

        if (hasEmptyEmotes) {
          reason = 'Cached data has empty emote lists';
        } else if (cacheAge >= CACHE_DURATION) {
          reason = `Cache expired (age: ${Math.round(cacheAge / (60 * 1000))} minutes)`;
        } else {
          logger.main.info('✅ Using cached data');

          if (missingEmoteSetId) {
            try {
              const sevenTvSetId =
                await sevenTvService.getEmoteSetId(channelId);
              const channelCache =
                chatStore$.persisted.channelCaches[channelId];
              if (channelCache) {
                channelCache.assign({
                  sevenTvEmoteSetId: sevenTvSetId,
                });
              }
            } catch (error) {
              logger.chat.warn(
                'Failed to get 7TV emote set ID for cached data:',
                error,
              );
            }
          }

          batch(() => {
            chatStore$.currentChannelId.set(channelId);
            chatStore$.loadingState.set('COMPLETED');
          });

          const totalDuration = performance.now() - startTime;
          logger.performance.debug(
            `⏳ Load channel resources (from cache) ${channelId} -- time: ${totalDuration.toFixed(2)} ms`,
          );
          return true;
        }
      }
    } else {
      reason = 'Force refresh requested';
    }

    logger.main.info('🌐 Fetching from APIs, reason:', reason);
    chatStore$.currentChannelId.set(channelId);

    let sevenTvSetId = 'global';
    try {
      sevenTvSetId = await sevenTvService.getEmoteSetId(channelId);
    } catch (error) {
      logger.chat.warn('Failed to get 7TV emote set ID:', error);
    }

    const parallelFetchStart = performance.now();
    const [
      sevenTvChannelEmotes,
      sevenTvGlobalEmotes,
      twitchChannelEmotes,
      twitchGlobalEmotes,
      bttvGlobalEmotes,
      bttvChannelEmotes,
      ffzChannelEmotes,
      ffzGlobalEmotes,
      twitchChannelBadges,
      twitchGlobalBadges,
      ffzGlobalBadges,
      ffzChannelBadges,
      chatterinoBadges,
    ] = await Promise.allSettled([
      sevenTvService.getSanitisedEmoteSet(sevenTvSetId),
      sevenTvService.getSanitisedEmoteSet('global'),
      twitchEmoteService.getChannelEmotes(channelId),
      twitchEmoteService.getGlobalEmotes(),
      bttvEmoteService.getSanitisedGlobalEmotes(),
      bttvEmoteService.getSanitisedChannelEmotes(channelId),
      ffzService.getSanitisedChannelEmotes(channelId),
      ffzService.getSanitisedGlobalEmotes(),
      twitchBadgeService.listSanitisedChannelBadges(channelId),
      twitchBadgeService.listSanitisedGlobalBadges(),
      ffzService.getSanitisedGlobalBadges(),
      ffzService.getSanitisedChannelBadges(channelId),
      chatterinoService.listSanitisedBadges(),
    ]);

    const parallelFetchDuration = performance.now() - parallelFetchStart;
    logger.performance.debug(
      `⏳ Parallel API fetch (13 services) -- time: ${parallelFetchDuration.toFixed(2)} ms`,
    );

    const getValue = <T>(result: PromiseSettledResult<T[]>): T[] =>
      result.status === 'fulfilled' ? result.value : [];

    const allEmotes = [
      ...getValue(sevenTvChannelEmotes),
      ...getValue(sevenTvGlobalEmotes),
      ...getValue(twitchChannelEmotes),
      ...getValue(twitchGlobalEmotes),
      ...getValue(bttvGlobalEmotes),
      ...getValue(bttvChannelEmotes),
      ...getValue(ffzChannelEmotes),
      ...getValue(ffzGlobalEmotes),
    ] satisfies SanitisiedEmoteSet[];

    const allBadges = [
      ...getValue(twitchChannelBadges),
      ...getValue(twitchGlobalBadges),
      ...getValue(ffzGlobalBadges),
      ...getValue(ffzChannelBadges),
      ...getValue(chatterinoBadges),
    ] satisfies SanitisedBadgeSet[];

    const channelData: ChannelCacheType = {
      emotes: allEmotes,
      badges: allBadges,
      lastUpdated: Date.now(),
      twitchChannelEmotes: getValue(twitchChannelEmotes),
      twitchGlobalEmotes: getValue(twitchGlobalEmotes),
      sevenTvChannelEmotes: getValue(sevenTvChannelEmotes),
      sevenTvGlobalEmotes: getValue(sevenTvGlobalEmotes),
      bttvGlobalEmotes: getValue(bttvGlobalEmotes),
      bttvChannelEmotes: getValue(bttvChannelEmotes),
      ffzChannelEmotes: getValue(ffzChannelEmotes),
      ffzGlobalEmotes: getValue(ffzGlobalEmotes),
      twitchChannelBadges: getValue(twitchChannelBadges),
      twitchGlobalBadges: getValue(twitchGlobalBadges),
      ffzGlobalBadges: getValue(ffzGlobalBadges),
      ffzChannelBadges: getValue(ffzChannelBadges),
      chatterinoBadges: getValue(chatterinoBadges),
      sevenTvEmoteSetId: sevenTvSetId !== 'global' ? sevenTvSetId : undefined,
    };

    batch(() => {
      const currentCaches = chatStore$.persisted.channelCaches.peek() ?? {};
      const updatedCaches = limitChannelCaches(
        { ...currentCaches, [channelId]: channelData },
        channelId,
      );
      chatStore$.persisted.channelCaches.set(updatedCaches);
      chatStore$.loadingState.set('COMPLETED');
    });

    const totalDuration = performance.now() - startTime;
    logger.performance.debug(
      `⏳ Load channel resources (fresh data) ${channelId} -- time: ${totalDuration.toFixed(2)} ms`,
    );
    logger.chat.info(
      `Loaded ${allEmotes.length} emotes and ${allBadges.length} badges`,
    );

    // Cache emote images in the background (non-blocking)
    cacheEmoteImages(allEmotes).catch(error => {
      logger.chat.warn('Background emote image caching failed:', error);
    });

    return true;
  } catch (error) {
    logger.chat.error('Error loading channel resources:', error);
    chatStore$.loadingState.set('ERROR');
    return false;
  }
};

export const getCacheAge = (channelId: string): number | null => {
  const caches = chatStore$.persisted.channelCaches.peek();
  const cache = caches?.[channelId];
  if (!cache) return null;
  return Date.now() - cache.lastUpdated;
};

export const isCacheExpired = (
  channelId: string,
  maxAge = CACHE_DURATION,
): boolean => {
  const cacheAge = getCacheAge(channelId);
  if (cacheAge === null) return true;
  return cacheAge > maxAge;
};

export const expireCache = (channelId?: string) => {
  if (channelId) {
    const caches = chatStore$.persisted.channelCaches.peek();
    if (caches?.[channelId]) {
      const channelCache = chatStore$.persisted.channelCaches[channelId];
      if (channelCache) {
        channelCache.lastUpdated.set(0);
      }
    }
  } else {
    const caches = chatStore$.persisted.channelCaches.peek() ?? {};
    Object.keys(caches).forEach(id => {
      const cache = chatStore$.persisted.channelCaches[id];
      if (cache) {
        cache.lastUpdated.set(0);
      }
    });
    chatStore$.persisted.lastGlobalUpdate.set(0);
  }
};

export const clearCache = (channelId?: string) => {
  if (channelId) {
    batch(() => {
      const currentCaches = chatStore$.persisted.channelCaches.peek() ?? {};
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    chatStore$.emojis.set([]);
    chatStore$.bits.set([]);
    chatStore$.ttvUsers.set([]);
    chatStore$.messages.set([]);
  });
  clearEmoteImageCache();
  logger.chat.info('All chat cache cleared successfully');
};

/**
 * Cache an emote image URL to disk asynchronously
 * Returns the cached file URI if successful, or the original URL on failure
 * Uses deduping to prevent multiple simultaneous downloads of the same URL
 */
export const cacheEmoteImage = async (emoteUrl: string): Promise<string> => {
  // already cached
  if (
    !emoteUrl ||
    emoteUrl.startsWith('data:') ||
    emoteUrl.startsWith('file://')
  ) {
    return emoteUrl;
  }

  const existingFileUri = getCachedImageUri(emoteUrl);
  if (existingFileUri) {
    return existingFileUri;
  }

  const inProgress = emoteImageCachePromises.get(emoteUrl);
  if (inProgress) {
    return inProgress;
  }

  const cachePromise = (async () => {
    try {
      const fileUri = await cacheImageFromUrl(emoteUrl);
      emoteImageCachePromises.delete(emoteUrl);
      return fileUri;
    } catch (error) {
      emoteImageCachePromises.delete(emoteUrl);
      logger.chat.warn(
        `Failed to cache emote image ${emoteUrl.substring(0, 50)}...:`,
        error,
      );
      return emoteUrl; // Fallback to original URL
    }
  })();

  emoteImageCachePromises.set(emoteUrl, cachePromise);
  return cachePromise;
};

/**
 * Get the cached file URI for an emote URL synchronously
 * Returns the cached URI if available, otherwise the original URL
 */
export const getCachedEmoteUri = (emoteUrl: string): string => {
  if (
    !emoteUrl ||
    emoteUrl.startsWith('data:') ||
    emoteUrl.startsWith('file://')
  ) {
    return emoteUrl;
  }

  const cachedUri = getCachedImageUri(emoteUrl);
  return cachedUri ?? emoteUrl;
};

/**
 * Cache multiple emote images
 * This is called after loading channel resources to pre-cache all emote images
 */
export const cacheEmoteImages = async (
  emotes: SanitisiedEmoteSet[],
): Promise<void> => {
  if (emotes.length === 0) return;

  const startTime = performance.now();
  const urls = emotes.map(e => e.url).filter(Boolean);

  // Filter out already cached URLs
  const urlsToCache = urls.filter(url => {
    if (url.startsWith('data:') || url.startsWith('file://')) {
      return false;
    }
    if (getCachedImageUri(url)) {
      return false;
    }
    return true;
  });

  if (urlsToCache.length === 0) {
    logger.chat.debug('All emote images already cached');
    return;
  }

  logger.chat.info(
    `Starting background cache of ${urlsToCache.length} emote images...`,
  );

  await Promise.allSettled(urlsToCache.map(url => cacheEmoteImage(url)));

  const duration = performance.now() - startTime;
  logger.performance.debug(
    `⏳ Cached ${urlsToCache.length} emote images -- time: ${duration.toFixed(2)} ms`,
  );
};

export const clearEmoteImageCache = (): void => {
  emoteImageCachePromises.clear();
  clearSessionCache();
  logger.chat.info('Emote image cache cleared');
};

export const refreshChannelResources = async (
  channelId: string,
  forceRefresh = false,
): Promise<boolean> => {
  if (forceRefresh) {
    clearCache(channelId);
  }
  return loadChannelResources(channelId, forceRefresh);
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

  const preferences = usePreferences.getState();

  return {
    twitchChannelEmotes: preferences.showTwitchEmotes
      ? (cache.twitchChannelEmotes ?? [])
      : [],
    twitchGlobalEmotes: preferences.showTwitchEmotes
      ? (cache.twitchGlobalEmotes ?? [])
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
  added: SanitisiedEmoteSet[],
  removed: SanitisiedEmoteSet[],
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
    (emote: SanitisiedEmoteSet) =>
      !removed.some((r: SanitisiedEmoteSet) => r.id === emote.id),
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

export const getCachedEmotes = (channelId: string): SanitisiedEmoteSet[] => {
  const caches = chatStore$.persisted.channelCaches.peek();
  const cache = caches?.[channelId];
  return cache?.emotes ?? [];
};

export const getCachedBadges = (channelId: string): SanitisedBadgeSet[] => {
  const caches = chatStore$.persisted.channelCaches.peek();
  const cache = caches?.[channelId];
  return cache?.badges ?? [];
};

export const useLoadingState = () => useSelector(chatStore$.loadingState);

export const useCurrentChannelId = () =>
  useSelector(chatStore$.currentChannelId);

export const useMessages = () => useSelector(chatStore$.messages);

export const useTtvUsers = () => useSelector(chatStore$.ttvUsers);

export const useBits = () => useSelector(chatStore$.bits);

export const useEmojis = () => useSelector(chatStore$.emojis);

export const useCurrentEmoteData = () => {
  // Subscribe to observables and preferences to ensure we get updates for any change
  const channelId = useSelector(chatStore$.currentChannelId);
  const caches = useSelector(chatStore$.persisted.channelCaches);
  const preferences = usePreferences();

  if (!channelId) {
    return emptyEmoteData;
  }

  const cache = caches?.[channelId];
  if (!cache) {
    return emptyEmoteData;
  }

  return {
    twitchChannelEmotes: preferences.showTwitchEmotes
      ? (cache.twitchChannelEmotes ?? [])
      : [],
    twitchGlobalEmotes: preferences.showTwitchEmotes
      ? (cache.twitchGlobalEmotes ?? [])
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

export const useChannelEmoteData = (channelId: string | null) => {
  const caches = useSelector(chatStore$.persisted.channelCaches);
  const preferences = usePreferences();

  if (!channelId) {
    return emptyEmoteData;
  }

  const cache = caches?.[channelId];
  if (!cache) {
    return emptyEmoteData;
  }

  return {
    twitchChannelEmotes: preferences.showTwitchEmotes
      ? (cache.twitchChannelEmotes ?? [])
      : [],
    twitchGlobalEmotes: preferences.showTwitchEmotes
      ? (cache.twitchGlobalEmotes ?? [])
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
