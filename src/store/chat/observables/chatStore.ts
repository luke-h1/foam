import { InteractionManager } from 'react-native';

import { batch, observable, when } from '@legendapp/state';
import { persistObservable } from '@legendapp/state/persist';

import {
  CHAT_RECENT_MESSAGES_PERSISTENCE_KEY,
  CHAT_STORE_PERSISTENCE_KEY,
  createObservablePersistenceLocalConfig,
  ensureObservablePersistenceConfig,
} from '@app/lib/observablePersistence';
import { getPreferences } from '@app/store/preferences/state';
import type { EmoteProvider, EmoteSite } from '@app/types/emote';
import type { BadgeProvider } from '@app/types/twitch/badge';
import { getEmojiEmotes } from '@app/utils/emoji/emojiEmotes';
import { EMOTE_PROVIDER_BY_SITE } from '@app/utils/emote/emoteProviderBySite';
import { logger } from '@app/utils/logger';

import type {
  AnyChatMessageType,
  Bit,
  ChannelCacheType,
  ChatLoadingState,
  GlobalCacheType,
  PaintData,
  SanitisedBadgeSet,
  SanitisedEmote,
} from '../types/constants';
import {
  makeEmptyGlobalCacheData,
  MAX_CACHED_CHANNELS,
} from '../types/constants';
import { loadPersistedCosmetics } from './cosmeticsPersistence';
import {
  loadPersistedRecentMessages,
  RECENT_MESSAGES_PERSISTENCE_ENABLED,
} from './recentMessagesPersistence';

export interface ChatStoreState {
  persisted: {
    channelCaches: Record<string, ChannelCacheType>;
    globalCaches: GlobalCacheType;
  };
  // Persisted separately from `persisted` so frequent message syncs do not
  // re-serialize the channel emote caches (issue #594).
  recentMessagesByChannel: Record<string, AnyChatMessageType[]>;
  loadingState: ChatLoadingState;
  currentChannelId: string | null;
  emojis: SanitisedEmote[];
  bits: Bit[];
  messages: AnyChatMessageType[];
  mentionLoginRevision: number;
  cosmeticsCacheVersion: number;
  /**
   * Incremented when per-user cosmetic bindings or badge definitions change so
   * chat messages can re-resolve badges without reloading channel emote data.
   */
  cosmeticBindingsVersion: number;
  personalEmotesVersion: number;
  paints: Record<string, PaintData>;
  userPaintIds: Record<string, string>;
  badges: Record<string, SanitisedBadgeSet>;
  userBadgeIds: Record<string, string>;
}

export const limitChannelCaches = (
  channelCaches: Record<string, ChannelCacheType>,
  currentChannelId: string | null,
): Record<string, ChannelCacheType> => {
  const entries = Object.entries(channelCaches);
  if (entries.length <= MAX_CACHED_CHANNELS) {
    return channelCaches;
  }
  const sorted = entries.slice().sort((a, b) => {
    if (a[0] === currentChannelId) {
      return -1;
    }
    if (b[0] === currentChannelId) {
      return 1;
    }
    return (b[1].lastUpdated || 0) - (a[1].lastUpdated || 0);
  });
  const limited = sorted.slice(0, MAX_CACHED_CHANNELS);
  logger.main.info(
    `Pruned channelCaches from ${entries.length} to ${limited.length} channels`,
  );
  return Object.fromEntries(limited);
};

const initialChatStoreState: ChatStoreState = {
  persisted: {
    channelCaches: {},
    globalCaches: makeEmptyGlobalCacheData(),
  },
  recentMessagesByChannel: {},
  loadingState: 'IDLE',
  currentChannelId: null,
  // Seeded empty and hydrated after first interactions - building the full
  // emoji emote set is thousands of allocations and this module loads with
  // the root layout, before the first chat screen can possibly need it.
  emojis: [],
  bits: [],
  messages: [],
  mentionLoginRevision: 0,
  cosmeticsCacheVersion: 0,
  cosmeticBindingsVersion: 0,
  personalEmotesVersion: 0,
  paints: {},
  userPaintIds: {},
  badges: {},
  userBadgeIds: {},
};

ensureObservablePersistenceConfig();

export const chatStore$ = observable<ChatStoreState>(initialChatStoreState);

const persistedState$ = persistObservable(chatStore$.persisted, {
  local: createObservablePersistenceLocalConfig(CHAT_STORE_PERSISTENCE_KEY),
});

if (!RECENT_MESSAGES_PERSISTENCE_ENABLED) {
  persistObservable(chatStore$.recentMessagesByChannel, {
    local: createObservablePersistenceLocalConfig(
      CHAT_RECENT_MESSAGES_PERSISTENCE_KEY,
    ),
  });
}

interface PersistedEmoteCarrier {
  site: EmoteSite;
  provider?: EmoteProvider;
}

interface PersistedBadgeCarrier {
  type: string;
  provider?: BadgeProvider;
}

const badgeProviderFromType = (type: string): BadgeProvider => {
  if (type.startsWith('7TV')) {
    return '7tv';
  }
  if (type.startsWith('BTTV')) {
    return 'bttv';
  }
  if (type.startsWith('FFZ')) {
    return 'ffz';
  }
  if (type.startsWith('Chatterino')) {
    return 'chatterino';
  }
  return 'twitch';
};

const backfillEmoteProviders = (
  emotes: PersistedEmoteCarrier[] | undefined,
): void => {
  if (!emotes) {
    return;
  }
  for (const emote of emotes) {
    if (!emote.provider) {
      emote.provider = EMOTE_PROVIDER_BY_SITE[emote.site];
    }
  }
};

const backfillBadgeProviders = (
  badges: PersistedBadgeCarrier[] | undefined,
): void => {
  if (!badges) {
    return;
  }
  for (const badge of badges) {
    if (!badge.provider) {
      badge.provider = badgeProviderFromType(badge.type);
    }
  }
};

/**
 * Caches persisted by builds that predate the `provider` discriminant hydrate
 * without it, and every dispatch site now reads it. Stamped in place on the
 * peeked arrays (idempotent, re-runs each launch until the cache is
 * rewritten) so hydration cost stays one pass instead of a store rewrite.
 */
const backfillPersistedProviders = () => {
  const globalCaches = chatStore$.persisted.globalCaches.peek();
  if (globalCaches) {
    backfillEmoteProviders(globalCaches.twitchGlobalEmotes);
    backfillEmoteProviders(globalCaches.sevenTvGlobalEmotes);
    backfillEmoteProviders(globalCaches.ffzGlobalEmotes);
    backfillEmoteProviders(globalCaches.bttvGlobalEmotes);
    backfillBadgeProviders(globalCaches.twitchGlobalBadges);
    backfillBadgeProviders(globalCaches.ffzGlobalBadges);
  }

  const channelCaches = chatStore$.persisted.channelCaches.peek() ?? {};
  for (const cache of Object.values(channelCaches)) {
    backfillEmoteProviders(cache.twitchChannelEmotes);
    backfillEmoteProviders(cache.twitchSubscriberEmotes);
    backfillEmoteProviders(cache.sevenTvChannelEmotes);
    backfillEmoteProviders(cache.ffzChannelEmotes);
    backfillEmoteProviders(cache.bttvChannelEmotes);
    backfillBadgeProviders(cache.twitchChannelBadges);
    backfillBadgeProviders(cache.ffzChannelBadges);
  }
};

/**
 * Chat-only hydration deferred off the startup critical path: the emoji emote
 * set, the 7TV cosmetics snapshot, and the per-channel recent-message caches
 * are all pure JS-thread work (allocation plus blocking MMKV `JSON.parse`)
 * for screens the app does not boot into - the entry route redirects to the
 * stream tabs, not chat. Runs after first interactions, well before a user
 * can navigate into a chat.
 */
const hydrateDeferredChatState = () => {
  if (chatStore$.emojis.peek().length === 0) {
    chatStore$.emojis.set(getEmojiEmotes(getPreferences().emojiStyle));
  }

  // Rehydrate the 7TV cosmetic maps from the previous session's MMKV snapshot
  // so paints/badges render on launch instead of waiting for the event API to
  // re-stream every entitlement. The websocket still corrects and extends
  // this live (create/update/delete). It can also outrace this deferred
  // hydration, so in-memory entries win over the snapshot, same as the
  // recent-messages hydration below.
  const persistedCosmetics = loadPersistedCosmetics();
  if (persistedCosmetics) {
    backfillBadgeProviders(Object.values(persistedCosmetics.badges));
    batch(() => {
      chatStore$.paints.set({
        ...persistedCosmetics.paints,
        ...chatStore$.paints.peek(),
      });
      chatStore$.badges.set({
        ...persistedCosmetics.badges,
        ...chatStore$.badges.peek(),
      });
      chatStore$.userPaintIds.set({
        ...persistedCosmetics.userPaintIds,
        ...chatStore$.userPaintIds.peek(),
      });
      chatStore$.userBadgeIds.set({
        ...persistedCosmetics.userBadgeIds,
        ...chatStore$.userBadgeIds.peek(),
      });
    });
  }

  if (RECENT_MESSAGES_PERSISTENCE_ENABLED) {
    // Native: seed from the per-channel MMKV keys (writes are handled
    // per-channel in the message-sync path, not via Legend State, so a sync
    // only re-serializes the active channel instead of every cached channel -
    // issue #594). Channels already live in memory win over the snapshot in
    // case a chat was joined before this deferred hydration ran.
    chatStore$.recentMessagesByChannel.set({
      ...loadPersistedRecentMessages(),
      ...chatStore$.recentMessagesByChannel.peek(),
    });
  }
};

InteractionManager.runAfterInteractions(hydrateDeferredChatState);

const GLOBAL_CACHE_SLICE_KEYS = [
  'twitchGlobalEmotes',
  'sevenTvGlobalEmotes',
  'ffzGlobalEmotes',
  'bttvGlobalEmotes',
  'twitchGlobalBadges',
  'ffzGlobalBadges',
] as const;

// Fields older builds persisted per channel but the current schema no longer
// holds: chatterino badges (~4,100 entries each, now resolved from the
// bundled table at read time), the `emotes`/`badges` aggregates (duplicated
// the per-provider arrays stored alongside them), 7TV personal emotes (now
// session state refetched per sighting), personal badges (only ever written
// empty), and the global provider slices (moved to the shared
// `persisted.globalCaches` slot). Stripping them on hydrate stops every
// future channelCaches write from re-serializing them.
const STALE_CHANNEL_CACHE_KEYS = [
  'chatterinoBadges',
  'emotes',
  'badges',
  'sevenTvPersonalEmotes',
  'sevenTvPersonalBadges',
  ...GLOBAL_CACHE_SLICE_KEYS,
];

type LegacyChannelCache = ChannelCacheType &
  Partial<Pick<GlobalCacheType, (typeof GLOBAL_CACHE_SLICE_KEYS)[number]>>;

/**
 * Old installs duplicated the global provider slices into every channel
 * cache; the newest copy is as fresh as any global data the app has ever
 * held, so it becomes the shared slot's first value instead of forcing an
 * empty slot on the first launch after the upgrade.
 */
const seedGlobalCachesFromChannelCopies = (
  caches: Record<string, LegacyChannelCache>,
): void => {
  const globalCache = chatStore$.persisted.globalCaches.peek();
  const hasGlobalData =
    (globalCache?.lastUpdated ?? 0) > 0 ||
    GLOBAL_CACHE_SLICE_KEYS.some(key => (globalCache?.[key]?.length ?? 0) > 0);
  if (hasGlobalData) {
    return;
  }

  let donor: LegacyChannelCache | undefined;
  for (const cache of Object.values(caches)) {
    const holdsGlobalCopies = GLOBAL_CACHE_SLICE_KEYS.some(
      key => (cache[key]?.length ?? 0) > 0,
    );
    if (
      holdsGlobalCopies &&
      (!donor || (cache.lastUpdated || 0) > (donor.lastUpdated || 0))
    ) {
      donor = cache;
    }
  }
  if (!donor) {
    return;
  }

  chatStore$.persisted.globalCaches.set({
    lastUpdated: donor.lastUpdated || 0,
    twitchGlobalEmotes: donor.twitchGlobalEmotes ?? [],
    sevenTvGlobalEmotes: donor.sevenTvGlobalEmotes ?? [],
    ffzGlobalEmotes: donor.ffzGlobalEmotes ?? [],
    bttvGlobalEmotes: donor.bttvGlobalEmotes ?? [],
    twitchGlobalBadges: donor.twitchGlobalBadges ?? [],
    ffzGlobalBadges: donor.ffzGlobalBadges ?? [],
  });
};

/**
 * Values older installs persisted alongside `persisted`, which the current
 * state type no longer declares.
 */
interface LegacyPersistedChatStore {
  lastGlobalUpdate?: number;
  recentMessagesByChannel?: Record<string, AnyChatMessageType[]>;
}

/**
 * The observable children behind `LegacyPersistedChatStore`; the migration
 * only needs each node's `delete`.
 */
interface LegacyPersistedNodes {
  lastGlobalUpdate: { delete: () => void };
  recentMessagesByChannel: { delete: () => void };
}

/**
 * The observable children behind `STALE_CHANNEL_CACHE_KEYS`, most of which
 * predate the current channel cache type.
 */
interface StaleChannelCacheNodes {
  [key: string]: { delete: () => void } | undefined;
}

export const migratePersistedChatStore = () => {
  // SAFETY: legend-state keeps persisted keys the state type dropped, so the migration widens by intersection to reach them.
  const legacyPersisted =
    chatStore$.persisted.peek() as ChatStoreState['persisted'] &
      LegacyPersistedChatStore;
  // SAFETY: same legacy keys, reached as observable nodes so they can be deleted.
  const legacyPersisted$ = chatStore$.persisted as typeof chatStore$.persisted &
    LegacyPersistedNodes;
  if (legacyPersisted.recentMessagesByChannel !== undefined) {
    legacyPersisted$.recentMessagesByChannel.delete();
  }
  if (legacyPersisted.lastGlobalUpdate !== undefined) {
    legacyPersisted$.lastGlobalUpdate.delete();
  }

  const caches: Record<string, LegacyChannelCache> =
    chatStore$.persisted.channelCaches.peek() ?? {};
  backfillPersistedProviders();

  batch(() => {
    seedGlobalCachesFromChannelCopies(caches);
    for (const [id, cache] of Object.entries(caches)) {
      // SAFETY: same legacy keys, reached as observable nodes so they can be deleted.
      const cache$ = chatStore$.persisted.channelCaches[id] as
        | ((typeof chatStore$.persisted.channelCaches)[string] &
            StaleChannelCacheNodes)
        | undefined;
      if (!cache$) {
        continue;
      }
      for (const key of STALE_CHANNEL_CACHE_KEYS) {
        if (key in cache) {
          cache$[key]?.delete();
        }
      }
    }
  });
};

when(persistedState$?._state?.isLoadedLocal, migratePersistedChatStore);

export type ChatMessagesObservable = typeof chatStore$.messages;
