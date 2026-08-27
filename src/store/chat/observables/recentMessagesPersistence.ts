import { createMMKV } from 'react-native-mmkv';

import { CHAT_RECENT_MESSAGES_PERSISTENCE_KEY } from '@app/lib/observablePersistence';

import type { AnyChatMessageType } from '../types/constants';

// One MMKV key per channel: the whole-map approach re-stringified every cached
// channel per sync (~690KB, #594). Native only - the `.web.ts` sibling no-ops.
export const RECENT_MESSAGES_PERSISTENCE_ENABLED = true;

const storage = createMMKV({ id: 'chat-recent-messages' });

// One-time cleanup of the old single-key blob written by Legend State into the
// shared `obsPersist` instance, so it does not sit orphaned forever.
const migrateLegacyBlob = () => {
  try {
    const legacy = createMMKV({ id: 'obsPersist' });
    if (legacy.contains(CHAT_RECENT_MESSAGES_PERSISTENCE_KEY)) {
      legacy.remove(CHAT_RECENT_MESSAGES_PERSISTENCE_KEY);
      legacy.remove(`${CHAT_RECENT_MESSAGES_PERSISTENCE_KEY}__m`);
    }
  } catch {
    // Best-effort; a failed cleanup just leaves a stale key behind.
  }
};

export const loadPersistedRecentMessages = () => {
  migrateLegacyBlob();

  const result: Record<string, AnyChatMessageType[]> = {};
  for (const channelId of storage.getAllKeys()) {
    const raw = storage.getString(channelId);
    if (!raw) {
      continue;
    }
    try {
      // SAFETY: every key in this MMKV instance is written by `writePersistedRecentMessagesForChannel` as a JSON array of store messages; a malformed blob is dropped by the `Array.isArray` guard below or the catch.
      const parsed = JSON.parse(raw) as AnyChatMessageType[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        result[channelId] = parsed;
      }
    } catch {
      storage.remove(channelId);
    }
  }
  return result;
};

export const writePersistedRecentMessagesForChannel = (
  channelId: string,
  messages: AnyChatMessageType[],
): void => {
  storage.set(channelId, JSON.stringify(messages));
};

export const deletePersistedRecentMessagesForChannels = (
  channelIds: readonly string[],
): void => {
  for (const channelId of channelIds) {
    storage.remove(channelId);
  }
};

export const clearPersistedRecentMessages = (): void => {
  storage.clearAll();
};
