import { PersistedStateStatus, usePersistedState } from '@app/hooks';
import {
  bttvEmoteService,
  ffzService,
  SanitisedBadgeSet,
  SanitisiedEmoteSet,
  sevenTvService,
  twitchBadgeService,
  twitchEmoteService,
} from '@app/services';
import { chatterinoService } from '@app/services/chatterino-service';
import { ParsedPart } from '@app/utils';
import { logger } from '@app/utils/logger';

import { fetch } from 'expo/fetch';
import { Directory, File, Paths } from 'expo-file-system/next';
import {
  createContext,
  ReactNode,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ViewStyle } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import { ChatUserstate } from 'tmi.js';
import { LOAD_BATCH_SIZE } from '@app/Providers/MediaLibraryPhotosProvider/useMediaLibraryPhotos';

const chatStorage = new MMKV({
  id: 'chat-cache',
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

export interface ChatMessageType {
  userstate: ChatUserstate;
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
    }
  >;
  currentChannelId: string | null;
  lastGlobalUpdate: number;
}

// Runtime state (non-persisted)
interface RuntimeChatState {
  loadingState: ChatLoadingState;
  imageCache: Map<string, ChannelCache>;
  inMemoryCache: Map<string, InMemoryCache>;
  cacheStats: CacheStats;
  cacheQueue: CacheQueueItem[];
  emojis: SanitisiedEmoteSet[];
  bits: Bit[];
  ttvUsers: ChatUser[];
  messages: ChatMessageType[];
}

export interface ChatContextState {
  // State restoration status
  stateRestorationStatus: PersistedStateStatus;
  loadingState: ChatLoadingState;

  // Current channel data (from persisted state)
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

  // Runtime data
  imageCache: Map<string, ChannelCache>;
  inMemoryCache: Map<string, InMemoryCache>;
  cacheStats: CacheStats;
  cacheQueue: CacheQueueItem[];
  emojis: SanitisiedEmoteSet[];
  bits: Bit[];
  ttvUsers: ChatUser[];
  messages: ChatMessageType[];

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
  getCacheSize: () => { files: number; sizeBytes: number };
  initializeCacheStats: () => void;
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
  addMessage: (message: ChatMessageType) => void;
  clearMessages: () => void;
  clearTtvUsers: () => void;
  getCachedEmotes: (channelId: string) => SanitisiedEmoteSet[];
  getCachedBadges: (channelId: string) => SanitisedBadgeSet[];

  // New method to get fresh emote data for message processing
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
};

const initialRuntimeState: RuntimeChatState = {
  loadingState: 'IDLE',
  imageCache: new Map(),
  inMemoryCache: new Map(),
  cacheStats: {
    totalFiles: 0,
    totalSizeBytes: 0,
    queueSize: 0,
    isProcessing: false,
  },
  cacheQueue: [],
  emojis: [],
  bits: [],
  ttvUsers: [],
  messages: [],
};

export const ChatContextProvider = ({ children }: ChatContextProviderProps) => {
  const [persistedState, setPersistedState, stateRestorationStatus] =
    usePersistedState<PersistedChatState>(
      'chat-context',
      initialPersistedState,
    );

  const [runtimeState, setRuntimeState] =
    useState<RuntimeChatState>(initialRuntimeState);

  /**
   * Retrieve current channel resources from disk if present
   */
  const currentChannelData = persistedState.currentChannelId
    ? persistedState.channelCaches[persistedState.currentChannelId]
    : null;

  const initializeCacheStats = useCallback(() => {
    const startTime = performance.now();
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
        setRuntimeState(prevState => ({
          ...prevState,
          cacheStats: {
            totalFiles: 0,
            totalSizeBytes: 0,
            queueSize: 0,
            isProcessing: false,
          },
        }));

        const duration = performance.now() - startTime;
        logger.performance.debug(
          `⏳ Cache directory creation -- time: ${duration.toFixed(2)} ms`,
        );
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

      setRuntimeState(prevState => ({
        ...prevState,
        cacheStats: {
          totalFiles,
          totalSizeBytes: totalSize,
          queueSize: 0,
          isProcessing: false,
        },
      }));

      const duration = performance.now() - startTime;
      logger.performance.debug(
        `⏳ Cache stats initialization (${totalFiles} files, ${sizeInMB} MB) -- time: ${duration.toFixed(2)} ms`,
      );
    } catch (error) {
      logger.chat.error('Error initializing cache stats:', error);
      const duration = performance.now() - startTime;
      logger.performance.debug(
        `⏳ Cache stats initialization (failed) -- time: ${duration.toFixed(2)} ms`,
      );

      setRuntimeState(prevState => ({
        ...prevState,
        cacheStats: {
          totalFiles: 0,
          totalSizeBytes: 0,
          queueSize: 0,
          isProcessing: false,
        },
      }));
    }
  }, []);

  /**
   * Initialize cache statistics when component mounts
   */
  useEffect(() => {
    if (stateRestorationStatus === 'IN_MEMORY') {
      initializeCacheStats();
    }
  }, [stateRestorationStatus, initializeCacheStats]);

  const addToMemoryCache = useCallback(
    (url: string, channelId: string, type: 'emote' | 'badge') => {
      setRuntimeState(prevState => {
        const channelMemoryCache = prevState.inMemoryCache.get(channelId) || {
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
          ...prevState,
          inMemoryCache: new Map(
            prevState.inMemoryCache.set(channelId, channelMemoryCache),
          ),
        };
      });
    },
    [],
  );

  const getCachedImageUrl = useCallback(
    (url: string, channelId: string, type: 'emote' | 'badge') => {
      const channelCache = runtimeState.imageCache.get(channelId);

      if (channelCache) {
        const targetMap =
          type === 'emote' ? channelCache.emotes : channelCache.badges;

        const cached = targetMap.get(url);

        if (cached && cached.diskCacheStatus === 'cached') {
          return cached.localPath;
        }
      }

      const memoryCache = runtimeState.inMemoryCache.get(channelId);

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
    [runtimeState.imageCache, runtimeState.inMemoryCache],
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

          setRuntimeState(prevState => {
            const channelCache = prevState.imageCache.get(channelId) || {
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

            return {
              ...prevState,
              imageCache: new Map(
                prevState.imageCache.set(channelId, channelCache),
              ),
            };
          });

          const duration = performance.now() - startTime;
          logger.performance.debug(
            `⏳ Cache item (existing ${type}) ${filename} -- time: ${duration.toFixed(2)} ms`,
          );
          return;
        }

        setRuntimeState(prevState => {
          const channelCache = prevState.imageCache.get(channelId) || {
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

          return {
            ...prevState,
            imageCache: new Map(
              prevState.imageCache.set(channelId, channelCache),
            ),
          };
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
          file.write(bytes);

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

          setRuntimeState(prevState => {
            const channelCache = prevState.imageCache.get(channelId) || {
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

            return {
              ...prevState,
              imageCache: new Map(
                prevState.imageCache.set(channelId, channelCache),
              ),
            };
          });

          throw fetchError;
        }

        const newFileSize = file.size || 0;
        const sizeDifference = newFileSize - existingSize;
        const fileCountChange = existingSize === 0 ? 1 : 0;

        setRuntimeState(prevState => {
          const channelCache = prevState.imageCache.get(channelId) || {
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

          return {
            ...prevState,
            imageCache: new Map(
              prevState.imageCache.set(channelId, channelCache),
            ),
            cacheStats: {
              ...prevState.cacheStats,
              totalFiles: prevState.cacheStats.totalFiles + fileCountChange,
              totalSizeBytes:
                prevState.cacheStats.totalSizeBytes + sizeDifference,
            },
          };
        });

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
    [addToMemoryCache],
  );

  const processCacheQueue = useCallback(async () => {
    if (
      runtimeState.cacheStats.isProcessing ||
      runtimeState.cacheQueue.length === 0
    ) {
      return;
    }

    const startTime = performance.now();
    const initialQueueSize = runtimeState.cacheQueue.length;

    setRuntimeState(prevState => ({
      ...prevState,
      cacheStats: { ...prevState.cacheStats, isProcessing: true },
    }));

    try {
      const CONCURRENT_DOWNLOADS = 6;
      const BATCH_SIZE = LOAD_BATCH_SIZE;
      let processedItems = 0;

      while (runtimeState.cacheQueue.length > 0) {
        const batchStartTime = performance.now();
        const currentQueue = runtimeState.cacheQueue;
        const sortedQueue = [...currentQueue].sort(
          (a, b) => b.priority - a.priority,
        );
        const batch = sortedQueue.slice(0, BATCH_SIZE);

        setRuntimeState(prevState => ({
          ...prevState,
          cacheQueue: prevState.cacheQueue.filter(
            item =>
              !batch.some(
                batchItem =>
                  batchItem.url === item.url &&
                  batchItem.channelId === item.channelId &&
                  batchItem.type === item.type,
              ),
          ),
          cacheStats: {
            ...prevState.cacheStats,
            queueSize: prevState.cacheQueue.length - batch.length,
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

        const remaining = runtimeState.cacheQueue.length;
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
      setRuntimeState(prevState => ({
        ...prevState,
        cacheStats: {
          ...prevState.cacheStats,
          isProcessing: false,
          queueSize: 0,
        },
      }));
    }
  }, [
    runtimeState.cacheStats.isProcessing,
    runtimeState.cacheQueue,
    processSingleCacheItem,
  ]);

  const cacheImage = useCallback(
    (url: string, channelId: string, type: 'emote' | 'badge', priority = 1) => {
      addToMemoryCache(url, channelId, type);

      setRuntimeState(prevState => {
        const existingIndex = prevState.cacheQueue.findIndex(
          item =>
            item.url === url &&
            item.channelId === channelId &&
            item.type === type,
        );

        if (existingIndex >= 0 && prevState.cacheQueue[existingIndex]) {
          const updatedQueue = [...prevState.cacheQueue];
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
            ...prevState,
            cacheQueue: updatedQueue,
            cacheStats: {
              ...prevState.cacheStats,
              queueSize: updatedQueue.length,
            },
          };
        }

        const newQueue = [
          ...prevState.cacheQueue,
          { url, channelId, type, priority },
        ];
        return {
          ...prevState,
          cacheQueue: newQueue,
          cacheStats: { ...prevState.cacheStats, queueSize: newQueue.length },
        };
      });

      if (!runtimeState.cacheStats.isProcessing) {
        processCacheQueue().catch(error => {
          logger.chat.error('Error processing cache queue:', error);
        });
      }
    },
    [addToMemoryCache, runtimeState.cacheStats.isProcessing, processCacheQueue],
  );

  const batchCacheImages = useCallback(
    async (
      items: Array<{ url: string; channelId: string; type: 'emote' | 'badge' }>,
    ) => {
      items.forEach(item => {
        addToMemoryCache(item.url, item.channelId, item.type);
      });

      setRuntimeState(prevState => {
        const newItems = items
          .filter(
            item =>
              !prevState.cacheQueue.some(
                queueItem =>
                  queueItem.url === item.url &&
                  queueItem.channelId === item.channelId &&
                  queueItem.type === item.type,
              ),
          )
          .map(item => ({ ...item, priority: 2 }));

        const newQueue = [...prevState.cacheQueue, ...newItems];
        return {
          ...prevState,
          cacheQueue: newQueue,
          cacheStats: { ...prevState.cacheStats, queueSize: newQueue.length },
        };
      });

      if (!runtimeState.cacheStats.isProcessing) {
        return processCacheQueue();
      }
    },
    [addToMemoryCache, runtimeState.cacheStats.isProcessing, processCacheQueue],
  );

  const expireCache = useCallback(
    (channelId?: string) => {
      if (channelId) {
        setPersistedState(prevState => ({
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
        setPersistedState(prevState => ({
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
    [setPersistedState],
  );

  const clearCache = useCallback(
    (channelId?: string) => {
      try {
        if (channelId) {
          const channelCache = runtimeState.imageCache.get(channelId);
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
          setPersistedState(prevState => ({
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
          }));

          // Clear from runtime state
          setRuntimeState(prevState => ({
            ...prevState,
            imageCache: new Map(
              Array.from(prevState.imageCache).filter(
                ([key]) => key !== channelId,
              ),
            ),
            inMemoryCache: new Map(
              Array.from(prevState.inMemoryCache).filter(
                ([key]) => key !== channelId,
              ),
            ),
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
        } else {
          const rootCacheDir = new Directory(Paths.cache, 'chat_cache');

          if (rootCacheDir.exists) {
            rootCacheDir.delete();
            logger.chat.info('Cleared all disk cache');
          }

          // Clear MMKV storage
          chatStorage.clearAll();

          // Reset persisted state
          setPersistedState(initialPersistedState);

          // Reset runtime state
          setRuntimeState(prevState => ({
            ...prevState,
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
    [runtimeState.imageCache, setPersistedState],
  );

  const clearAllCache = useCallback(() => {
    try {
      logger.chat.info('Clearing all chat cache...');

      /**
       * Delete chat_cache directory
       */
      const rootCacheDir = new Directory(Paths.cache, 'chat_cache');
      if (rootCacheDir.exists) {
        rootCacheDir.delete();
        logger.chat.info('Cleared all disk cache');
      }

      /**
       * Clear all chat storage entries
       */
      chatStorage.clearAll();

      /**
       * Reset persisted state
       */
      setPersistedState(initialPersistedState);

      /**
       * Reset in memory state
       */
      setRuntimeState(initialRuntimeState);

      logger.chat.info('All chat cache cleared successfully');
    } catch (error) {
      logger.chat.error('Error clearing all cache:', error);
    }
  }, [setPersistedState]);

  const getCacheAge = useCallback(
    (channelId: string) => {
      const channelCache = persistedState.channelCaches[channelId];
      if (!channelCache) {
        return null;
      }
      return Date.now() - channelCache.lastUpdated;
    },
    [persistedState.channelCaches],
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

  const setBits = useCallback((bits: Bit[]) => {
    setRuntimeState(prevState => ({
      ...prevState,
      bits,
    }));
  }, []);

  const addTtvUser = useCallback((user: ChatUser) => {
    setRuntimeState(prevState => {
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
    setRuntimeState(prevState => ({
      ...prevState,
      ttvUsers: [],
    }));
  }, []);

  const clearChannelResources = useCallback(() => {
    setPersistedState(prevState => ({
      ...prevState,
      currentChannelId: null,
    }));

    setRuntimeState(prevState => ({
      ...prevState,
      loadingState: 'IDLE',
      emojis: [],
      ttvUsers: [],
      bits: [],
      imageCache: new Map(),
      inMemoryCache: new Map(),
      cacheStats: {
        totalFiles: 0,
        totalSizeBytes: 0,
        queueSize: 0,
        isProcessing: false,
      },
      cacheQueue: [],
      messages: [],
    }));
  }, [setPersistedState]);

  const loadChannelResources = useCallback(
    async (channelId: string, forceRefresh = false) => {
      const startTime = performance.now();
      console.log('🏗️ ChatContext loadChannelResources called:', {
        channelId,
        forceRefresh,
      });
      setRuntimeState(prevState => ({ ...prevState, loadingState: 'LOADING' }));

      try {
        const CACHE_DURATION = 24 * 60 * 60 * 1000; // 1 day
        let reason = '';

        /**
         * If we're not forcing a refresh - we should use cached data if it's available
         */
        if (!forceRefresh) {
          const cacheCheckStart = performance.now();
          const existingCache = persistedState.channelCaches[channelId];
          console.log('🗄️ Existing cache check:', {
            channelId,
            hasCache: !!existingCache,
            cacheKeys: existingCache ? Object.keys(existingCache) : [],
          });

          /**
           * If there's no cache at all, we need to fetch from APIs
           */
          if (!existingCache) {
            reason = 'No persisted state found';
          } else {
            const cacheAge = Date.now() - existingCache.lastUpdated;

            /**
             * Do we have incomplete data? If so, we need to fetch from APIs
             */
            const hasEmptyEmotes =
              (existingCache.twitchChannelEmotes?.length || 0) === 0 &&
              (existingCache.twitchGlobalEmotes?.length || 0) === 0 &&
              (existingCache.sevenTvChannelEmotes?.length || 0) === 0 &&
              (existingCache.sevenTvGlobalEmotes?.length || 0) === 0 &&
              (existingCache.ffzChannelEmotes?.length || 0) === 0 &&
              (existingCache.ffzGlobalEmotes?.length || 0) === 0 &&
              (existingCache.bttvChannelEmotes?.length || 0) === 0 &&
              (existingCache.bttvGlobalEmotes?.length || 0) === 0;

            console.log('📊 Cache validation:', {
              cacheAge: Math.round(cacheAge / (60 * 1000)),
              hasEmptyEmotes,
              emoteCounts: {
                twitch: existingCache.twitchGlobalEmotes?.length || 0,
                sevenTv: existingCache.sevenTvGlobalEmotes?.length || 0,
                bttv: existingCache.bttvGlobalEmotes?.length || 0,
                ffz: existingCache.ffzGlobalEmotes?.length || 0,
              },
            });

            /**
             * If we have incomplete data, we need to fetch from APIs
             */
            if (hasEmptyEmotes) {
              reason = 'Cached data has empty emote lists';
            } else if (cacheAge >= CACHE_DURATION) {
              reason = `Cache expired (age: ${Math.round(cacheAge / (60 * 1000))} minutes)`;
            } else {
              /**
               * Cache is valid and we have data - use it
               */
              console.log('✅ Using cached data');
              logger.chat.info(
                `Using cached data for channel ${channelId} (age: ${Math.round(cacheAge / (60 * 1000))} minutes)`,
              );

              setPersistedState(prevState => ({
                ...prevState,
                currentChannelId: channelId,
              }));

              setRuntimeState(prevState => ({
                ...prevState,
                loadingState: 'COMPLETED',
              }));

              await new Promise(resolve => {
                setTimeout(resolve, 50);
              });
              console.log(
                '🎯 Cache path completed, currentChannelId should be:',
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

        /**
         * If we've reached this point - we need to fetch from emoji/badge APIs
         */
        console.log('🌐 Fetching from APIs, reason:', reason);
        logger.chat.info(
          `Fetching fresh data for channel ${channelId} - Reason: ${reason}`,
        );

        /**
         * Set the currentChannelId immediately when we start fetching
         */
        console.log('🎯 Setting currentChannelId to:', channelId);
        setPersistedState(prevState => ({
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
          const sevenTvSetIdDuration = performance.now() - sevenTvSetIdStart;
          logger.performance.debug(
            `⏳ Get 7TV set ID -- time: ${sevenTvSetIdDuration.toFixed(2)} ms`,
          );
        } catch (error) {
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

        /**
         * Immediately cache emotes and badges in memory while we
         * wait for the disk cache to be populated
         */
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

        /**
         * cache emotes and badges in batches to disk cache
         */
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

        // Save to persisted state
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
        };

        const statePersistStart = performance.now();
        setPersistedState(prevState => ({
          ...prevState,
          channelCaches: {
            ...prevState.channelCaches,
            [channelId]: channelData,
          },
          // currentChannelId is already set above, so we don't need to set it again
          // but we can keep it for safety
          currentChannelId: channelId,
        }));

        setRuntimeState(prevState => ({
          ...prevState,
          loadingState: 'COMPLETED',
        }));
        const statePersistDuration = performance.now() - statePersistStart;
        logger.performance.debug(
          `⏳ State persistence -- time: ${statePersistDuration.toFixed(2)} ms`,
        );

        // Wait for state to propagate before returning
        await new Promise(resolve => {
          setTimeout(resolve, 50);
        });

        // Verify the state was set correctly
        const verifyEmoteData = () => {
          const currentData = persistedState.currentChannelId
            ? persistedState.channelCaches[persistedState.currentChannelId]
            : null;

          return currentData
            ? {
                currentChannelId: persistedState.currentChannelId,
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
            : { currentChannelId: null, hasData: false, emoteCount: 0 };
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
        setRuntimeState(prevState => ({ ...prevState, loadingState: 'ERROR' }));
        return false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      persistedState.channelCaches,
      addToMemoryCache,
      batchCacheImages,
      setPersistedState,
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

  const addMessage = useCallback((message: ChatMessageType) => {
    setRuntimeState(prevState => {
      const newMessages = [...prevState.messages, message];
      if (newMessages.length > 150) {
        newMessages.shift();
      }
      return {
        ...prevState,
        messages: newMessages,
      };
    });
  }, []);

  const clearMessages = useCallback(() => {
    setRuntimeState(prevState => ({
      ...prevState,
      messages: [],
    }));
  }, []);

  const getCachedEmotes = useCallback(
    (channelId: string) => {
      const channelCache = runtimeState.imageCache.get(channelId);
      const memoryCache = runtimeState.inMemoryCache.get(channelId);

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
    [runtimeState.imageCache, runtimeState.inMemoryCache],
  );

  const getCachedBadges = useCallback(
    (channelId: string) => {
      const channelCache = runtimeState.imageCache.get(channelId);
      const memoryCache = runtimeState.inMemoryCache.get(channelId);

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
    [runtimeState.imageCache, runtimeState.inMemoryCache],
  );

  // Method to get fresh emote data - this will always return current values
  const getCurrentEmoteData = useCallback(
    (channelId?: string) => {
      const targetChannelId = channelId || persistedState.currentChannelId;
      const currentData = targetChannelId
        ? persistedState.channelCaches[targetChannelId]
        : null;

      console.log('🐛 getCurrentEmoteData called:', {
        providedChannelId: channelId,
        currentChannelId: persistedState.currentChannelId,
        targetChannelId,
        hasCurrentData: !!currentData,
        twitchChannelCount: currentData?.twitchChannelEmotes?.length || 0,
        twitchGlobalCount: currentData?.twitchGlobalEmotes?.length || 0,
        sevenTvChannelCount: currentData?.sevenTvChannelEmotes?.length || 0,
        totalEmotes:
          (currentData?.twitchChannelEmotes?.length || 0) +
          (currentData?.twitchGlobalEmotes?.length || 0) +
          (currentData?.sevenTvChannelEmotes?.length || 0) +
          (currentData?.sevenTvGlobalEmotes?.length || 0) +
          (currentData?.ffzChannelEmotes?.length || 0) +
          (currentData?.ffzGlobalEmotes?.length || 0) +
          (currentData?.bttvChannelEmotes?.length || 0) +
          (currentData?.bttvGlobalEmotes?.length || 0),
      });

      // Debug: Log what we're returning from getCurrentEmoteData
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
    [persistedState.channelCaches, persistedState.currentChannelId],
  );

  const getCacheSize = useCallback((): { files: number; sizeBytes: number } => {
    const { cacheStats } = runtimeState;
    logger.chat.debug(
      `Cache size: ${cacheStats.totalFiles} files, ${(cacheStats.totalSizeBytes / 1024 / 1024).toFixed(2)} MB`,
    );
    return {
      files: cacheStats.totalFiles,
      sizeBytes: cacheStats.totalSizeBytes,
    };
  }, [runtimeState]);

  const contextState: ChatContextState = useMemo(
    () => ({
      stateRestorationStatus,
      loadingState: runtimeState.loadingState,
      currentChannelId: persistedState.currentChannelId,

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

      // Runtime state
      imageCache: runtimeState.imageCache,
      inMemoryCache: runtimeState.inMemoryCache,
      cacheStats: runtimeState.cacheStats,
      cacheQueue: runtimeState.cacheQueue,
      emojis: runtimeState.emojis,
      bits: runtimeState.bits,
      ttvUsers: runtimeState.ttvUsers,
      messages: runtimeState.messages,

      // Methods
      cacheImage,
      batchCacheImages,
      processCacheQueue,
      processSingleCacheItem,
      addToMemoryCache,
      getCachedImageUrl,
      expireCache,
      clearCache,
      clearAllCache, // Add the new method
      getCacheSize,
      initializeCacheStats,
      refreshChannelResources,
      getCacheAge,
      isCacheExpired,
      setBits,
      addTtvUser,
      loadChannelResources,
      clearChannelResources,
      addMessage,
      clearMessages,
      clearTtvUsers,
      getCachedEmotes,
      getCachedBadges,
      getCurrentEmoteData,
    }),
    [
      stateRestorationStatus,
      runtimeState,
      persistedState.currentChannelId,
      currentChannelData,
      cacheImage,
      batchCacheImages,
      processCacheQueue,
      processSingleCacheItem,
      addToMemoryCache,
      getCachedImageUrl,
      expireCache,
      clearCache,
      clearAllCache,
      getCacheSize,
      initializeCacheStats,
      refreshChannelResources,
      getCacheAge,
      isCacheExpired,
      setBits,
      addTtvUser,
      loadChannelResources,
      clearChannelResources,
      addMessage,
      clearMessages,
      clearTtvUsers,
      getCachedEmotes,
      getCachedBadges,
      getCurrentEmoteData,
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
