import { logger } from '@app/utils/logger';
import {
  CHAT_STORE_PERSISTENCE_KEY,
  createObservablePersistenceLocalConfig,
  ensureObservablePersistenceConfig,
} from '@app/lib/observablePersistence';
import { getEmojiEmotes } from '@app/utils/emoji/emojiEmotes';
import { observable } from '@legendapp/state';
import { persistObservable } from '@legendapp/state/persist';

import type {
  AnyChatMessageType,
  Bit,
  ChannelCacheType,
  ChatLoadingState,
  ChatUser,
  PaintData,
  SanitisedBadgeSet,
  SanitisedEmote,
} from './constants';
import { MAX_CACHED_CHANNELS } from './constants';
import { getPreferences } from '../preferenceStore';

export interface ChatStoreState {
  persisted: {
    channelCaches: Record<string, ChannelCacheType>;
    lastGlobalUpdate: number;
    recentMessagesByChannel: Record<string, AnyChatMessageType[]>;
  };
  loadingState: ChatLoadingState;
  currentChannelId: string | null;
  emojis: SanitisedEmote[];
  bits: Bit[];
  ttvUsers: ChatUser[];
  messages: AnyChatMessageType[];
  mentionLoginRevision: number;
  paints: Record<string, PaintData>;
  userPaintIds: Record<string, string>;
  badges: Record<string, SanitisedBadgeSet>;
  userBadgeIds: Record<string, string>;
  sessionCaches: {
    mentionColors: Record<string, { value: string; expiresAt: number }>;
    lightenedColors: Record<string, { value: string; expiresAt: number }>;
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
    recentMessagesByChannel: {},
  },
  loadingState: 'IDLE',
  currentChannelId: null,
  emojis: getEmojiEmotes(getPreferences().emojiStyle),
  bits: [],
  ttvUsers: [],
  messages: [],
  mentionLoginRevision: 0,
  paints: {},
  userPaintIds: {},
  badges: {},
  userBadgeIds: {},
  sessionCaches: {
    mentionColors: {},
    lightenedColors: {},
  },
};

ensureObservablePersistenceConfig();

export const chatStore$ = observable<ChatStoreState>(initialChatStoreState);

persistObservable(chatStore$.persisted, {
  local: createObservablePersistenceLocalConfig(CHAT_STORE_PERSISTENCE_KEY),
});
