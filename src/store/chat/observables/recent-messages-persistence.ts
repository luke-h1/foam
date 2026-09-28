import { createMMKV } from 'react-native-mmkv';

import { CHAT_RECENT_MESSAGES_PERSISTENCE_KEY } from '@app/lib/observable-persistence';

import type { AnyChatMessageType } from '../types/constants';

// One MMKV key per channel: the whole-map approach re-stringified every cached
// channel per sync (~690KB, #594). Native only - the `.web.ts` sibling no-ops.
export const RECENT_MESSAGES_PERSISTENCE_ENABLED = true;

const storage = createMMKV({ id: 'chat-recent-messages' });

// Cached messages hold parsed tokens, so a token `type` rename makes every older
// blob render against variants the code no longer knows. Bump this whenever the
// persisted message shape changes; a mismatch drops the cache instead.
const SCHEMA_VERSION = '2';
const SCHEMA_VERSION_KEY = '__schema_version';

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

// Drops every cached channel when the persisted shape predates SCHEMA_VERSION.
const dropCacheOnSchemaChange = () => {
  if (storage.getString(SCHEMA_VERSION_KEY) === SCHEMA_VERSION) {
    return false;
  }

  storage.clearAll();
  storage.set(SCHEMA_VERSION_KEY, SCHEMA_VERSION);
  return true;
};

export const loadPersistedRecentMessages = () => {
  migrateLegacyBlob();

  const result: Record<string, AnyChatMessageType[]> = {};

  if (dropCacheOnSchemaChange()) {
    return result;
  }

  for (const channelId of storage.getAllKeys()) {
    if (channelId === SCHEMA_VERSION_KEY) {
      continue;
    }

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
  storage.set(SCHEMA_VERSION_KEY, SCHEMA_VERSION);
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
  storage.set(SCHEMA_VERSION_KEY, SCHEMA_VERSION);
};
