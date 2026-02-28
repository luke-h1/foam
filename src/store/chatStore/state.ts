import { logger } from '@app/utils/logger';
import { observable } from '@legendapp/state';
import {
  configureObservablePersistence,
  persistObservable,
} from '@legendapp/state/persist';
import { ObservablePersistMMKV } from '@legendapp/state/persist-plugins/mmkv';

import type {
  Bit,
  ChannelCacheType,
  ChatLoadingState,
  ChatMessageType,
  ChatUser,
  PaintData,
  SanitisedBadgeSet,
  SanitisedEmote,
} from './constants';
import { MAX_CACHED_CHANNELS } from './constants';

export interface ChatStoreState {
  persisted: {
    channelCaches: Record<string, ChannelCacheType>;
    lastGlobalUpdate: number;
  };
  loadingState: ChatLoadingState;
  currentChannelId: string | null;
  emojis: SanitisedEmote[];
  bits: Bit[];
  ttvUsers: ChatUser[];
  messages: ChatMessageType<never>[];
  paints: Record<string, PaintData>;
  userPaintIds: Record<string, string>;
  badges: Record<string, SanitisedBadgeSet>;
  userBadgeIds: Record<string, string>;
}

configureObservablePersistence({
  pluginLocal: ObservablePersistMMKV,
});

export const limitChannelCaches = (
  channelCaches: Record<string, ChannelCacheType>,
  currentChannelId: string | null,
): Record<string, ChannelCacheType> => {
  const entries = Object.entries(channelCaches);
  if (entries.length <= MAX_CACHED_CHANNELS) {
    return channelCaches;
  }
  const sorted = entries.sort((a, b) => {
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
  loadingState: 'IDLE',
  currentChannelId: null,
  emojis: [],
  bits: [],
  ttvUsers: [],
  messages: [],
  paints: {},
  userPaintIds: {},
  badges: {},
  userBadgeIds: {},
};

export const chatStore$ = observable<ChatStoreState>(initialChatStoreState);

persistObservable(chatStore$.persisted, {
  local: 'chat-store-v2',
});
