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
import { ParsedPart, PartVariant } from '@app/utils';
import { logger } from '@app/utils/logger';
import { fetch } from 'expo/fetch';
import { Directory, File, Paths } from 'expo-file-system/next';
import { ViewStyle } from 'react-native';
import { ChatUserstate } from 'tmi.js';
import { create, StateCreator } from 'zustand';

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
  TPartVariant extends PartVariant = PartVariant,
> {
  userstate: ChatUserstate;
  message: ParsedPart<TPartVariant>[];
  badges: SanitisedBadgeSet[];
  channel: string;
  message_id: string;
  message_nonce: string;
  sender: string;
  style?: ViewStyle;
  parentDisplayName: string;
  replyDisplayName: string;
  replyBody: string;
}

export type ChatStatus = 'idle' | 'loading' | 'fulfilled' | 'error';

// Enhanced cache interfaces for in-memory caching
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

// Add in-memory cache interface
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

export interface ChatState {
  status: ChatStatus;

  /**
   * Image cache (persistent + in-memory)
   */
  imageCache: Map<string, ChannelCache>;
  inMemoryCache: Map<string, InMemoryCache>;
  cacheStats: CacheStats;
  cacheQueue: CacheQueueItem[];

  // Enhanced cache methods
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

  // New method for immediate in-memory caching
  addToMemoryCache: (
    url: string,
    channelId: string,
    type: 'emote' | 'badge',
  ) => void;

  // Enhanced getter that checks both memory and disk cache
  getCachedImageUrl: (
    url: string,
    channelId: string,
    type: 'emote' | 'badge',
  ) => string;

  /**
   * Cache management
   */
  expireCache: (channelId?: string) => void;
  clearCache: (channelId?: string) => void;
  getCacheSize: () => { files: number; sizeBytes: number };
  initializeCacheStats: () => void;
  refreshChannelResources: (
    channelId: string,
    forceRefresh?: boolean,
  ) => Promise<boolean>;
  getCacheAge: (channelId: string) => number | null;
  isCacheExpired: (channelId: string, maxAge?: number) => boolean;

  /**
   * Emojis
   */
  emojis: SanitisiedEmoteSet[];

  /**
   * Bits
   */
  bits: Bit[];
  setBits: (bits: Bit[]) => void;

  /**
   * Twitch emotes
   */
  twitchChannelEmotes: SanitisiedEmoteSet[];
  twitchGlobalEmotes: SanitisiedEmoteSet[];

  /**
   * 7TV emotes
   */
  sevenTvChannelEmotes: SanitisiedEmoteSet[];
  sevenTvGlobalEmotes: SanitisiedEmoteSet[];

  /**
   * FFZ emomtes
   */
  ffzChannelEmotes: SanitisiedEmoteSet[];
  ffzGlobalEmotes: SanitisiedEmoteSet[];

  /**
   * BTTV emotes
   */
  bttvGlobalEmotes: SanitisiedEmoteSet[];
  bttvChannelEmotes: SanitisiedEmoteSet[];

  /**
   * Chat users
   */
  ttvUsers: ChatUser[];
  addTtvUser: (user: ChatUser) => void;

  /**
   * Twitch badges
   */
  twitchGlobalBadges: SanitisedBadgeSet[];
  twitchChannelBadges: SanitisedBadgeSet[];

  /**
   * FFZ badges
   */
  ffzGlobalBadges: SanitisedBadgeSet[];
  ffzChannelBadges: SanitisedBadgeSet[];

  /**
   * Chatterino badges
   */
  chatterinoBadges: SanitisedBadgeSet[];

  loadChannelResources: (
    channelId: string,
    forceRefresh?: boolean,
  ) => Promise<boolean>;
  clearChannelResources: () => void;

  /**
   * Messages for replies
   */
  messages: ChatMessageType[];
  addMessage: (message: ChatMessageType) => void;

  clearMessages: () => void;
  clearTtvUsers: () => void;

  getCachedEmotes: (channelId: string) => SanitisiedEmoteSet[];
  getCachedBadges: (channelId: string) => SanitisedBadgeSet[];
}

const chatStoreCreator: StateCreator<ChatState> = (set, get) => ({
  status: 'idle',

  imageCache: new Map(),
  inMemoryCache: new Map(),
  cacheStats: {
    totalFiles: 0,
    totalSizeBytes: 0,
    queueSize: 0,
    isProcessing: false,
  },
  cacheQueue: [],

  initializeCacheStats: () => {
    try {
      logger.chat.info('Initializing cache statistics...');

      const rootCacheDir = new Directory(Paths.cache, 'chat_cache');

      if (!rootCacheDir.exists) {
        logger.chat.info('Cache directory does not exist, creating it...');
        try {
          rootCacheDir.create();
        } catch (error) {
          logger.chat.warn(
            'Standard create failed, trying manual directory creation',
          );
          throw error;
        }
        logger.chat.info('Cache directory created');
        set(state => ({
          ...state,
          cacheStats: {
            totalFiles: 0,
            totalSizeBytes: 0,
            queueSize: 0,
            isProcessing: false,
          },
        }));
        return;
      }

      let totalFiles = 0;
      let totalSize = 0;

      const countFilesRecursively = (directory: Directory): void => {
        directory.list().forEach(item => {
          if (item instanceof Directory) {
            countFilesRecursively(item);
          } else if (item instanceof File) {
            totalFiles += 1;
            totalSize += item.size || 0;
          }
        });
      };

      countFilesRecursively(rootCacheDir);

      const sizeInMB = (totalSize / 1024 / 1024).toFixed(2);
      logger.chat.info(
        `Cache stats initialized: ${totalFiles} files, ${sizeInMB} MB`,
      );

      set(state => ({
        ...state,
        cacheStats: {
          totalFiles,
          totalSizeBytes: totalSize,
          queueSize: 0,
          isProcessing: false,
        },
      }));
    } catch (error) {
      logger.chat.error('Error initializing cache stats:', error);
      set(state => ({
        ...state,
        cacheStats: {
          totalFiles: 0,
          totalSizeBytes: 0,
          queueSize: 0,
          isProcessing: false,
        },
      }));
    }
  },

  cacheImage: (
    url: string,
    channelId: string,
    type: 'emote' | 'badge',
    priority = 1,
  ) => {
    get().addToMemoryCache(url, channelId, type);

    /**
     * Add to disk cache queue for background processing
     * while also caching in memory
     */
    set(state => {
      const existingIndex = state.cacheQueue.findIndex(
        item =>
          item.url === url &&
          item.channelId === channelId &&
          item.type === type,
      );

      if (existingIndex >= 0 && state.cacheQueue[existingIndex]) {
        const updatedQueue = [...state.cacheQueue];
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
        return {
          ...state,
          cacheQueue: updatedQueue,
          cacheStats: { ...state.cacheStats, queueSize: updatedQueue.length },
        };
      }

      const newQueue = [
        ...state.cacheQueue,
        { url, channelId, type, priority },
      ];
      return {
        ...state,
        cacheQueue: newQueue,
        cacheStats: { ...state.cacheStats, queueSize: newQueue.length },
      };
    });

    const { isProcessing } = get().cacheStats;
    if (!isProcessing) {
      get()
        .processCacheQueue()
        .catch(error => {
          logger.chat.error('Error processing cache queue:', error);
        });
    }
  },

  addToMemoryCache: (
    url: string,
    channelId: string,
    type: 'emote' | 'badge',
  ) => {
    set(state => {
      const channelMemoryCache = state.inMemoryCache.get(channelId) || {
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

      return {
        ...state,
        inMemoryCache: new Map(
          state.inMemoryCache.set(channelId, channelMemoryCache),
        ),
      };
    });
  },

  getCachedImageUrl: (
    url: string,
    channelId: string,
    type: 'emote' | 'badge',
  ) => {
    const channelCache = get().imageCache.get(channelId);
    if (channelCache) {
      const targetMap =
        type === 'emote' ? channelCache.emotes : channelCache.badges;
      const cached = targetMap.get(url);
      if (cached && cached.diskCacheStatus === 'cached') {
        return cached.localPath;
      }
    }

    const memoryCache = get().inMemoryCache.get(channelId);
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

  batchCacheImages: async (
    items: Array<{ url: string; channelId: string; type: 'emote' | 'badge' }>,
  ) => {
    items.forEach(item => {
      get().addToMemoryCache(item.url, item.channelId, item.type);
    });

    set(state => {
      const newItems = items
        .filter(
          item =>
            !state.cacheQueue.some(
              queueItem =>
                queueItem.url === item.url &&
                queueItem.channelId === item.channelId &&
                queueItem.type === item.type,
            ),
        )
        .map(item => ({ ...item, priority: 2 }));

      const newQueue = [...state.cacheQueue, ...newItems];
      return {
        ...state,
        cacheQueue: newQueue,
        cacheStats: { ...state.cacheStats, queueSize: newQueue.length },
      };
    });

    const { isProcessing } = get().cacheStats;
    if (!isProcessing) {
      return get().processCacheQueue();
    }
  },

  /**
   * Processes cache queues for emojis and badges
   */
  processCacheQueue: async () => {
    const state = get();
    if (state.cacheStats.isProcessing || state.cacheQueue.length === 0) {
      return;
    }

    set(currentState => ({
      ...currentState,
      cacheStats: { ...currentState.cacheStats, isProcessing: true },
    }));

    try {
      const CONCURRENT_DOWNLOADS = 6;
      const BATCH_SIZE = 20;

      while (get().cacheQueue.length > 0) {
        const currentQueue = get().cacheQueue;
        const sortedQueue = [...currentQueue].sort(
          (a, b) => b.priority - a.priority,
        );
        const batch = sortedQueue.slice(0, BATCH_SIZE);

        set(currentState => ({
          ...currentState,
          cacheQueue: currentState.cacheQueue.filter(
            item =>
              !batch.some(
                batchItem =>
                  batchItem.url === item.url &&
                  batchItem.channelId === item.channelId &&
                  batchItem.type === item.type,
              ),
          ),
          cacheStats: {
            ...currentState.cacheStats,
            queueSize: currentState.cacheQueue.length - batch.length,
          },
        }));

        const processItem = async (item: CacheQueueItem) => {
          try {
            await get().processSingleCacheItem(item);
          } catch (error) {
            logger.chat.warn(
              `Failed to cache ${item.type} ${item.url}:`,
              error,
            );
          }
        };

        for (let i = 0; i < batch.length; i += CONCURRENT_DOWNLOADS) {
          const chunk = batch.slice(i, i + CONCURRENT_DOWNLOADS);
          // eslint-disable-next-line no-await-in-loop
          await Promise.allSettled(chunk.map(processItem));
          // eslint-disable-next-line no-await-in-loop
          await new Promise(resolve => {
            setTimeout(resolve, 10);
          });
        }

        const remaining = get().cacheQueue.length;
        if (remaining > 0) {
          logger.chat.debug(
            `Cache queue progress: ${remaining} items remaining`,
          );
        }
      }

      logger.chat.info('Cache queue processing completed');
    } catch (error) {
      logger.chat.error('Error in cache queue processing:', error);
    } finally {
      set(currentState => ({
        ...currentState,
        cacheStats: {
          ...currentState.cacheStats,
          isProcessing: false,
          queueSize: 0,
        },
      }));
    }
  },

  processSingleCacheItem: async (item: CacheQueueItem) => {
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

        const channelCache = get().imageCache.get(channelId) || {
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

        set(state => ({
          ...state,
          imageCache: new Map(state.imageCache.set(channelId, channelCache)),
        }));

        return;
      }

      const channelCache = get().imageCache.get(channelId) || {
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

      set(state => ({
        ...state,
        imageCache: new Map(state.imageCache.set(channelId, channelCache)),
      }));

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

      try {
        const response = await fetch(url, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const bytes = await response.bytes();
        file.write(bytes, {});

        clearTimeout(timeoutId);
      } catch (fetchError) {
        clearTimeout(timeoutId);

        targetMap.set(url, {
          url,
          localPath: url,
          lastUpdated: Date.now(),
          sizeBytes: 0,
          isMemoryCache: true,
          diskCacheStatus: 'failed',
        });

        set(state => ({
          ...state,
          imageCache: new Map(state.imageCache.set(channelId, channelCache)),
        }));

        throw fetchError;
      }

      const newFileSize = file.size || 0;
      const sizeDifference = newFileSize - existingSize;
      const fileCountChange = existingSize === 0 ? 1 : 0;

      targetMap.set(url, {
        url,
        localPath: file.uri,
        lastUpdated: Date.now(),
        sizeBytes: newFileSize,
        isMemoryCache: false,
        diskCacheStatus: 'cached',
      });

      set(state => ({
        ...state,
        imageCache: new Map(state.imageCache.set(channelId, channelCache)),
        cacheStats: {
          ...state.cacheStats,
          totalFiles: state.cacheStats.totalFiles + fileCountChange,
          totalSizeBytes: state.cacheStats.totalSizeBytes + sizeDifference,
        },
      }));

      logger.chat.debug(`Successfully cached ${type}: ${url}`);
    } catch (error) {
      get().addToMemoryCache(url, channelId, type);
      throw error;
    }
  },

  /**
   * Cache management methods
   */
  expireCache: (channelId?: string) => {
    set(state => {
      if (channelId) {
        const channelCache = state.imageCache.get(channelId);
        if (channelCache) {
          const expiredCache = {
            ...channelCache,
            lastUpdated: 0,
          };
          const newImageCache = new Map(state.imageCache);
          newImageCache.set(channelId, expiredCache);
          return {
            ...state,
            imageCache: newImageCache,
          };
        }
      } else {
        const newImageCache = new Map();
        state.imageCache.forEach((cache, key) => {
          newImageCache.set(key, {
            ...cache,
            lastUpdated: 0,
          });
        });
        return {
          ...state,
          imageCache: newImageCache,
        };
      }
      return state;
    });
  },

  clearCache: (channelId?: string) => {
    try {
      if (channelId) {
        const channelCache = get().imageCache.get(channelId);
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

        set(state => ({
          ...state,
          imageCache: new Map(
            Array.from(state.imageCache).filter(([key]) => key !== channelId),
          ),
          inMemoryCache: new Map(
            Array.from(state.inMemoryCache).filter(
              ([key]) => key !== channelId,
            ),
          ),
          cacheStats: {
            totalFiles: Math.max(
              0,
              state.cacheStats.totalFiles - filesToRemove,
            ),
            totalSizeBytes: Math.max(
              0,
              state.cacheStats.totalSizeBytes - sizeToRemove,
            ),
            queueSize: 0,
            isProcessing: false,
          },
        }));
      } else {
        const rootCacheDir = new Directory(Paths.cache, 'chat_cache');

        if (rootCacheDir.exists) {
          rootCacheDir.delete();
          logger.chat.info('Cleared all disk cache');
        }

        set(state => ({
          ...state,
          imageCache: new Map(),
          inMemoryCache: new Map(),
          cacheStats: {
            totalFiles: 0,
            totalSizeBytes: 0,
            queueSize: 0,
            isProcessing: false,
          },
        }));
      }
    } catch (error) {
      logger.chat.error('Error clearing cache:', error);
    }
  },

  getCacheAge: (channelId: string) => {
    const channelCache = get().imageCache.get(channelId);
    if (!channelCache) {
      return null;
    }
    return Date.now() - channelCache.lastUpdated;
  },

  isCacheExpired: (channelId: string, maxAge = 24 * 60 * 60 * 1000) => {
    const cacheAge = get().getCacheAge(channelId);
    if (cacheAge === null) {
      return true;
    }
    return cacheAge > maxAge;
  },

  refreshChannelResources: async (channelId: string, forceRefresh = false) => {
    if (forceRefresh) {
      get().clearCache(channelId);
    }
    return get().loadChannelResources(channelId, forceRefresh);
  },

  bits: [],
  setBits: bits => {
    return set(state => ({
      ...state,
      bits,
    }));
  },

  /**
   * Chatters
   */
  ttvUsers: [],
  addTtvUser: user => {
    return set(state => {
      const uniqueUsersMap = new Map(
        // eslint-disable-next-line no-shadow
        state.ttvUsers.map(user => [user.userId, user]),
      );

      uniqueUsersMap.set(user.userId, user);

      return {
        ...state,
        ttvUsers: Array.from(uniqueUsersMap.values()),
      };
    });
  },

  clearTtvUsers: () => {
    return set(state => {
      return {
        ...state,
        ttvUsers: [],
      };
    });
  },

  /**
   * Placeholder for chatterino emotes
   */
  emojis: [],

  /**
   * Twitch
   */
  twitchChannelEmotes: [],
  twitchGlobalEmotes: [],

  /**
   * FFZ
   */
  ffzChannelEmotes: [],
  ffzGlobalEmotes: [],

  /**
   * Seven TV
   */
  sevenTvChannelEmotes: [],
  sevenTvGlobalEmotes: [],

  /**
   * BTTV
   */
  bttvChannelEmotes: [],
  bttvGlobalEmotes: [],

  /**
   * Twitch Badges
   */
  twitchGlobalBadges: [],
  twitchChannelBadges: [],

  /**
   * FFZ badges
   */
  ffzGlobalBadges: [],
  ffzChannelBadges: [],

  chatterinoBadges: [],

  clearChannelResources: () => {
    set(() => ({
      status: 'idle',
      twitchChannelEmotes: [],
      twitchGlobalEmotes: [],
      ffzChannelEmotes: [],
      ffzGlobalEmotes: [],
      sevenTvChannelEmotes: [],
      sevenTvGlobalEmotes: [],
      emojis: [],
      ttvUsers: [],
      bits: [],
      twitchChannelBadges: [],
      twitchGlobalBadges: [],
      ffzGlobalBadges: [],
      ffzChannelBadges: [],
      chatterinoBadges: [],
      imageCache: new Map(),
      inMemoryCache: new Map(),
      cacheStats: {
        totalFiles: 0,
        totalSizeBytes: 0,
        queueSize: 0,
        isProcessing: false,
      },
      cacheQueue: [],
    }));
  },

  loadChannelResources: async (channelId: string, forceRefresh = false) => {
    set(state => ({ ...state, status: 'loading' }));
    try {
      /**
       * For the time being - cache for 24 hours. Eventually we'll react to WS events to dictate this cache age
       * with the default being Infinity until the WS informs us of updates
       */
      const CACHE_DURATION = 24 * 60 * 60 * 1000;

      if (!forceRefresh) {
        const existingCache = get().imageCache.get(channelId);
        const cacheAge = existingCache
          ? Date.now() - existingCache.lastUpdated
          : Infinity;

        if (existingCache && cacheAge < CACHE_DURATION) {
          logger.chat.info(
            `Using cached data for channel ${channelId} (age: ${Math.round(cacheAge / (60 * 1000))} minutes)`,
          );

          set(state => ({
            ...state,
            status: 'fulfilled',
            twitchChannelEmotes: [],
            twitchGlobalEmotes: [],
            sevenTvChannelEmotes: [],
            sevenTvGlobalEmotes: [],
            bttvGlobalEmotes: [],
            bttvChannelEmotes: [],
            ffzChannelEmotes: [],
            ffzGlobalEmotes: [],
            twitchChannelBadges: [],
            twitchGlobalBadges: [],
            ffzGlobalBadges: [],
            ffzChannelBadges: [],
            chatterinoBadges: [],
          }));

          return true;
        }
      }

      const logMessage = forceRefresh
        ? `Force refreshing data for channel ${channelId}`
        : `Cache miss or expired for channel ${channelId}, fetching from APIs`;

      logger.chat.info(logMessage);

      let sevenTvSetId = 'global';
      try {
        sevenTvSetId = await sevenTvService.getEmoteSetId(channelId);
      } catch (error) {
        logger.chat.warn('Failed to get 7TV emote set ID:', error);
      }

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

      logger.chat.info(`${forceRefresh ? 'Force ' : ''}fetched emotes 🚀`);

      const getValue = <T>(result: PromiseSettledResult<T[]>): T[] =>
        result.status === 'fulfilled' ? result.value : [];

      const logEmptyEmoteResponse = (
        provider: string,
        type: string,
        emotes: PromiseSettledResult<SanitisiedEmoteSet[]>,
      ) => {
        if (getValue(emotes).length === 0) {
          const message = `Empty response from ${provider} ${type}`;
          logger.api.warn(message);
        }
      };

      const logEmptyBadgeResponse = (
        provider: string,
        type: string,
        badges: PromiseSettledResult<SanitisedBadgeSet[]>,
      ) => {
        if (getValue(badges).length === 0) {
          const message = `Empty response from ${provider} ${type} badges`;
          logger.api.warn(message);
        }
      };

      logEmptyEmoteResponse('7TV emotes', 'channel', sevenTvChannelEmotes);
      logEmptyEmoteResponse('7TV emotes', 'global', sevenTvGlobalEmotes);
      logEmptyEmoteResponse('Twitch emotes', 'channel', twitchChannelEmotes);
      logEmptyEmoteResponse('Twitch', 'global', twitchGlobalEmotes);
      logEmptyEmoteResponse('BTTV', 'global', bttvGlobalEmotes);
      logEmptyEmoteResponse('BTTV', 'channel', bttvChannelEmotes);
      logEmptyEmoteResponse('FFZ', 'channel', ffzChannelEmotes);
      logEmptyEmoteResponse('FFZ', 'global', ffzGlobalEmotes);
      logEmptyBadgeResponse('Twitch', 'global', twitchGlobalBadges);
      logEmptyBadgeResponse('Twitch', 'channel', twitchChannelBadges);
      logEmptyBadgeResponse('FFZ', 'global', ffzGlobalBadges);

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

      // Immediately add all emotes and badges to memory cache
      allEmotes.forEach(emote => {
        get().addToMemoryCache(emote.url, channelId, 'emote');
      });

      allBadges.forEach(badge => {
        get().addToMemoryCache(badge.url, channelId, 'badge');
      });

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

      get()
        .batchCacheImages(cacheItems)
        .catch(error => {
          logger.chat.error('Error batch caching images:', error);
        });

      logger.chat.info(
        `Loaded ${allEmotes.length} emotes and ${allBadges.length} badges to memory cache, started background disk caching for channel ${channelId}`,
      );

      set(state => ({
        ...state,
        status: 'fulfilled',
        twitchChannelEmotes: getValue<SanitisiedEmoteSet>(twitchChannelEmotes),
        twitchGlobalEmotes: getValue<SanitisiedEmoteSet>(twitchGlobalEmotes),
        sevenTvChannelEmotes:
          getValue<SanitisiedEmoteSet>(sevenTvChannelEmotes),
        sevenTvGlobalEmotes: getValue<SanitisiedEmoteSet>(sevenTvGlobalEmotes),
        bttvGlobalEmotes: getValue<SanitisiedEmoteSet>(bttvGlobalEmotes),
        bttvChannelEmotes: getValue<SanitisiedEmoteSet>(bttvChannelEmotes),
        ffzChannelEmotes: getValue<SanitisiedEmoteSet>(ffzChannelEmotes),
        ffzGlobalEmotes: getValue<SanitisiedEmoteSet>(ffzGlobalEmotes),
        twitchChannelBadges: getValue<SanitisedBadgeSet>(twitchChannelBadges),
        twitchGlobalBadges: getValue<SanitisedBadgeSet>(twitchGlobalBadges),
        ffzGlobalBadges: getValue<SanitisedBadgeSet>(ffzGlobalBadges),
        ffzChannelBadges: getValue<SanitisedBadgeSet>(ffzChannelBadges),
        chatterinoBadges: getValue<SanitisedBadgeSet>(chatterinoBadges),
      }));

      return true;
    } catch (error) {
      logger.chat.error('Error loading channel resources:', error);
      set(state => ({ ...state, status: 'error' }));
      return false;
    }
  },

  messages: [],
  addMessage: (message: ChatMessageType) => {
    set(state => {
      const newMessages = [...state.messages, message];
      if (newMessages.length > 150) {
        newMessages.shift();
      }
      return {
        ...state,
        messages: newMessages,
      };
    });
  },
  clearMessages: () => {
    set(state => ({
      ...state,
      messages: [],
    }));
  },

  getCachedEmotes: (channelId: string) => {
    const channelCache = get().imageCache.get(channelId);
    const memoryCache = get().inMemoryCache.get(channelId);

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

  getCachedBadges: (channelId: string) => {
    const channelCache = get().imageCache.get(channelId);
    const memoryCache = get().inMemoryCache.get(channelId);

    const badges: SanitisedBadgeSet[] = [];

    if (channelCache) {
      channelCache.badges.forEach(cached => {
        if (cached.diskCacheStatus === 'cached') {
          badges.push({
            id: cached.url,
            url: cached.localPath,
            // todo - store type
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

  getCacheSize: (): { files: number; sizeBytes: number } => {
    const { cacheStats } = get();
    logger.chat.debug(
      `Cache size: ${cacheStats.totalFiles} files, ${(cacheStats.totalSizeBytes / 1024 / 1024).toFixed(2)} MB`,
    );
    return {
      files: cacheStats.totalFiles,
      sizeBytes: cacheStats.totalSizeBytes,
    };
  },
});

export const useChatStore = create<ChatState>()(chatStoreCreator);
