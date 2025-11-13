import { PersistedStateStatus, usePersistedState } from '@app/hooks';
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
import { ParsedPart } from '@app/utils';
import { logger } from '@app/utils/logger';

import { fetch } from 'expo/fetch';
import { Directory, File, Paths } from 'expo-file-system/next';
import debounce from 'lodash/debounce';
import {
  createContext,
  ReactNode,
  use,
  useCallback,
  useMemo,
  useState,
  useEffect,
} from 'react';
import { Platform, ViewStyle } from 'react-native';
import { MMKV } from 'react-native-mmkv';

const chatStorage = new MMKV({
  id: 'chat-cache',
});

export const MEDIA_LIBRARY_PHOTOS_LIMIT = Infinity;

// Message chunking constants for better performance
const MAX_MESSAGES_PER_CHANNEL = 1000;

const MAX_CACHED_CHANNELS = 10;

export const LOAD_BATCH_SIZE = Platform.select({
  /**
   * iOS can provide results much faster than Android.
   */
  ios: Math.min(50, MEDIA_LIBRARY_PHOTOS_LIMIT),
  default: Math.min(30, MEDIA_LIBRARY_PHOTOS_LIMIT),
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
  // 7tv paints
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
  parentDisplayName: string;
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

interface CachedImage {
  url: string;
  localPath: string;
  lastUpdated: number;
  sizeBytes: number;
  isMemoryCache: boolean;
  diskCacheStatus: 'pending' | 'cached' | 'failed';
}

interface ChannelCache {
  emotes: Map<string, CachedImage>;
  badges: Map<string, CachedImage>;
  lastUpdated: number;
}

interface InMemoryCache {
  emotes: Map<string, string>;
  badges: Map<string, string>;
}

// Add cache queue interfaces
interface CacheQueueItem {
  url: string;
  channelId: string;
  type: 'emote' | 'badge';
  priority: number;
}

interface CacheStats {
  totalFiles: number;
  totalSizeBytes: number;
  queueSize: number;
  isProcessing: boolean;
}

// Persisted state - only essential cache data (not transient data like messages)
interface PersistedChatState {
  channelCaches: Record<
    string,
    {
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
  >;
  currentChannelId: string | null;
  lastGlobalUpdate: number;
  loadingState: ChatLoadingState;
  cacheStats: CacheStats;
}

// Combined state interface - persisted + in-memory
interface ChatState extends PersistedChatState {
  // Transient data - not persisted (too large for MMKV)
  emojis: SanitisiedEmoteSet[];
  bits: Bit[];
  ttvUsers: ChatUser[];
  messages: ChatMessageType<never>[];
}

export interface ChatContextState {
  stateRestorationStatus: PersistedStateStatus;
  loadingState: ChatLoadingState;

  // Current channel data
  currentChannelId: string | null;
  twitchChannelEmotes: SanitisiedEmoteSet[];
  twitchGlobalEmotes: SanitisiedEmoteSet[];
  sevenTvChannelEmotes: SanitisiedEmoteSet[];
  sevenTvGlobalEmotes: SanitisiedEmoteSet[];
  ffzChannelEmotes: SanitisiedEmoteSet[];
  ffzGlobalEmotes: SanitisiedEmoteSet[];
  bttvGlobalEmotes: SanitisiedEmoteSet[];
  bttvChannelEmotes: SanitisiedEmoteSet[];
  twitchGlobalBadges: SanitisedBadgeSet[];
  twitchChannelBadges: SanitisedBadgeSet[];
  ffzGlobalBadges: SanitisedBadgeSet[];
  ffzChannelBadges: SanitisedBadgeSet[];
  chatterinoBadges: SanitisedBadgeSet[];

  imageCache: Map<string, ChannelCache>;
  inMemoryCache: Map<string, InMemoryCache>;
  cacheStats: CacheStats;
  cacheQueue: CacheQueueItem[];
  emojis: SanitisiedEmoteSet[];
  bits: Bit[];
  ttvUsers: ChatUser[];
  messages: ChatMessageType<never>[];

  cacheImage: (
    url: string,
    channelId: string,
    type: 'emote' | 'badge',
    priority?: number,
  ) => void;
  batchCacheImages: (
    items: Array<{ url: string; channelId: string; type: 'emote' | 'badge' }>,
  ) => Promise<void>;
  processCacheQueue: () => Promise<void>;
  processSingleCacheItem: (item: CacheQueueItem) => Promise<void>;

  addToMemoryCache: (
    url: string,
    channelId: string,
    type: 'emote' | 'badge',
  ) => void;

  getCachedImageUrl: (
    url: string,
    channelId: string,
    type: 'emote' | 'badge',
  ) => string;

  // Cache management
  expireCache: (channelId?: string) => void;
  clearCache: (channelId?: string) => void;
  clearAllCache: () => void;
  refreshChannelResources: (
    channelId: string,
    forceRefresh?: boolean,
  ) => Promise<boolean>;
  getCacheAge: (channelId: string) => number | null;
  isCacheExpired: (channelId: string, maxAge?: number) => boolean;

  // State management
  setBits: (bits: Bit[]) => void;
  addTtvUser: (user: ChatUser) => void;
  loadChannelResources: (
    channelId: string,
    forceRefresh?: boolean,
  ) => Promise<boolean>;
  clearChannelResources: () => void;
  addMessage: <TNoticeType extends NoticeVariants>(
    message: ChatMessageType<TNoticeType>,
  ) => void;
  addMessages: (messages: ChatMessageType<never>[]) => void;
  clearMessages: () => void;
  clearTtvUsers: () => void;
  getCachedEmotes: (channelId: string) => SanitisiedEmoteSet[];
  getCachedBadges: (channelId: string) => SanitisedBadgeSet[];

  getCurrentEmoteData: (channelId?: string) => {
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
    ffzChannelBadges: SanitisedBadgeSet[];
    ffzGlobalBadges: SanitisedBadgeSet[];
    chatterinoBadges: SanitisedBadgeSet[];
  };

  getSevenTvEmoteSetId: (channelId?: string) => string | null;

  updateSevenTvEmotes: (
    channelId: string,
    added: SanitisiedEmoteSet[],
    removed: SanitisiedEmoteSet[],
  ) => void;
}

export const ChatContext = createContext<ChatContextState | undefined>(
  undefined,
);

export type ChatContextProviderProps = {
  children: ReactNode;
};

const initialPersistedState: PersistedChatState = {
  channelCaches: {},
  currentChannelId: null,
  lastGlobalUpdate: 0,
  loadingState: 'IDLE',
  cacheStats: {
    totalFiles: 0,
    totalSizeBytes: 0,
    queueSize: 0,
    isProcessing: false,
  },
};

const initialState: ChatState = {
  ...initialPersistedState,
  emojis: [],
  bits: [],
  ttvUsers: [],
  messages: [],
};

export const ChatContextProvider = ({ children }: ChatContextProviderProps) => {
  // Only persist essential cache data, not transient messages/users
  const [persistedState, setPersistedState, stateRestorationStatus] =
    usePersistedState<PersistedChatState>(
      'chat-context',
      initialPersistedState,
    );

  // Transient data in separate in-memory state (not persisted)
  const [transientState, setTransientState] = useState<{
    emojis: SanitisiedEmoteSet[];
    bits: Bit[];
    ttvUsers: ChatUser[];
    messages: ChatMessageType<never>[];
  }>({
    emojis: [],
    bits: [],
    ttvUsers: [],
    messages: [],
  });

  // Combined state for easier access
  const state: ChatState = useMemo(
    () => ({
      ...persistedState,
      ...transientState,
    }),
    [persistedState, transientState],
  );

  // Helper function to limit channelCaches size to prevent MMKV size limit issues
  const limitChannelCaches = useCallback(
    (
      channelCaches: PersistedChatState['channelCaches'],
      currentChannelId: string | null,
    ): PersistedChatState['channelCaches'] => {
      const entries = Object.entries(channelCaches);

      // If we're under the limit, no need to prune
      if (entries.length <= MAX_CACHED_CHANNELS) {
        return channelCaches;
      }

      // Sort by lastUpdated (most recent first), keeping current channel at top
      const sorted = entries.sort((a, b) => {
        // Always keep current channel first
        if (a[0] === currentChannelId) return -1;
        if (b[0] === currentChannelId) return 1;
        // Then sort by lastUpdated (most recent first)
        return (b[1].lastUpdated || 0) - (a[1].lastUpdated || 0);
      });

      // Keep only the most recent channels (including current)
      const limited = sorted.slice(0, MAX_CACHED_CHANNELS);

      logger.main.info(
        `Pruned channelCaches from ${entries.length} to ${limited.length} channels`,
      );

      return Object.fromEntries(limited);
    },
    [],
  );

  // Helper to update state (splits persisted and transient updates)
  const setState = useCallback(
    (update: ChatState | ((prev: ChatState) => ChatState)) => {
      // Get current combined state
      const currentState: ChatState = {
        ...persistedState,
        ...transientState,
      };

      // Compute new state
      const newState =
        typeof update === 'function' ? update(currentState) : update;

      // Split into persisted and transient
      const { emojis, bits, ttvUsers, messages, ...persisted } = newState;

      // Limit channelCaches size before persisting to prevent MMKV size limit issues
      const limitedPersisted: PersistedChatState = {
        ...persisted,
        channelCaches: limitChannelCaches(
          persisted.channelCaches,
          persisted.currentChannelId,
        ),
      } as PersistedChatState;

      // Update both states
      setPersistedState(limitedPersisted);
      setTransientState({ emojis, bits, ttvUsers, messages });
    },
    [persistedState, transientState, setPersistedState, limitChannelCaches],
  );

  // Keep performance-critical data in local state (not persisted)
  const [imageCache, setImageCache] = useState<Map<string, ChannelCache>>(
    new Map(),
  );
  const [inMemoryCache, setInMemoryCache] = useState<
    Map<string, InMemoryCache>
  >(new Map());
  const [cacheQueue, setCacheQueue] = useState<CacheQueueItem[]>([]);

  // Prune channelCaches on restoration if it's too large (only run once when restoration completes)
  useEffect(() => {
    if (stateRestorationStatus === 'IN_MEMORY') {
      const channelCount = Object.keys(persistedState.channelCaches).length;
      if (channelCount > MAX_CACHED_CHANNELS) {
        logger.main.info(
          `Restored state has ${channelCount} channels, pruning to ${MAX_CACHED_CHANNELS}`,
        );
        setPersistedState(prevState => ({
          ...prevState,
          channelCaches: limitChannelCaches(
            prevState.channelCaches,
            prevState.currentChannelId,
          ),
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateRestorationStatus]); // Only run when restoration status changes

  // Add cleanup for memory leaks
  useEffect(() => {
    return () => {
      // Clear all maps and arrays on unmount
      setImageCache(new Map());
      setInMemoryCache(new Map());
      setCacheQueue([]);
    };
  }, []);

  const currentChannelData = state.currentChannelId
    ? state.channelCaches[state.currentChannelId]
    : null;

  const addToMemoryCache = useCallback(
    (url: string, channelId: string, type: 'emote' | 'badge') => {
      setInMemoryCache(prevCache => {
        const newCache = new Map(prevCache);
        const channelMemoryCache = newCache.get(channelId) || {
          emotes: new Map(),
          badges: new Map(),
        };

        const targetMap =
          type === 'emote'
            ? channelMemoryCache.emotes
            : channelMemoryCache.badges;

        if (!targetMap.has(url)) {
          targetMap.set(url, url);
        }

        newCache.set(channelId, channelMemoryCache);
        return newCache;
      });
    },
    [],
  );

  const getCachedImageUrl = useCallback(
    (url: string, channelId: string, type: 'emote' | 'badge') => {
      const channelCache = imageCache.get(channelId);

      if (channelCache) {
        const targetMap =
          type === 'emote' ? channelCache.emotes : channelCache.badges;

        const cached = targetMap.get(url);

        if (cached && cached.diskCacheStatus === 'cached') {
          return cached.localPath;
        }
      }

      const memoryCache = inMemoryCache.get(channelId);

      if (memoryCache) {
        const targetMap =
          type === 'emote' ? memoryCache.emotes : memoryCache.badges;

        const memoryCached = targetMap.get(url);

        if (memoryCached) {
          return memoryCached;
        }
      }

      return url;
    },
    [imageCache, inMemoryCache],
  );

  const processSingleCacheItem = useCallback(
    async (item: CacheQueueItem) => {
      const startTime = performance.now();
      const { url, channelId, type } = item;

      try {
        const cacheDir = new Directory(
          Paths.cache,
          `chat_cache/${channelId}/${type}s`,
        );

        const urlParts = url.split('/');
        const filename = urlParts[urlParts.length - 1] || 'unknown';
        const file = new File(cacheDir, filename);

        if (file.exists && file.md5) {
          const existingSize = file.size || 0;

          setImageCache(prevCache => {
            const newCache = new Map(prevCache);
            const channelCache = newCache.get(channelId) || {
              emotes: new Map(),
              badges: new Map(),
              lastUpdated: Date.now(),
            };

            const targetMap =
              type === 'emote' ? channelCache.emotes : channelCache.badges;

            targetMap.set(url, {
              url,
              localPath: file.uri,
              lastUpdated: Date.now(),
              sizeBytes: existingSize,
              isMemoryCache: false,
              diskCacheStatus: 'cached',
            });

            newCache.set(channelId, channelCache);
            return newCache;
          });

          const duration = performance.now() - startTime;
          logger.performance.debug(
            `⏳ Cache item (existing ${type}) ${filename} -- time: ${duration.toFixed(2)} ms`,
          );
          return;
        }

        setImageCache(prevCache => {
          const newCache = new Map(prevCache);
          const channelCache = newCache.get(channelId) || {
            emotes: new Map(),
            badges: new Map(),
            lastUpdated: Date.now(),
          };

          const targetMap =
            type === 'emote' ? channelCache.emotes : channelCache.badges;

          targetMap.set(url, {
            url,
            localPath: url,
            lastUpdated: Date.now(),
            sizeBytes: 0,
            isMemoryCache: true,
            diskCacheStatus: 'pending',
          });

          newCache.set(channelId, channelCache);
          return newCache;
        });

        try {
          if (!cacheDir.exists) {
            cacheDir.create();
          }
        } catch (error) {
          logger.chat.warn('Failed to create directory with new API:', error);
          throw error;
        }

        const existingSize = file.exists ? file.size || 0 : 0;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const downloadStartTime = performance.now();
        try {
          const response = await fetch(url, {
            signal: controller.signal,
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const bytes = await response.bytes();
          file.write(bytes, {
            encoding: 'base64',
          });

          clearTimeout(timeoutId);

          const downloadDuration = performance.now() - downloadStartTime;

          logger.performance.debug(
            `⏳ Download ${type} ${filename} (${bytes.length} bytes) -- time: ${downloadDuration.toFixed(2)} ms`,
          );
        } catch (fetchError) {
          clearTimeout(timeoutId);
          const downloadDuration = performance.now() - downloadStartTime;
          logger.performance.debug(
            `⏳ Download ${type} ${filename} (failed) -- time: ${downloadDuration.toFixed(2)} ms`,
          );

          setImageCache(prevCache => {
            const newCache = new Map(prevCache);
            const channelCache = newCache.get(channelId) || {
              emotes: new Map(),
              badges: new Map(),
              lastUpdated: Date.now(),
            };

            const targetMap =
              type === 'emote' ? channelCache.emotes : channelCache.badges;

            targetMap.set(url, {
              url,
              localPath: url,
              lastUpdated: Date.now(),
              sizeBytes: 0,
              isMemoryCache: true,
              diskCacheStatus: 'failed',
            });

            newCache.set(channelId, channelCache);
            return newCache;
          });

          throw fetchError;
        }

        const newFileSize = file.size || 0;
        const sizeDifference = newFileSize - existingSize;
        const fileCountChange = existingSize === 0 ? 1 : 0;

        setImageCache(prevCache => {
          const newCache = new Map(prevCache);
          const channelCache = newCache.get(channelId) || {
            emotes: new Map(),
            badges: new Map(),
            lastUpdated: Date.now(),
          };

          const targetMap =
            type === 'emote' ? channelCache.emotes : channelCache.badges;

          targetMap.set(url, {
            url,
            localPath: file.uri,
            lastUpdated: Date.now(),
            sizeBytes: newFileSize,
            isMemoryCache: false,
            diskCacheStatus: 'cached',
          });

          newCache.set(channelId, channelCache);
          return newCache;
        });

        setState(prevState => ({
          ...prevState,
          cacheStats: {
            ...prevState.cacheStats,
            totalFiles: prevState.cacheStats.totalFiles + fileCountChange,
            totalSizeBytes:
              prevState.cacheStats.totalSizeBytes + sizeDifference,
          },
        }));

        const totalDuration = performance.now() - startTime;
        logger.performance.debug(
          `⏳ Cache ${type} ${filename} (${newFileSize} bytes) -- time: ${totalDuration.toFixed(2)} ms`,
        );
        logger.chat.debug(`Successfully cached ${type}: ${url}`);
      } catch (error) {
        const duration = performance.now() - startTime;
        logger.performance.debug(
          `⏳ Cache ${type} ${item.url.split('/').pop()} (failed) -- time: ${duration.toFixed(2)} ms`,
        );
        addToMemoryCache(url, channelId, type);
        throw error;
      }
    },
    [addToMemoryCache, setState],
  );

  const processCacheQueue = useCallback(async () => {
    if (state.cacheStats.isProcessing || cacheQueue.length === 0) {
      return;
    }

    const startTime = performance.now();
    const initialQueueSize = cacheQueue.length;

    setState(prevState => ({
      ...prevState,
      cacheStats: { ...prevState.cacheStats, isProcessing: true },
    }));

    try {
      const CONCURRENT_DOWNLOADS = 6;
      const BATCH_SIZE = LOAD_BATCH_SIZE;
      let processedItems = 0;

      while (cacheQueue.length > 0) {
        const batchStartTime = performance.now();
        const sortedQueue = [...cacheQueue].sort(
          (a, b) => b.priority - a.priority,
        );
        const batch = sortedQueue.slice(0, BATCH_SIZE);

        setCacheQueue(prevQueue =>
          prevQueue.filter(
            item =>
              !batch.some(
                batchItem =>
                  batchItem.url === item.url &&
                  batchItem.channelId === item.channelId &&
                  batchItem.type === item.type,
              ),
          ),
        );

        setState(prevState => ({
          ...prevState,
          cacheStats: {
            ...prevState.cacheStats,
            queueSize: prevState.cacheStats.queueSize - batch.length,
          },
        }));

        // eslint-disable-next-line no-loop-func
        const processItem = async (item: CacheQueueItem) => {
          try {
            await processSingleCacheItem(item);
            processedItems += 1;
          } catch (error) {
            logger.chat.warn(
              `Failed to cache ${item.type} ${item.url}:`,
              error,
            );
          }
        };

        for (let i = 0; i < batch.length; i += CONCURRENT_DOWNLOADS) {
          const chunk = batch.slice(i, i + CONCURRENT_DOWNLOADS);
          const chunkStartTime = performance.now();

          // eslint-disable-next-line no-await-in-loop
          await Promise.allSettled(chunk.map(processItem));

          const chunkDuration = performance.now() - chunkStartTime;
          logger.performance.debug(
            `⏳ Cache chunk (${chunk.length} items) -- time: ${chunkDuration.toFixed(2)} ms`,
          );

          // eslint-disable-next-line no-await-in-loop
          await new Promise(resolve => {
            setTimeout(resolve, 10);
          });
        }

        const batchDuration = performance.now() - batchStartTime;
        logger.performance.debug(
          `⏳ Cache batch (${batch.length} items) -- time: ${batchDuration.toFixed(2)} ms`,
        );

        const remaining = cacheQueue.length;
        if (remaining > 0) {
          logger.chat.debug(
            `Cache queue progress: ${remaining} items remaining`,
          );
        }
      }

      const totalDuration = performance.now() - startTime;
      logger.performance.debug(
        `⏳ Cache queue processing (${processedItems}/${initialQueueSize} items) -- time: ${totalDuration.toFixed(2)} ms`,
      );
      logger.chat.info('Cache queue processing completed');
    } catch (error) {
      const duration = performance.now() - startTime;
      logger.performance.debug(
        `⏳ Cache queue processing (failed) -- time: ${duration.toFixed(2)} ms`,
      );
      logger.chat.error('Error in cache queue processing:', error);
    } finally {
      setState(prevState => ({
        ...prevState,
        cacheStats: {
          ...prevState.cacheStats,
          isProcessing: false,
          queueSize: 0,
        },
      }));
    }
  }, [
    state.cacheStats.isProcessing,
    cacheQueue,
    processSingleCacheItem,
    setState,
  ]);

  const cacheImage = useCallback(
    (url: string, channelId: string, type: 'emote' | 'badge', priority = 1) => {
      const existingCache = imageCache.get(channelId);
      if (existingCache) {
        const targetMap =
          type === 'emote' ? existingCache.emotes : existingCache.badges;
        const cached = targetMap.get(url);
        if (
          cached &&
          (cached.diskCacheStatus === 'cached' ||
            cached.diskCacheStatus === 'pending')
        ) {
          return; // Skip if already cached or in progress
        }
      }

      addToMemoryCache(url, channelId, type);

      setCacheQueue(prevQueue => {
        const existingIndex = prevQueue.findIndex(
          item =>
            item.url === url &&
            item.channelId === channelId &&
            item.type === type,
        );

        if (existingIndex >= 0 && prevQueue[existingIndex]) {
          const updatedQueue = [...prevQueue];
          const existingItem = updatedQueue[existingIndex];

          if (existingItem) {
            const currentPriority = existingItem.priority;
            updatedQueue[existingIndex] = {
              ...existingItem,
              url: existingItem.url ?? url,
              channelId: existingItem.channelId ?? channelId,
              type: existingItem.type ?? type,
              priority: Math.max(currentPriority, priority),
            };
          }
          return updatedQueue;
        }

        return [...prevQueue, { url, channelId, type, priority }];
      });

      setState(prevState => ({
        ...prevState,
        cacheStats: {
          ...prevState.cacheStats,
          queueSize: prevState.cacheStats.queueSize + 1,
        },
      }));

      if (!state.cacheStats.isProcessing) {
        processCacheQueue().catch(error => {
          logger.chat.error('Error processing cache queue:', error);
        });
      }
    },
    [
      addToMemoryCache,
      imageCache,
      state.cacheStats.isProcessing,
      processCacheQueue,
      setState,
    ],
  );

  const batchCacheImages = useCallback(
    async (
      items: Array<{ url: string; channelId: string; type: 'emote' | 'badge' }>,
    ) => {
      items.forEach(item => {
        addToMemoryCache(item.url, item.channelId, item.type);
      });

      setCacheQueue(prevQueue => {
        const newItems = items
          .filter(
            item =>
              !prevQueue.some(
                queueItem =>
                  queueItem.url === item.url &&
                  queueItem.channelId === item.channelId &&
                  queueItem.type === item.type,
              ),
          )
          .map(item => ({ ...item, priority: 2 }));

        return [...prevQueue, ...newItems];
      });

      setState(prevState => ({
        ...prevState,
        cacheStats: {
          ...prevState.cacheStats,
          queueSize: prevState.cacheStats.queueSize + items.length,
        },
      }));

      if (!state.cacheStats.isProcessing) {
        return processCacheQueue();
      }
    },
    [
      addToMemoryCache,
      state.cacheStats.isProcessing,
      processCacheQueue,
      setState,
    ],
  );

  // Create debounced versions of cache operations for better performance
  const debouncedCacheImage = useMemo(
    () => debounce(cacheImage, 100),
    [cacheImage],
  );

  const debouncedBatchCacheImages = useMemo(
    () => debounce(batchCacheImages, 200),
    [batchCacheImages],
  );

  // Create a wrapper that ensures the debounced function always returns a Promise
  const debouncedBatchCacheImagesWrapper = useCallback(
    async (
      items: Array<{ url: string; channelId: string; type: 'emote' | 'badge' }>,
    ) => {
      return new Promise<void>(resolve => {
        void debouncedBatchCacheImages(items);
        resolve();
      });
    },
    [debouncedBatchCacheImages],
  );

  const expireCache = useCallback(
    (channelId?: string) => {
      if (channelId) {
        setState(prevState => ({
          ...prevState,
          channelCaches: {
            ...prevState.channelCaches,
            [channelId]: prevState.channelCaches[channelId]
              ? {
                  ...prevState.channelCaches[channelId],
                  lastUpdated: 0,
                }
              : {
                  emotes: [],
                  badges: [],
                  lastUpdated: 0,
                  twitchChannelEmotes: [],
                  twitchGlobalEmotes: [],
                  sevenTvChannelEmotes: [],
                  sevenTvGlobalEmotes: [],
                  ffzChannelEmotes: [],
                  ffzGlobalEmotes: [],
                  bttvGlobalEmotes: [],
                  bttvChannelEmotes: [],
                  twitchChannelBadges: [],
                  twitchGlobalBadges: [],
                  ffzGlobalBadges: [],
                  ffzChannelBadges: [],
                  chatterinoBadges: [],
                },
          },
        }));
      } else {
        setState(prevState => ({
          ...prevState,
          channelCaches: Object.fromEntries(
            Object.entries(prevState.channelCaches).map(([key, cache]) => [
              key,
              { ...cache, lastUpdated: 0 },
            ]),
          ),
          lastGlobalUpdate: 0,
        }));
      }
    },
    [setState],
  );

  const clearCache = useCallback(
    (channelId?: string) => {
      try {
        if (channelId) {
          const channelCache = imageCache.get(channelId);
          let filesToRemove = 0;
          let sizeToRemove = 0;

          if (channelCache) {
            channelCache.emotes.forEach(cached => {
              filesToRemove += 1;
              sizeToRemove += cached.sizeBytes;
            });
            channelCache.badges.forEach(cached => {
              filesToRemove += 1;
              sizeToRemove += cached.sizeBytes;
            });
          }

          const channelCacheDir = new Directory(
            Paths.cache,
            `chat_cache/${channelId}`,
          );

          if (channelCacheDir.exists) {
            channelCacheDir.delete();
            logger.chat.info(`Cleared disk cache for channel ${channelId}`);
          }

          // Clear from persisted state
          setState(prevState => ({
            ...prevState,
            channelCaches: Object.fromEntries(
              Object.entries(prevState.channelCaches).filter(
                ([key]) => key !== channelId,
              ),
            ),
            currentChannelId:
              prevState.currentChannelId === channelId
                ? null
                : prevState.currentChannelId,
            cacheStats: {
              totalFiles: Math.max(
                0,
                prevState.cacheStats.totalFiles - filesToRemove,
              ),
              totalSizeBytes: Math.max(
                0,
                prevState.cacheStats.totalSizeBytes - sizeToRemove,
              ),
              queueSize: 0,
              isProcessing: false,
            },
          }));

          // Clear from local state
          setImageCache(prevCache => {
            const newCache = new Map(prevCache);
            newCache.delete(channelId);
            return newCache;
          });

          setInMemoryCache(prevCache => {
            const newCache = new Map(prevCache);
            newCache.delete(channelId);
            return newCache;
          });
        } else {
          const rootCacheDir = new Directory(Paths.cache, 'chat_cache');

          if (rootCacheDir.exists) {
            rootCacheDir.delete();
            logger.chat.info('Cleared all disk cache');
          }

          // Clear MMKV storage
          chatStorage.clearAll();

          // Reset persisted state
          setState(initialState);

          // Reset local state
          setImageCache(new Map());
          setInMemoryCache(new Map());
          setCacheQueue([]);
        }
      } catch (error) {
        logger.chat.error('Error clearing cache:', error);
      }
    },
    [imageCache, setState],
  );

  const clearAllCache = useCallback(() => {
    try {
      logger.chat.info('Clearing all chat cache...');

      const rootCacheDir = new Directory(Paths.cache, 'chat_cache');
      if (rootCacheDir.exists) {
        rootCacheDir.delete();
        logger.chat.info('Cleared all disk cache');
      }

      chatStorage.clearAll();
      setState(initialState);
      setImageCache(new Map());
      setInMemoryCache(new Map());
      setCacheQueue([]);

      logger.chat.info('All chat cache cleared successfully');
    } catch (error) {
      logger.chat.error('Error clearing all cache:', error);
    }
  }, [setState]);

  const getCacheAge = useCallback(
    (channelId: string) => {
      const channelCache = state.channelCaches[channelId];
      if (!channelCache) {
        return null;
      }
      return Date.now() - channelCache.lastUpdated;
    },
    [state.channelCaches],
  );

  const isCacheExpired = useCallback(
    (channelId: string, maxAge = 24 * 60 * 60 * 1000) => {
      const cacheAge = getCacheAge(channelId);
      if (cacheAge === null) {
        return true;
      }
      return cacheAge > maxAge;
    },
    [getCacheAge],
  );

  const getCurrentEmoteData = useCallback(
    (channelId?: string) => {
      const targetChannelId = channelId || state.currentChannelId;
      const currentData = targetChannelId
        ? state.channelCaches[targetChannelId]
        : null;

      const result = {
        twitchChannelEmotes: currentData?.twitchChannelEmotes || [],
        twitchGlobalEmotes: currentData?.twitchGlobalEmotes || [],
        sevenTvChannelEmotes: currentData?.sevenTvChannelEmotes || [],
        sevenTvGlobalEmotes: currentData?.sevenTvGlobalEmotes || [],
        ffzChannelEmotes: currentData?.ffzChannelEmotes || [],
        ffzGlobalEmotes: currentData?.ffzGlobalEmotes || [],
        bttvGlobalEmotes: currentData?.bttvGlobalEmotes || [],
        bttvChannelEmotes: currentData?.bttvChannelEmotes || [],
        twitchChannelBadges: currentData?.twitchChannelBadges || [],
        twitchGlobalBadges: currentData?.twitchGlobalBadges || [],
        ffzChannelBadges: currentData?.ffzChannelBadges || [],
        ffzGlobalBadges: currentData?.ffzGlobalBadges || [],
        chatterinoBadges: currentData?.chatterinoBadges || [],
      };

      return result;
    },
    [state.channelCaches, state.currentChannelId],
  );

  const setBits = useCallback((bits: Bit[]) => {
    setTransientState(prevState => ({
      ...prevState,
      bits,
    }));
  }, []);

  const addTtvUser = useCallback((user: ChatUser) => {
    setTransientState(prevState => {
      const uniqueUsersMap = new Map(
        prevState.ttvUsers.map(existingUser => [
          existingUser.userId,
          existingUser,
        ]),
      );

      uniqueUsersMap.set(user.userId, user);

      return {
        ...prevState,
        ttvUsers: Array.from(uniqueUsersMap.values()),
      };
    });
  }, []);

  const clearTtvUsers = useCallback(() => {
    setTransientState(prevState => ({
      ...prevState,
      ttvUsers: [],
    }));
  }, []);

  const clearChannelResources = useCallback(() => {
    setPersistedState(prevState => ({
      ...prevState,
      currentChannelId: null,
      loadingState: 'IDLE',
      cacheStats: {
        totalFiles: 0,
        totalSizeBytes: 0,
        queueSize: 0,
        isProcessing: false,
      },
    }));

    setTransientState(prevState => ({
      emojis: [],
      ttvUsers: [],
      bits: [],
      messages: prevState.messages, // Preserve messages when clearing channel resources
    }));

    setImageCache(new Map());
    setInMemoryCache(new Map());
    setCacheQueue([]);
  }, [setPersistedState]);

  const loadChannelResources = useCallback(
    async (channelId: string, forceRefresh = false) => {
      const startTime = performance.now();
      logger.main.info('🏗️ ChatContext loadChannelResources called:', {
        channelId,
        forceRefresh,
      });
      setState(prevState => ({ ...prevState, loadingState: 'LOADING' }));

      try {
        const CACHE_DURATION = 24 * 60 * 60 * 1000; // 1 day
        let reason = '';

        if (!forceRefresh) {
          const cacheCheckStart = performance.now();
          const existingCache = state.channelCaches[channelId];
          logger.main.info('🗄️ Existing cache check:', {
            channelId,
            hasCache: !!existingCache,
            cacheKeys: existingCache ? Object.keys(existingCache) : [],
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

            // Check if we're missing the sevenTvEmoteSetId
            const missingEmoteSetId = !existingCache.sevenTvEmoteSetId;

            logger.main.info('📊 Cache validation:', {
              cacheAge: Math.round(cacheAge / (60 * 1000)),
              hasEmptyEmotes,
              missingEmoteSetId,
              emoteCounts: {
                twitch: existingCache.twitchGlobalEmotes?.length || 0,
                sevenTv: existingCache.sevenTvGlobalEmotes?.length || 0,
                bttv: existingCache.bttvGlobalEmotes?.length || 0,
                ffz: existingCache.ffzGlobalEmotes?.length || 0,
              },
            });

            if (hasEmptyEmotes) {
              reason = 'Cached data has empty emote lists';
            } else if (cacheAge >= CACHE_DURATION) {
              reason = `Cache expired (age: ${Math.round(cacheAge / (60 * 1000))} minutes)`;
            } else {
              logger.main.info('✅ Using cached data');
              logger.chat.info(
                `Using cached data for channel ${channelId} (age: ${Math.round(cacheAge / (60 * 1000))} minutes)`,
              );

              // If we're missing the emote set ID, fetch it and update the cache
              if (missingEmoteSetId) {
                try {
                  console.log(
                    '🔍 DEBUG: Fetching missing sevenTvEmoteSetId for cached data',
                  );
                  const sevenTvSetId =
                    await sevenTvService.getEmoteSetId(channelId);
                  console.log(
                    '🔍 DEBUG: Retrieved sevenTvSetId for cache:',
                    sevenTvSetId,
                  );

                  // Update the cache with the emote set ID
                  setState(prevState => ({
                    ...prevState,
                    channelCaches: {
                      ...prevState.channelCaches,
                      [channelId]: {
                        ...existingCache,
                        sevenTvEmoteSetId: sevenTvSetId,
                      },
                    },
                  }));

                  console.log(
                    '🔍 DEBUG: Updated cache with sevenTvEmoteSetId:',
                    sevenTvSetId,
                  );
                } catch (error) {
                  console.log(
                    '🔍 DEBUG: Failed to fetch sevenTvEmoteSetId for cache:',
                    error,
                  );
                  logger.chat.warn(
                    'Failed to get 7TV emote set ID for cached data:',
                    error,
                  );
                }
              }

              setState(prevState => ({
                ...prevState,
                currentChannelId: channelId,
                loadingState: 'COMPLETED',
              }));

              await new Promise<void>(resolve => {
                let attempts = 0;
                const maxAttempts = 50;

                const checkState = () => {
                  attempts += 1;

                  const emoteData = getCurrentEmoteData(channelId);
                  const totalEmotes =
                    emoteData.twitchChannelEmotes.length +
                    emoteData.twitchGlobalEmotes.length +
                    emoteData.sevenTvChannelEmotes.length +
                    emoteData.sevenTvGlobalEmotes.length +
                    emoteData.ffzChannelEmotes.length +
                    emoteData.ffzGlobalEmotes.length +
                    emoteData.bttvChannelEmotes.length +
                    emoteData.bttvGlobalEmotes.length;

                  if (totalEmotes > 0) {
                    logger.main.info('✅ State verification successful!');
                    resolve();
                  } else if (attempts >= maxAttempts) {
                    logger.main.warn(
                      '⚠️ State verification timed out, proceeding anyway',
                    );
                    resolve();
                  } else {
                    setTimeout(checkState, 10);
                  }
                };
                checkState();
              });

              logger.main.info(
                '🎯 Cache path completed, currentChannelId:',
                channelId,
              );
              const cacheCheckDuration = performance.now() - cacheCheckStart;
              const totalDuration = performance.now() - startTime;
              logger.performance.debug(
                `⏳ Load channel resources (from cache) ${channelId} -- cache check: ${cacheCheckDuration.toFixed(2)} ms, total: ${totalDuration.toFixed(2)} ms`,
              );
              return true;
            }
          }
        } else {
          reason = 'Force refresh requested';
        }

        logger.main.info('🌐 Fetching from APIs, reason:', reason);
        logger.chat.info(
          `Fetching fresh data for channel ${channelId} - Reason: ${reason}`,
        );

        logger.main.info('🎯 Setting currentChannelId to:', channelId);
        setState(prevState => ({
          ...prevState,
          currentChannelId: channelId,
          channelCaches: {
            ...prevState.channelCaches,
            [channelId]: prevState.channelCaches[channelId] || {
              emotes: [],
              badges: [],
              lastUpdated: 0,
              twitchChannelEmotes: [],
              twitchGlobalEmotes: [],
              sevenTvChannelEmotes: [],
              sevenTvGlobalEmotes: [],
              ffzChannelEmotes: [],
              ffzGlobalEmotes: [],
              bttvGlobalEmotes: [],
              bttvChannelEmotes: [],
              twitchChannelBadges: [],
              twitchGlobalBadges: [],
              ffzGlobalBadges: [],
              ffzChannelBadges: [],
              chatterinoBadges: [],
            },
          },
        }));

        let sevenTvSetId = 'global';
        const sevenTvSetIdStart = performance.now();
        try {
          sevenTvSetId = await sevenTvService.getEmoteSetId(channelId);
          console.log(
            '🔍 DEBUG: Retrieved sevenTvSetId:',
            sevenTvSetId,
            'for channelId:',
            channelId,
          );
          const sevenTvSetIdDuration = performance.now() - sevenTvSetIdStart;
          logger.performance.debug(
            `⏳ Get 7TV set ID -- time: ${sevenTvSetIdDuration.toFixed(2)} ms`,
          );
        } catch (error) {
          console.log(
            '🔍 DEBUG: Failed to get sevenTvSetId for channelId:',
            channelId,
            'error:',
            error,
          );
          const sevenTvSetIdDuration = performance.now() - sevenTvSetIdStart;
          logger.performance.debug(
            `⏳ Get 7TV set ID (failed) -- time: ${sevenTvSetIdDuration.toFixed(2)} ms`,
          );
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

        logger.chat.info(`${forceRefresh ? 'Force ' : ''}fetched emotes 🚀`);

        const getValue = <T,>(result: PromiseSettledResult<T[]>): T[] =>
          result.status === 'fulfilled' ? result.value : [];

        const allEmotes = [
          ...getValue<SanitisiedEmoteSet>(sevenTvChannelEmotes),
          ...getValue<SanitisiedEmoteSet>(sevenTvGlobalEmotes),
          ...getValue<SanitisiedEmoteSet>(twitchChannelEmotes),
          ...getValue<SanitisiedEmoteSet>(twitchGlobalEmotes),
          ...getValue<SanitisiedEmoteSet>(bttvGlobalEmotes),
          ...getValue<SanitisiedEmoteSet>(bttvChannelEmotes),
          ...getValue<SanitisiedEmoteSet>(ffzChannelEmotes),
          ...getValue<SanitisiedEmoteSet>(ffzGlobalEmotes),
        ];

        const allBadges = [
          ...getValue<SanitisedBadgeSet>(twitchChannelBadges),
          ...getValue<SanitisedBadgeSet>(twitchGlobalBadges),
          ...getValue<SanitisedBadgeSet>(ffzGlobalBadges),
          ...getValue<SanitisedBadgeSet>(ffzChannelBadges),
          ...getValue<SanitisedBadgeSet>(chatterinoBadges),
        ];

        const memoryCacheStart = performance.now();
        allEmotes.forEach(emote => {
          addToMemoryCache(emote.url, channelId, 'emote');
        });

        allBadges.forEach(badge => {
          addToMemoryCache(badge.url, channelId, 'badge');
        });
        const memoryCacheDuration = performance.now() - memoryCacheStart;
        logger.performance.debug(
          `⏳ Memory cache population (${allEmotes.length} emotes, ${allBadges.length} badges) -- time: ${memoryCacheDuration.toFixed(2)} ms`,
        );

        const cacheItems = [
          ...allEmotes.map(emote => ({
            url: emote.url,
            channelId,
            type: 'emote' as const,
          })),
          ...allBadges.map(badge => ({
            url: badge.url,
            channelId,
            type: 'badge' as const,
          })),
        ];

        const batchCacheStart = performance.now();
        batchCacheImages(cacheItems).catch(error => {
          logger.chat.error('Error batch caching images:', error);
        });
        const batchCacheSetupDuration = performance.now() - batchCacheStart;
        logger.performance.debug(
          `⏳ Batch cache setup (${cacheItems.length} items) -- time: ${batchCacheSetupDuration.toFixed(2)} ms`,
        );

        logger.chat.info(
          `Loaded ${allEmotes.length} emotes and ${allBadges.length} badges to memory cache, started background disk caching for channel ${channelId}`,
        );

        const channelData = {
          emotes: allEmotes,
          badges: allBadges,
          lastUpdated: Date.now(),
          twitchChannelEmotes:
            getValue<SanitisiedEmoteSet>(twitchChannelEmotes),
          twitchGlobalEmotes: getValue<SanitisiedEmoteSet>(twitchGlobalEmotes),
          sevenTvChannelEmotes:
            getValue<SanitisiedEmoteSet>(sevenTvChannelEmotes),
          sevenTvGlobalEmotes:
            getValue<SanitisiedEmoteSet>(sevenTvGlobalEmotes),
          bttvGlobalEmotes: getValue<SanitisiedEmoteSet>(bttvGlobalEmotes),
          bttvChannelEmotes: getValue<SanitisiedEmoteSet>(bttvChannelEmotes),
          ffzChannelEmotes: getValue<SanitisiedEmoteSet>(ffzChannelEmotes),
          ffzGlobalEmotes: getValue<SanitisiedEmoteSet>(ffzGlobalEmotes),
          twitchChannelBadges: getValue<SanitisedBadgeSet>(twitchChannelBadges),
          twitchGlobalBadges: getValue<SanitisedBadgeSet>(twitchGlobalBadges),
          ffzGlobalBadges: getValue<SanitisedBadgeSet>(ffzGlobalBadges),
          ffzChannelBadges: getValue<SanitisedBadgeSet>(ffzChannelBadges),
          chatterinoBadges: getValue<SanitisedBadgeSet>(chatterinoBadges),
          sevenTvEmoteSetId:
            sevenTvSetId !== 'global' ? sevenTvSetId : undefined,
        };

        console.log(
          '🔍 DEBUG: Storing channelData with sevenTvEmoteSetId:',
          channelData.sevenTvEmoteSetId,
          'for channelId:',
          channelId,
        );

        const statePersistStart = performance.now();

        await new Promise<void>(resolve => {
          setState(prevState => ({
            ...prevState,
            channelCaches: {
              ...prevState.channelCaches,
              [channelId]: channelData,
            },
            currentChannelId: channelId,
            loadingState: 'COMPLETED',
          }));

          setTimeout(() => {
            resolve();
          }, 10);
        });

        const statePersistDuration = performance.now() - statePersistStart;
        logger.performance.debug(
          `⏳ State persistence -- time: ${statePersistDuration.toFixed(2)} ms`,
        );

        await new Promise<void>(resolve => {
          let attempts = 0;
          const maxAttempts = 50;

          const checkState = () => {
            attempts += 1;

            const total = getCurrentEmoteData(channelId);
            const totalEmotes =
              total.twitchChannelEmotes.length +
              total.twitchGlobalEmotes.length +
              total.sevenTvChannelEmotes.length +
              total.sevenTvGlobalEmotes.length +
              total.ffzChannelEmotes.length +
              total.ffzGlobalEmotes.length +
              total.bttvChannelEmotes.length +
              total.bttvGlobalEmotes.length;

            if (totalEmotes > 0) {
              logger.main.info('✅ State verification successful!');
              resolve();
            } else if (attempts >= maxAttempts) {
              logger.main.warn(
                '⚠️ State verification timed out, proceeding anyway',
              );
              resolve();
            } else {
              setTimeout(checkState, 10);
            }
          };
          checkState();
        });

        const verifyEmoteData = () => {
          const currentData = state.channelCaches[channelId];

          return currentData
            ? {
                channelId,
                currentChannelId: state.currentChannelId,
                hasData: !!currentData,
                emoteCount:
                  (currentData.twitchChannelEmotes?.length || 0) +
                  (currentData.twitchGlobalEmotes?.length || 0) +
                  (currentData.sevenTvChannelEmotes?.length || 0) +
                  (currentData.sevenTvGlobalEmotes?.length || 0) +
                  (currentData.ffzChannelEmotes?.length || 0) +
                  (currentData.ffzGlobalEmotes?.length || 0) +
                  (currentData.bttvChannelEmotes?.length || 0) +
                  (currentData.bttvGlobalEmotes?.length || 0),
              }
            : {
                channelId,
                currentChannelId: null,
                hasData: false,
                emoteCount: 0,
              };
        };

        logger.chat.info(
          '🔍 State verification after load:',
          verifyEmoteData(),
        );

        const totalDuration = performance.now() - startTime;
        const apiDuration = performance.now() - startTime;
        logger.performance.debug(
          `⏳ Load channel resources (fresh data) ${channelId} -- API calls: ${apiDuration.toFixed(2)} ms, total: ${totalDuration.toFixed(2)} ms`,
        );

        return true;
      } catch (error) {
        logger.chat.error('Error loading channel resources:', error);
        setState(prevState => ({ ...prevState, loadingState: 'ERROR' }));
        return false;
      }
    },
    [
      state.channelCaches,
      state.currentChannelId,
      addToMemoryCache,
      batchCacheImages,
      setState,
      getCurrentEmoteData,
    ],
  );

  const refreshChannelResources = useCallback(
    async (channelId: string, forceRefresh = false) => {
      if (forceRefresh) {
        clearCache(channelId);
      }
      return loadChannelResources(channelId, forceRefresh);
    },
    [clearCache, loadChannelResources],
  );

  const addMessage = useCallback((message: ChatMessageType<never>) => {
    setTransientState(prevState => {
      const newMessages = [...prevState.messages, message];
      if (newMessages.length > MAX_MESSAGES_PER_CHANNEL) {
        // Remove oldest chunk at once for better performance
        const removeCount = Math.floor(MAX_MESSAGES_PER_CHANNEL * 0.2); // Remove 20% at a time
        return {
          ...prevState,
          messages: newMessages.slice(removeCount),
        };
      }
      return {
        ...prevState,
        messages: newMessages,
      };
    });
  }, []);

  const clearMessages = useCallback(() => {
    setTransientState(prevState => ({
      ...prevState,
      messages: [],
    }));
  }, []);

  const getCachedEmotes = useCallback(
    (channelId: string) => {
      const channelCache = imageCache.get(channelId);
      const memoryCache = inMemoryCache.get(channelId);

      const emotes: SanitisiedEmoteSet[] = [];

      if (channelCache) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        channelCache.emotes.forEach((cached, _url) => {
          if (cached.diskCacheStatus === 'cached') {
            emotes.push({
              name: cached.url.split('/').pop()?.split('.')[0] || 'unknown',
              id: cached.url,
              url: cached.localPath,
              original_name:
                cached.url.split('/').pop()?.split('.')[0] || 'unknown',
              creator: null,
              emote_link: cached.url,
              site: 'cached',
            });
          }
        });
      }

      if (memoryCache) {
        memoryCache.emotes.forEach((originalUrl, url) => {
          const isDiskCached =
            channelCache?.emotes.get(url)?.diskCacheStatus === 'cached';
          if (!isDiskCached) {
            emotes.push({
              name: url.split('/').pop()?.split('.')[0] || 'unknown',
              id: url,
              url: originalUrl,
              original_name: url.split('/').pop()?.split('.')[0] || 'unknown',
              creator: null,
              emote_link: url,
              site: 'memory',
            });
          }
        });
      }

      return emotes;
    },
    [imageCache, inMemoryCache],
  );

  const getCachedBadges = useCallback(
    (channelId: string) => {
      const channelCache = imageCache.get(channelId);
      const memoryCache = inMemoryCache.get(channelId);

      const badges: SanitisedBadgeSet[] = [];

      if (channelCache) {
        channelCache.badges.forEach(cached => {
          if (cached.diskCacheStatus === 'cached') {
            badges.push({
              id: cached.url,
              url: cached.localPath,
              type: 'Cached Badge' as const,
              title: cached.url.split('/').pop()?.split('.')[0] || 'Unknown',
              set: 'cached',
            });
          }
        });
      }

      if (memoryCache) {
        memoryCache.badges.forEach((originalUrl, url) => {
          const isDiskCached =
            channelCache?.badges.get(url)?.diskCacheStatus === 'cached';
          if (!isDiskCached) {
            badges.push({
              id: url,
              url: originalUrl,
              type: 'Memory Badge' as const,
              title: url.split('/').pop()?.split('.')[0] || 'Unknown',
              set: 'memory',
            });
          }
        });
      }

      return badges;
    },
    [imageCache, inMemoryCache],
  );

  const getSevenTvEmoteSetId = useCallback(
    (channelId?: string) => {
      const targetChannelId = channelId || state.currentChannelId;
      console.log('🔍 DEBUG: getSevenTvEmoteSetId called with:', {
        channelId,
        targetChannelId,
        currentChannelId: state.currentChannelId,
      });

      if (!targetChannelId) {
        console.log('🔍 DEBUG: No targetChannelId, returning null');
        return null;
      }

      const channelCache = state.channelCaches[targetChannelId];
      console.log('🔍 DEBUG: channelCache for', targetChannelId, ':', {
        exists: !!channelCache,
        sevenTvEmoteSetId: channelCache?.sevenTvEmoteSetId,
        cacheKeys: channelCache ? Object.keys(channelCache) : [],
      });

      const result = channelCache?.sevenTvEmoteSetId || null;
      console.log('🔍 DEBUG: getSevenTvEmoteSetId returning:', result);
      return result;
    },
    [state.channelCaches, state.currentChannelId],
  );

  const updateSevenTvEmotes = useCallback(
    (
      channelId: string,
      added: SanitisiedEmoteSet[],
      removed: SanitisiedEmoteSet[],
    ) => {
      logger.chat.info(
        `Updating SevenTV emotes for channel ${channelId}: +${added.length} -${removed.length}`,
      );

      setState(prevState => {
        const channelCache = prevState.channelCaches[channelId];
        if (!channelCache) {
          logger.chat.warn(
            `No channel cache found for ${channelId}, skipping emote update`,
          );
          return prevState;
        }

        const currentEmotes = channelCache.sevenTvChannelEmotes || [];

        /**
         * Remove emotes that were deleted
         */
        const emotesAfterRemoval = currentEmotes.filter(
          emote => !removed.some(removedEmote => removedEmote.id === emote.id),
        );

        /**
         * Add new emotes
         */
        const updatedEmotes = [...emotesAfterRemoval, ...added];

        added.forEach(emote => {
          addToMemoryCache(emote.url, channelId, 'emote');
          cacheImage(emote.url, channelId, 'emote', 2);
        });

        return {
          ...prevState,
          channelCaches: {
            ...prevState.channelCaches,
            [channelId]: {
              ...channelCache,
              sevenTvChannelEmotes: updatedEmotes,
              lastUpdated: Date.now(),
            },
          },
        };
      });
    },
    [setState, addToMemoryCache, cacheImage],
  );

  // Split context into smaller, focused memoized values
  const channelData = useMemo(
    () => ({
      twitchChannelEmotes: currentChannelData?.twitchChannelEmotes || [],
      twitchGlobalEmotes: currentChannelData?.twitchGlobalEmotes || [],
      sevenTvChannelEmotes: currentChannelData?.sevenTvChannelEmotes || [],
      sevenTvGlobalEmotes: currentChannelData?.sevenTvGlobalEmotes || [],
      ffzChannelEmotes: currentChannelData?.ffzChannelEmotes || [],
      ffzGlobalEmotes: currentChannelData?.ffzGlobalEmotes || [],
      bttvGlobalEmotes: currentChannelData?.bttvGlobalEmotes || [],
      bttvChannelEmotes: currentChannelData?.bttvChannelEmotes || [],
      twitchGlobalBadges: currentChannelData?.twitchGlobalBadges || [],
      twitchChannelBadges: currentChannelData?.twitchChannelBadges || [],
      ffzGlobalBadges: currentChannelData?.ffzGlobalBadges || [],
      ffzChannelBadges: currentChannelData?.ffzChannelBadges || [],
      chatterinoBadges: currentChannelData?.chatterinoBadges || [],
    }),
    [currentChannelData],
  );

  const cacheData = useMemo(
    () => ({
      imageCache,
      inMemoryCache,
      cacheStats: state.cacheStats,
      cacheQueue,
    }),
    [imageCache, inMemoryCache, state.cacheStats, cacheQueue],
  );

  const messageData = useMemo(
    () => ({
      messages: state.messages,
      addMessage,
      clearMessages,
      addMessages: () => [],
    }),
    [state.messages, addMessage, clearMessages],
  );

  const userData = useMemo(
    () => ({
      emojis: state.emojis,
      bits: state.bits,
      ttvUsers: state.ttvUsers,
      setBits,
      addTtvUser,
      clearTtvUsers,
    }),
    [
      state.emojis,
      state.bits,
      state.ttvUsers,
      setBits,
      addTtvUser,
      clearTtvUsers,
    ],
  );

  const cacheOperations = useMemo(
    () => ({
      cacheImage: debouncedCacheImage,
      batchCacheImages: debouncedBatchCacheImagesWrapper,
      processCacheQueue,
      processSingleCacheItem,
      addToMemoryCache,
      getCachedImageUrl,
      expireCache,
      clearCache,
      clearAllCache,
      refreshChannelResources,
      getCacheAge,
      isCacheExpired,
    }),
    [
      debouncedCacheImage,
      debouncedBatchCacheImagesWrapper,
      processCacheQueue,
      processSingleCacheItem,
      addToMemoryCache,
      getCachedImageUrl,
      expireCache,
      clearCache,
      clearAllCache,
      refreshChannelResources,
      getCacheAge,
      isCacheExpired,
    ],
  );

  const channelOperations = useMemo(
    () => ({
      loadChannelResources,
      clearChannelResources,
      getCachedEmotes,
      getCachedBadges,
      getCurrentEmoteData,
      getSevenTvEmoteSetId,
      updateSevenTvEmotes,
    }),
    [
      loadChannelResources,
      clearChannelResources,
      getCachedEmotes,
      getCachedBadges,
      getCurrentEmoteData,
      getSevenTvEmoteSetId,
      updateSevenTvEmotes,
    ],
  );

  const contextState: ChatContextState = useMemo(
    () => ({
      stateRestorationStatus,
      loadingState: state.loadingState,
      currentChannelId: state.currentChannelId,
      ...channelData,
      ...cacheData,
      ...messageData,
      ...userData,
      ...cacheOperations,
      ...channelOperations,
    }),
    [
      stateRestorationStatus,
      state.loadingState,
      state.currentChannelId,
      channelData,
      cacheData,
      messageData,
      userData,
      cacheOperations,
      channelOperations,
    ],
  );

  return (
    <ChatContext.Provider value={contextState}>{children}</ChatContext.Provider>
  );
};

export function useChatContext() {
  const context = use(ChatContext);

  if (!context) {
    throw new Error('useChatContext must be used within a ChatContextProvider');
  }
  return context;
}

interface ChatContextTestProviderProps extends ChatContextState {
  children: ReactNode;
}

export function ChatContextTestProvider({
  children,
  ...rest
}: ChatContextTestProviderProps) {
  return (
    <ChatContext.Provider
      // eslint-disable-next-line react/jsx-no-constructed-context-values
      value={{
        ...rest,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
