import { createMMKV } from 'react-native-mmkv';

import type { AnyChatMessageType } from '../types/constants';
import { CHAT_RECENT_MESSAGES_PERSISTENCE_KEY } from '@app/lib/observablePersistence';

// Recent messages are persisted with one MMKV key per channel rather than a
// single serialized map. A busy chat re-syncs every few seconds; with the
// whole-map approach (Legend State persisting the node), each sync re-stringified
// and re-wrote every cached channel — ~690KB / 400 messages across 5 channels in
// profiling (issue #594) — even though only the active channel changed. Per-key
// writes touch only the active channel (~1/Nth of the work and the MMKV write).
//
// Native only: the `.web.ts` sibling is a no-op so web keeps the Legend State
// IndexedDB persistence (its writes are async/off the main thread).
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

export const loadPersistedRecentMessages = (): Record<
  string,
  AnyChatMessageType[]
> => {
  migrateLegacyBlob();

  const result: Record<string, AnyChatMessageType[]> = {};
  for (const channelId of storage.getAllKeys()) {
    const raw = storage.getString(channelId);
    if (!raw) {
      continue;
    }
    try {
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
