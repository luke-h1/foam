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
import { getEmojiEmotes } from '@app/utils/emoji/emojiEmotes';
import { logger } from '@app/utils/logger';

import type {
  AnyChatMessageType,
  Bit,
  ChannelCacheType,
  ChatLoadingState,
  PaintData,
  SanitisedBadgeSet,
  SanitisedEmote,
} from '../types/constants';
import { MAX_CACHED_CHANNELS } from '../types/constants';
import { loadPersistedCosmetics } from './cosmeticsPersistence';
import {
  loadPersistedRecentMessages,
  RECENT_MESSAGES_PERSISTENCE_ENABLED,
} from './recentMessagesPersistence';

export interface ChatStoreState {
  persisted: {
    channelCaches: Record<string, ChannelCacheType>;
    lastGlobalUpdate: number;
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
  sessionCaches: {
    // getChatRowItemType runs per row on every list data change; caching the
    // two-peek paints/userPaintIds traversal per user avoids re-walking those
    // observables for every row on every render.
    userPaintFlags: Record<string, boolean>;
  };
  sharedChatBadgeCaches: {
    sourceBadges: Record<
      string,
      { value: SanitisedBadgeSet | null; expiresAt: number }
    >;
    channelBadges: Record<
      string,
      { value: SanitisedBadgeSet[]; expiresAt: number }
    >;
  };
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
    lastGlobalUpdate: 0,
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
  sessionCaches: {
    userPaintFlags: {},
  },
  sharedChatBadgeCaches: {
    sourceBadges: {},
    channelBadges: {},
  },
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

// Fields older builds persisted but the current schema no longer holds.
// Recent messages used to live inside `persisted`; chatterino badges used to
// be stored per channel (~4,100 entries each) and are now resolved from the
// bundled table at read time; the `emotes`/`badges` aggregates duplicated the
// per-provider arrays stored alongside them; 7TV personal emotes are now
// session state refetched per sighting, and personal badges were only ever
// written empty. Stripping them on hydrate stops every future channelCaches
// write from re-serializing them.
const STALE_CHANNEL_CACHE_KEYS = [
  'chatterinoBadges',
  'emotes',
  'badges',
  'sevenTvPersonalEmotes',
  'sevenTvPersonalBadges',
];

export const migratePersistedChatStore = () => {
  const persisted = chatStore$.persisted.peek() as {
    recentMessagesByChannel?: unknown;
  };
  if (persisted.recentMessagesByChannel !== undefined) {
    (
      chatStore$.persisted as unknown as {
        recentMessagesByChannel: { delete: () => void };
      }
    ).recentMessagesByChannel.delete();
  }

  const caches = chatStore$.persisted.channelCaches.peek() ?? {};
  batch(() => {
    for (const [id, cache] of Object.entries(caches)) {
      const cache$ = chatStore$.persisted.channelCaches[id] as unknown as
        Record<string, { delete: () => void }> | undefined;
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
